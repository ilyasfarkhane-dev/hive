// Browser-based script to export subservices from CRM
// Run this in the browser console after logging in

// CRM Configuration
const CRM_BASE_URL = 'https://crm.icesco.org';

// Function to get session ID from localStorage
function getSessionId() {
  try {
    console.log('🔐 Getting session ID from localStorage...');
    
    const sessionId = localStorage.getItem('session_id');
    
    if (sessionId) {
      console.log('✅ Session ID found in localStorage');
      console.log('Session ID length:', sessionId.length);
      return sessionId;
    } else {
      throw new Error('No session_id found in localStorage. Please login first.');
    }
  } catch (error) {
    console.error('❌ Error getting session ID from localStorage:', error);
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

// Function to generate TypeScript data file content
function generateDataFileContent(subservices) {
  const timestamp = new Date().toISOString();
  
  return `// Subservices data exported from CRM
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
}

// Main function
async function exportSubservices() {
  try {
    console.log('🚀 Starting subservices export...');
    console.log('=====================================');
    
    // Get session ID from localStorage
    const sessionId = getSessionId();
    
    // Fetch all services and subservices
    const [services, subservices] = await Promise.all([
      getAllServices(sessionId),
      getAllSubservices(sessionId)
    ]);
    
    // Process the data
    const processedSubservices = processSubserviceData(subservices, services);
    
    // Generate the data file content
    const fileContent = generateDataFileContent(processedSubservices);
    
    console.log('=====================================');
    console.log('✅ Subservices export completed successfully!');
    console.log(`📊 Total subservices: ${processedSubservices.length}`);
    console.log(`📊 Total services: ${services.length}`);
    console.log(`📊 Subservices with service relationship: ${processedSubservices.filter(s => s.service || s.ms_service_ms_subservice_1).length}`);
    
    // Create download link for the TypeScript file
    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subservices-data.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📄 TypeScript file downloaded: subservices-data.ts');
    
    // Also create JSON backup
    const jsonBlob = new Blob([JSON.stringify({
      exportDate: new Date().toISOString(),
      services: services,
      subservices: subservices,
      processedSubservices: processedSubservices
    }, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonA = document.createElement('a');
    jsonA.href = jsonUrl;
    jsonA.download = 'subservices-raw.json';
    document.body.appendChild(jsonA);
    jsonA.click();
    document.body.removeChild(jsonA);
    URL.revokeObjectURL(jsonUrl);
    
    console.log('📄 JSON backup downloaded: subservices-raw.json');
    
    return {
      success: true,
      subservices: processedSubservices,
      services: services,
      fileContent: fileContent
    };
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Instructions
console.log('📋 SUBSERVICES EXPORT SCRIPT');
console.log('============================');
console.log('This script will export all subservices from the CRM.');
console.log('Make sure you are logged in to the application first.');
console.log('');
console.log('To run the export, execute:');
console.log('exportSubservices()');
console.log('');
console.log('The script will:');
console.log('1. Get your session ID from localStorage');
console.log('2. Fetch all subservices and services from CRM');
console.log('3. Process the relationship data');
console.log('4. Generate TypeScript data file');
console.log('5. Download the files automatically');
console.log('');
console.log('Ready to export! Run: exportSubservices()');

