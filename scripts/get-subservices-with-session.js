const fs = require('fs');
const path = require('path');

// Your session_id
const SESSION_ID = 'pstf9133flgmnuvedcbn324o1s';
const CRM_BASE_URL = 'https://crm.icesco.org';

async function getAllSubservices() {
  try {
    console.log('📋 Fetching all subservices...');
    console.log('Using session ID:', SESSION_ID.substring(0, 10) + '...');
    
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'get_entries',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: SESSION_ID,
          module_name: 'ms_subservice',
          query: '',
          order_by: 'name',
          offset: 0,
          select_fields: [
            'id',
            'name',
            'name_ar_c',
            'name_fr_c',
            'description',
            'description_subservice',
            'description_subservice_ar_c',
            'description_subservice_fr_c',
            'ms_service_ms_subservice_1'
          ],
          link_name_to_fields_array: [{
            name: 'ms_service_ms_subservice_1',
            value: ['id', 'name', 'code', 'title']
          }],
          max_results: 1000,
          deleted: 0
        })
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log('Raw response length:', responseText.length);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Response text:', responseText);
      return;
    }
    
    if (data.entry_list) {
      console.log(`✅ Found ${data.entry_list.length} subservices`);
      return data.entry_list;
    } else {
      console.log('❌ No subservices found:', data);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching subservices:', error);
    throw error;
  }
}

function processSubservicesData(subservices) {
  console.log('🔄 Processing subservices data...');
  
  const serviceSubservicesData = {};
  
  subservices.forEach(entry => {
    const obj = {};
    
    // Process name_value_list fields
    if (entry.name_value_list) {
      entry.name_value_list.forEach(field => {
        obj[field.name] = field.value;
      });
    }
    
    // Get service ID from relationship
    let serviceId = null;
    if (entry.link_list && entry.link_list.ms_service_ms_subservice_1) {
      const serviceData = entry.link_list.ms_service_ms_subservice_1;
      if (serviceData.length > 0) {
        const service = serviceData[0];
        serviceId = service.id?.value || service.id;
      }
    }
    
    // Also check the direct field
    if (!serviceId && obj.ms_service_ms_subservice_1) {
      serviceId = obj.ms_service_ms_subservice_1;
    }
    
    if (serviceId) {
      // Initialize service array if it doesn't exist
      if (!serviceSubservicesData[serviceId]) {
        serviceSubservicesData[serviceId] = [];
      }
      
      // Add subservice to the service
      serviceSubservicesData[serviceId].push({
        id: obj.id,
        name: obj.name,
        name_ar_c: obj.name_ar_c || '',
        name_fr_c: obj.name_fr_c || '',
        description: obj.description || '',
        description_subservice: obj.description_subservice || '',
        description_subservice_ar_c: obj.description_subservice_ar_c || '',
        description_subservice_fr_c: obj.description_subservice_fr_c || ''
      });
    }
  });
  
  console.log(`✅ Processed ${Object.keys(serviceSubservicesData).length} services with subservices`);
  return serviceSubservicesData;
}

function generateDataFile(serviceSubservicesData) {
  console.log('📝 Generating TypeScript data file...');
  
  const timestamp = new Date().toISOString();
  
  const fileContent = `// Service-Subservices data exported from CRM
// Generated on: ${timestamp}
// Total services: ${Object.keys(serviceSubservicesData).length}
// Total subservices: ${Object.values(serviceSubservicesData).flat().length}

export interface Subservice {
  id: string;
  name: string;
  name_ar_c: string;
  name_fr_c: string;
  description: string;
  description_subservice: string;
  description_subservice_ar_c: string;
  description_subservice_fr_c: string;
}

export const serviceSubservicesData: Record<string, Subservice[]> = ${JSON.stringify(serviceSubservicesData, null, 2)};

// Helper functions
export const getSubservicesByServiceId = (serviceId: string): Subservice[] => {
  return serviceSubservicesData[serviceId] || [];
};

export const getSubserviceById = (subserviceId: string): Subservice | null => {
  for (const serviceId in serviceSubservicesData) {
    const subservice = serviceSubservicesData[serviceId].find(s => s.id === subserviceId);
    if (subservice) return subservice;
  }
  return null;
};

export const getAllServiceIds = (): string[] => {
  return Object.keys(serviceSubservicesData);
};

export const getAllSubservices = (): Subservice[] => {
  return Object.values(serviceSubservicesData).flat();
};

// Export summary
export const dataSummary = {
  totalServices: Object.keys(serviceSubservicesData).length,
  totalSubservices: Object.values(serviceSubservicesData).flat().length,
  exportDate: timestamp
};
`;
  
  return fileContent;
}

async function main() {
  try {
    console.log('🚀 Starting subservices export...');
    console.log('=====================================');
    
    // Fetch all subservices
    const subservices = await getAllSubservices();
    
    if (subservices.length === 0) {
      console.log('❌ No subservices found. Exiting.');
      return;
    }
    
    // Process the data into the required format
    const serviceSubservicesData = processSubservicesData(subservices);
    
    // Generate the data file content
    const fileContent = generateDataFile(serviceSubservicesData);
    
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
    console.log(`📊 Total services: ${Object.keys(serviceSubservicesData).length}`);
    console.log(`📊 Total subservices: ${Object.values(serviceSubservicesData).flat().length}`);
    
    // Save raw data as JSON for backup
    const jsonPath = path.join(dataDir, 'subservices-raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      exportDate: new Date().toISOString(),
      serviceSubservicesData: serviceSubservicesData,
      rawSubservices: subservices
    }, null, 2), 'utf8');
    
    console.log(`📄 Raw data saved to: ${jsonPath}`);
    
    // Show sample data
    const firstServiceId = Object.keys(serviceSubservicesData)[0];
    if (firstServiceId) {
      console.log(`📋 Sample data for service ${firstServiceId}:`);
      console.log(JSON.stringify(serviceSubservicesData[firstServiceId].slice(0, 2), null, 2));
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the script
main();








