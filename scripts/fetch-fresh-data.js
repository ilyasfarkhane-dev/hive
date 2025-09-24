const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// CRM Configuration
const CRM_BASE_URL = 'http://3.145.21.11';
const CRM_USER = 'portal';
const CRM_PASS = 'Portal@2025';
const CRM_URL = `${CRM_BASE_URL}/service/v4_1/rest.php`;

// 1️⃣ Login to CRM
async function login() {
  try {
    console.log('🔐 Logging into CRM...');
    
    const hashedPassword = crypto.createHash('md5').update(CRM_PASS).digest('hex');
    
    const response = await axios.post(CRM_URL, {
      method: "login",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        user_auth: {
          user_name: CRM_USER,
          password: hashedPassword,
        },
        application_name: 'MyApp',
      }),
    }, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    console.log('✅ Login successful');
    return response.data.id;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Server is not responding. Please check if the CRM server is running.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timed out. Server might be slow or unreachable.');
    }
    throw error;
  }
}

// 2️⃣ Get all subservices with their service relationships
async function getAllSubservicesWithServices(sessionId) {
  try {
    console.log('📋 Fetching all subservices with service relationships...');
    
    const response = await axios.post(CRM_URL, {
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: "ms_subservice",
        query: "",
        order_by: "name",
        offset: 0,
        select_fields: [
          "id",
          "name",
          "name_ar_c",
          "name_fr_c",
          "description",
          "description_subservice",
          "description_subservice_ar_c",
          "description_subservice_fr_c"
        ],
        link_name_to_fields_array: [{
          name: "ms_service_ms_subservice_1",
          value: ["id", "name", "code", "title"]
        }],
        max_results: 1000,
        deleted: 0,
      }),
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    console.log('Response status:', response.status);
    
    if (response.data.entry_list) {
      console.log(`✅ Found ${response.data.entry_list.length} subservices`);
      return response.data.entry_list;
    } else {
      console.log('❌ No subservices found:', response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching subservices:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// 3️⃣ Process data into serviceSubservicesData format
function processToServiceSubservicesData(subservices) {
  console.log('🔄 Processing data into serviceSubservicesData format...');
  
  const serviceSubservicesData = {};
  
  subservices.forEach(entry => {
    const obj = {};
    
    // Process name_value_list fields
    if (entry.name_value_list) {
      if (Array.isArray(entry.name_value_list)) {
        // Handle array format
        entry.name_value_list.forEach(field => {
          obj[field.name] = field.value;
        });
      } else if (typeof entry.name_value_list === 'object') {
        // Handle object format - iterate through properties
        Object.keys(entry.name_value_list).forEach(fieldName => {
          const field = entry.name_value_list[fieldName];
          if (field && typeof field === 'object' && field.value !== undefined) {
            obj[fieldName] = field.value;
          } else {
            obj[fieldName] = field;
          }
        });
      }
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
      
      // Add subservice to the service
      serviceSubservicesData[serviceId].push({
        id: obj.id,
        name: obj.name || '',
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

// 4️⃣ Generate TypeScript data file
function generateDataFile(serviceSubservicesData) {
  console.log('📝 Generating updated TypeScript data file...');
  
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

// 5️⃣ Main function
async function main() {
  try {
    console.log('🚀 Fetching FRESH data from CRM...');
    console.log('=====================================');
    console.log('This will overwrite your existing data with the latest from CRM');
    console.log('=====================================');
    
    const sessionId = await login();
    const subservices = await getAllSubservicesWithServices(sessionId);
    
    if (subservices.length === 0) {
      console.log('❌ No subservices found. Exiting.');
      return;
    }
    
    // Process into the exact format you want
    const serviceSubservicesData = processToServiceSubservicesData(subservices);
    
    // Generate the updated data file
    const fileContent = generateDataFile(serviceSubservicesData);
    
    // Save to Data/sub-service/data.ts (overwrite existing)
    const dataDir = path.join(__dirname, '..', 'Data', 'sub-service');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, 'data.ts');
    
    // Backup existing file
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(dataDir, `data-backup-${Date.now()}.ts`);
      fs.copyFileSync(filePath, backupPath);
      console.log(`📄 Backed up existing file to: ${backupPath}`);
    }
    
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    console.log('=====================================');
    console.log('✅ Fresh data fetched and saved successfully!');
    console.log(`📄 File saved to: ${filePath}`);
    console.log(`📊 Total services: ${Object.keys(serviceSubservicesData).length}`);
    console.log(`📊 Total subservices: ${Object.values(serviceSubservicesData).flat().length}`);
    
    // Show sample data
    const firstServiceId = Object.keys(serviceSubservicesData)[0];
    if (firstServiceId) {
      console.log(`\n📋 Sample data for first service:`);
      console.log(JSON.stringify(serviceSubservicesData[firstServiceId].slice(0, 2), null, 2));
    }
    
    // Save raw data backup
    const jsonPath = path.join(dataDir, 'fresh-data-raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      exportDate: new Date().toISOString(),
      serviceSubservicesData: serviceSubservicesData,
      rawSubservices: subservices
    }, null, 2), 'utf8');
    
    console.log(`📄 Raw backup saved to: ${jsonPath}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if the CRM server is running');
    console.log('2. Verify your network connection');
    console.log('3. Try again in a few minutes if server is slow');
    process.exit(1);
  }
}

// Run the script
main();
