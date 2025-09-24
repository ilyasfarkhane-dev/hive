const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ for built-in fetch support');
  console.log('Please upgrade to Node.js 18 or higher');
  process.exit(1);
}

// CRM Configuration
const CRM_BASE_URL = 'http://3.145.21.11';

// Function to get session ID from command line argument or prompt
function getSessionId() {
  try {
    console.log('🔐 Getting session ID...');
    
    // Check if session_id was provided as command line argument
    const args = process.argv.slice(2);
    const sessionIdArg = args.find(arg => arg.startsWith('--session-id='));
    
    if (sessionIdArg) {
      const sessionId = sessionIdArg.split('=')[1];
      console.log('✅ Session ID provided via command line argument');
      console.log('Session ID length:', sessionId.length);
      return sessionId;
    }
    
    // If no argument provided, show instructions
    console.log('❌ No session_id provided');
    console.log('');
    console.log('Usage:');
    console.log('node get-subservices.js --session-id=YOUR_SESSION_ID');
    console.log('');
    console.log('To get your session_id:');
    console.log('1. Login to the application in your browser');
    console.log('2. Open browser console (F12)');
    console.log('3. Run: localStorage.getItem("session_id")');
    console.log('4. Copy the session_id and use it in the command above');
    console.log('');
    console.log('Alternatively, use the browser script:');
    console.log('1. Login to the application');
    console.log('2. Open browser console (F12)');
    console.log('3. Copy and paste the content of get-subservices-browser.js');
    console.log('4. Run: exportSubservices()');
    
    process.exit(1);
  } catch (error) {
    console.error('❌ Error getting session ID:', error);
    throw error;
  }
}

// Function to get all subservices
async function getAllSubservices(sessionId) {
  try {
    console.log('📋 Fetching all subservices...');
    
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_entries',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'ms_subservice',
          query: '',
          order_by: 'name',
          offset: 0,
          select_fields: [
            'id',
            'name',
            'code',
            'title',
            'description',
            'date_entered',
            'date_modified',
            'created_by',
            'modified_user_id',
            'assigned_user_id',
            'deleted',
            'ms_service_ms_subservice_1' // Service relationship
          ],
          link_name_to_fields_array: [
            {
              name: 'ms_service_ms_subservice_1',
              value: ['id', 'name', 'code', 'title']
            }
          ],
          max_results: 1000,
          deleted: 0
        })
      })
    });

    const data = await response.json();
    
    if (data.entry_list) {
      console.log(`✅ Found ${data.entry_list.length} subservices`);
      return data.entry_list;
    } else {
      throw new Error(`Failed to get subservices: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('❌ Error fetching subservices:', error);
    throw error;
  }
}

// Function to get all services (for reference)
async function getAllServices(sessionId) {
  try {
    console.log('📋 Fetching all services for reference...');
    
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_entries',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'ms_service',
          query: '',
          order_by: 'name',
          offset: 0,
          select_fields: [
            'id',
            'name',
            'code',
            'title',
            'description'
          ],
          max_results: 1000,
          deleted: 0
        })
      })
    });

    const data = await response.json();
    
    if (data.entry_list) {
      console.log(`✅ Found ${data.entry_list.length} services`);
      return data.entry_list;
    } else {
      throw new Error(`Failed to get services: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    throw error;
  }
}

// Function to process subservice data
function processSubserviceData(subservices, services) {
  console.log('🔄 Processing subservice data...');
  
  // Create a map of services for quick lookup
  const serviceMap = {};
  services.forEach(service => {
    serviceMap[service.id] = {
      id: service.id,
      name: service.name,
      code: service.code,
      title: service.title
    };
  });
  
  const processedSubservices = subservices.map(entry => {
    const obj = {};
    
    // Process name_value_list fields
    if (entry.name_value_list) {
      entry.name_value_list.forEach(field => {
        obj[field.name] = field.value;
      });
    }
    
    // Process relationship data
    if (entry.link_list && entry.link_list.ms_service_ms_subservice_1) {
      const serviceData = entry.link_list.ms_service_ms_subservice_1;
      if (serviceData.length > 0) {
        const service = serviceData[0];
        obj.service = {
          id: service.id?.value || service.id,
          name: service.name?.value || service.name,
          code: service.code?.value || service.code,
          title: service.title?.value || service.title
        };
      }
    }
    
    // Add service info from the relationship field if available
    if (obj.ms_service_ms_subservice_1 && serviceMap[obj.ms_service_ms_subservice_1]) {
      obj.service = serviceMap[obj.ms_service_ms_subservice_1];
    }
    
    return obj;
  });
  
  console.log(`✅ Processed ${processedSubservices.length} subservices`);
  return processedSubservices;
}

// Function to generate TypeScript data file
function generateDataFile(subservices) {
  console.log('📝 Generating TypeScript data file...');
  
  const timestamp = new Date().toISOString();
  
  const fileContent = `// Subservices data exported from CRM
// Generated on: ${timestamp}
// Total subservices: ${subservices.length}

export interface Subservice {
  id: string;
  name: string;
  code?: string;
  title?: string;
  description?: string;
  date_entered?: string;
  date_modified?: string;
  created_by?: string;
  modified_user_id?: string;
  assigned_user_id?: string;
  deleted?: string;
  ms_service_ms_subservice_1?: string;
  service?: {
    id: string;
    name: string;
    code?: string;
    title?: string;
  };
}

export const subservices: Subservice[] = ${JSON.stringify(subservices, null, 2)};

// Helper functions
export const getSubserviceById = (id: string): Subservice | undefined => {
  return subservices.find(subservice => subservice.id === id);
};

export const getSubservicesByService = (serviceId: string): Subservice[] => {
  return subservices.filter(subservice => 
    subservice.ms_service_ms_subservice_1 === serviceId || 
    subservice.service?.id === serviceId
  );
};

export const getSubserviceByCode = (code: string): Subservice | undefined => {
  return subservices.find(subservice => subservice.code === code);
};

export const getAllSubserviceCodes = (): string[] => {
  return subservices
    .map(subservice => subservice.code)
    .filter(code => code && code.trim() !== '');
};

export const getAllSubserviceNames = (): string[] => {
  return subservices
    .map(subservice => subservice.name)
    .filter(name => name && name.trim() !== '');
};

// Export summary
export const subserviceSummary = {
  total: subservices.length,
  withCode: subservices.filter(s => s.code && s.code.trim() !== '').length,
  withService: subservices.filter(s => s.service || s.ms_service_ms_subservice_1).length,
  exportDate: timestamp
};
`;
  
  return fileContent;
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting subservices export...');
    console.log('=====================================');
    
    // Get session ID
    const sessionId = await getSessionId();
    
    // Fetch all services and subservices
    const [services, subservices] = await Promise.all([
      getAllServices(sessionId),
      getAllSubservices(sessionId)
    ]);
    
    // Process the data
    const processedSubservices = processSubserviceData(subservices, services);
    
    // Generate the data file content
    const fileContent = generateDataFile(processedSubservices);
    
    // Ensure the directory exists
    const dataDir = path.join(__dirname, '..', 'Data', 'sub-service');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory:', dataDir);
    }
    
    // Write the file
    const filePath = path.join(dataDir, 'data.ts');
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    console.log('=====================================');
    console.log('✅ Subservices export completed successfully!');
    console.log(`📄 File saved to: ${filePath}`);
    console.log(`📊 Total subservices: ${processedSubservices.length}`);
    console.log(`📊 Total services: ${services.length}`);
    console.log(`📊 Subservices with service relationship: ${processedSubservices.filter(s => s.service || s.ms_service_ms_subservice_1).length}`);
    
    // Save raw data as JSON for backup
    const jsonPath = path.join(dataDir, 'subservices-raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      exportDate: new Date().toISOString(),
      services: services,
      subservices: subservices,
      processedSubservices: processedSubservices
    }, null, 2), 'utf8');
    
    console.log(`📄 Raw data saved to: ${jsonPath}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
