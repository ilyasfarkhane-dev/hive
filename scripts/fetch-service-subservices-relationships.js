const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const CRM_URL = `${process.env.CRM_BASE_URL}/service/v4_1/rest.php`;
const CRM_USER = process.env.CRM_ADMIN_USER || 'portal';
const CRM_PASS = process.env.CRM_ADMIN_PASS || 'Portal@2025';
const CRM_APP = 'MyApp';

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
        application_name: CRM_APP,
      }),
    });
    
    console.log('✅ Login successful');
    return response.data.id; // session_id
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// 2️⃣ Get all services
async function getAllServices(sessionId) {
  try {
    console.log('📋 Fetching all services...');
    
    const response = await axios.post(CRM_URL, {
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: "Services", // Use the correct module name
        query: "",
        order_by: "name",
        offset: 0,
        select_fields: ["id", "name"],
        link_name_to_fields_array: [],
        max_results: 1000,
        deleted: 0,
      }),
    });

    console.log('Services response:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.entry_list) {
      throw new Error('No entry_list in services response');
    }
    
    const services = response.data.entry_list.map((entry) => {
      const fields = {};
      entry.name_value_list.forEach(field => {
        fields[field.name] = field.value;
      });
      return {
        id: fields.id,
        name: fields.name,
      };
    });
    
    console.log(`✅ Found ${services.length} services`);
    return services;
  } catch (error) {
    console.error('❌ Error fetching services:', error.response?.data || error.message);
    throw error;
  }
}

// 3️⃣ Get subservices for a given service using get_relationships
async function getSubservicesByService(serviceId, serviceName, sessionId) {
  try {
    console.log(`🔗 Fetching subservices for service: ${serviceName} (${serviceId})`);
    
    const response = await axios.post(CRM_URL, {
      method: "get_relationships",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: "Services",
        module_id: serviceId,
        link_field_name: "ms_service_ms_subservice_1",
        related_module_query: "",
        related_fields: [
          "id",
          "name",
          "name_ar_c",
          "name_fr_c",
          "description",
          "description_subservice",
          "description_subservice_ar_c",
          "description_subservice_fr_c",
        ],
        related_module_link_name_to_fields_array: [],
        deleted: 0,
      }),
    });

    if (response.data.entry_list && response.data.entry_list.length > 0) {
      const subservices = response.data.entry_list.map((item) => {
        const fields = {};
        item.name_value_list.forEach(field => {
          fields[field.name] = field.value;
        });
        
        return {
          id: fields.id,
          name: fields.name || "",
          name_ar_c: fields.name_ar_c || "",
          name_fr_c: fields.name_fr_c || "",
          description: fields.description || "",
          description_subservice: fields.description_subservice || "",
          description_subservice_ar_c: fields.description_subservice_ar_c || "",
          description_subservice_fr_c: fields.description_subservice_fr_c || "",
        };
      });
      
      console.log(`  ✅ Found ${subservices.length} subservices for ${serviceName}`);
      return subservices;
    } else {
      console.log(`  ⚠️ No subservices found for ${serviceName}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching subservices for ${serviceName}:`, error.response?.data || error.message);
    return [];
  }
}

// 4️⃣ Generate TypeScript data file
function generateDataFile(serviceSubservicesData) {
  console.log('📝 Generating TypeScript data file...');
  
  const timestamp = new Date().toISOString();
  
  const fileContent = `// Service-Subservices data exported from CRM using get_relationships
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
    console.log('🚀 Fetching service-subservices data using get_relationships...');
    console.log('=====================================');
    console.log('Relationship: ms_service_ms_subservice_1 (Services -> Subservices, One to Many)');
    console.log('=====================================');
    
    const sessionId = await login();
    const services = await getAllServices(sessionId);

    const serviceSubservicesData = {};
    let totalSubservices = 0;

    console.log('\n🔄 Processing services and their subservices...');
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      console.log(`\n[${i + 1}/${services.length}] Processing service: ${service.name}`);
      
      const subservices = await getSubservicesByService(service.id, service.name, sessionId);
      
      if (subservices.length > 0) {
        serviceSubservicesData[service.id] = subservices;
        totalSubservices += subservices.length;
      }
      
      // Add a small delay to avoid overwhelming the server
      if (i < services.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n=====================================');
    console.log(`✅ Processing completed!`);
    console.log(`📊 Total services: ${Object.keys(serviceSubservicesData).length}`);
    console.log(`📊 Total subservices: ${totalSubservices}`);

    // Generate the data file
    const fileContent = generateDataFile(serviceSubservicesData);
    
    // Save to Data/sub-service/data.ts
    const dataDir = path.join(__dirname, '..', 'Data', 'sub-service');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, 'data.ts');
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    console.log(`📄 File saved to: ${filePath}`);
    
    // Show sample data
    const firstServiceId = Object.keys(serviceSubservicesData)[0];
    if (firstServiceId) {
      console.log(`\n📋 Sample data for first service:`);
      console.log(JSON.stringify(serviceSubservicesData[firstServiceId].slice(0, 2), null, 2));
    }
    
    // Save raw data backup
    const jsonPath = path.join(dataDir, 'service-subservices-raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      exportDate: new Date().toISOString(),
      serviceSubservicesData: serviceSubservicesData,
      services: services
    }, null, 2), 'utf8');
    
    console.log(`📄 Raw backup saved to: ${jsonPath}`);
    
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the script
main();
