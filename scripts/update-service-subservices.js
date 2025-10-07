const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// CRM Configuration
const CRM_BASE_URL = 'https://crm.icesco.org';
const CRM_ADMIN_USER = 'portal';
const CRM_ADMIN_PASS = 'Portal@2025';

async function getSessionId() {
  try {
    console.log('🔐 Getting session ID...');
    
    const hashedPassword = crypto.createHash('md5').update(CRM_ADMIN_PASS).digest('hex');
    
    const loginData = JSON.stringify({
      user_auth: {
        user_name: CRM_ADMIN_USER,
        password: hashedPassword
      },
      application_name: 'MyApp'
    });
    
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'login',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: loginData
      })
    });

    const data = await response.json();
    
    if (data.id) {
      console.log('✅ Session ID obtained successfully');
      return data.id;
    } else {
      throw new Error(`Failed to get session ID: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('❌ Error getting session ID:', error);
    throw error;
  }
}

async function fetchSubservicesWithServiceRelation(sessionId) {
  try {
    console.log('📋 Fetching subservices with service relationships...');
    
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
    console.log('Response length:', responseText.length);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Response preview:', responseText.substring(0, 1000));
      return [];
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

function processToServiceSubservicesData(subservices) {
  console.log('🔄 Processing data into serviceSubservicesData format...');
  
  const serviceSubservicesData = {};
  
  subservices.forEach(entry => {
    const obj = {};
    
    // Process name_value_list fields
    if (entry.name_value_list) {
      entry.name_value_list.forEach(field => {
        obj[field.name] = field.value;
      });
    }
    
    // Get service ID from the ms_service_ms_subservice_1 relationship
    let serviceId = null;
    
    // First try to get from link_list (relationship data)
    if (entry.link_list && entry.link_list.ms_service_ms_subservice_1) {
      const serviceData = entry.link_list.ms_service_ms_subservice_1;
      if (serviceData.length > 0) {
        const service = serviceData[0];
        serviceId = service.id?.value || service.id;
      }
    }
    
    // Fallback to direct field
    if (!serviceId && obj.ms_service_ms_subservice_1) {
      serviceId = obj.ms_service_ms_subservice_1;
    }
    
    if (serviceId) {
      // Initialize service array if it doesn't exist
      if (!serviceSubservicesData[serviceId]) {
        serviceSubservicesData[serviceId] = [];
      }
      
      // Add subservice to the service (exactly like your format)
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
    } else {
      console.log(`⚠️ Subservice ${obj.id} has no service relationship`);
    }
  });
  
  console.log(`✅ Processed ${Object.keys(serviceSubservicesData).length} services with subservices`);
  return serviceSubservicesData;
}

function generateUpdatedDataFile(serviceSubservicesData) {
  console.log('📝 Generating updated serviceSubservicesData file...');
  
  const timestamp = new Date().toISOString();
  
  const fileContent = `// Service-Subservices data exported from CRM
// Generated on: ${timestamp}
// Total services: ${Object.keys(serviceSubservicesData).length}
// Total subservices: ${Object.values(serviceSubservicesData).flat().length}
// Relationship: ms_service_ms_subservice_1 (Services -> Subservices, One to Many)

export const serviceSubservicesData = ${JSON.stringify(serviceSubservicesData, null, 2)};

// Helper functions
export const getSubservicesByServiceId = (serviceId: string) => {
  return serviceSubservicesData[serviceId] || [];
};

export const getSubserviceById = (subserviceId: string) => {
  for (const serviceId in serviceSubservicesData) {
    const subservice = serviceSubservicesData[serviceId].find(s => s.id === subserviceId);
    if (subservice) return subservice;
  }
  return null;
};

export const getAllServiceIds = () => {
  return Object.keys(serviceSubservicesData);
};

export const getAllSubservices = () => {
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
    console.log('🚀 Updating serviceSubservicesData from CRM...');
    console.log('=====================================');
    console.log('Relationship: ms_service_ms_subservice_1 (Services -> Subservices, One to Many)');
    console.log('=====================================');
    
    // Get session ID
    const sessionId = await getSessionId();
    
    // Fetch subservices with service relationships
    const subservices = await fetchSubservicesWithServiceRelation(sessionId);
    
    if (subservices.length === 0) {
      console.log('❌ No subservices found. Exiting.');
      return;
    }
    
    // Process into the exact format you want
    const serviceSubservicesData = processToServiceSubservicesData(subservices);
    
    // Generate the updated data file
    const fileContent = generateUpdatedDataFile(serviceSubservicesData);
    
    // Save to Data/sub-service/data.ts (overwrite existing)
    const dataDir = path.join(__dirname, '..', 'Data', 'sub-service');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, 'data.ts');
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    console.log('=====================================');
    console.log('✅ Service-Subservices data updated successfully!');
    console.log(`📄 File saved to: ${filePath}`);
    console.log(`📊 Total services: ${Object.keys(serviceSubservicesData).length}`);
    console.log(`📊 Total subservices: ${Object.values(serviceSubservicesData).flat().length}`);
    
    // Show sample data
    const firstServiceId = Object.keys(serviceSubservicesData)[0];
    if (firstServiceId) {
      console.log(`📋 Sample data for service ${firstServiceId}:`);
      console.log(JSON.stringify(serviceSubservicesData[firstServiceId].slice(0, 2), null, 2));
    }
    
    // Save raw data backup
    const jsonPath = path.join(dataDir, 'service-subservices-raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      exportDate: new Date().toISOString(),
      serviceSubservicesData: serviceSubservicesData,
      rawSubservices: subservices
    }, null, 2), 'utf8');
    
    console.log(`📄 Raw backup saved to: ${jsonPath}`);
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

// Run the script
main();















