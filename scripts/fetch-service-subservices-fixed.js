import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config SugarCRM ---
const CRM_REST_URL = "https://crm.icesco.org/service/v4_1/rest.php";
const USERNAME = "portal";
const PASSWORD = "Portal@2025";

// --- Fonction de login ---
async function login() {
  const passwordHash = crypto.createHash('md5').update(PASSWORD).digest('hex');
  
  const response = await axios.post(CRM_REST_URL, {
    method: "login",
    input_type: "JSON",
    response_type: "JSON",
    rest_data: JSON.stringify({
      user_auth: {
        user_name: USERNAME,
        password: passwordHash,
      },
      application_name: "NodeCRMApp",
    }),
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000
  });

  const data = response.data;
  if (!data || !data.id) throw new Error("Login failed");
  return data.id;
}

// --- Récupérer tous les services ---
async function getAllServices(session_id) {
  const response = await axios.post(CRM_REST_URL, {
    method: "get_entry_list",
    input_type: "JSON",
    response_type: "JSON",
    rest_data: JSON.stringify({
      session: session_id,
      module_name: "ms_service",
      query: "",
      order_by: "name ASC",
      offset: 0,
      select_fields: ["id", "name", "description"],
      max_results: 1000,
      deleted: 0
    }),
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000
  });

  return response.data.entry_list || [];
}

// --- Récupérer les subservices d'un service ---
async function getSubservices(session_id, serviceId) {
  try {
    console.log(`  🔍 Fetching subservices for service ${serviceId}...`);
    
    const response = await axios.post(CRM_REST_URL, {
      method: "get_relationships",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: session_id,
        module_name: "ms_service",
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
          "description_subservice_fr_c"
        ],
        related_module_link_name_to_fields_array: [],
        deleted: 0,
        order_by: "name",
        offset: 0,
        limit: 1000
      }),
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000
    });

    return response.data.entry_list || [];
  } catch (error) {
    console.log(`  ❌ Error fetching subservices for service ${serviceId}:`, error.message);
    if (error.response) {
      console.log(`  Response status: ${error.response.status}`);
      console.log(`  Response data:`, error.response.data);
    }
    return [];
  }
}

// --- Main ---
async function main() {
  try {
    const session_id = await login();
    console.log("✅ Logged in, session:", session_id);

    const services = await getAllServices(session_id);
    console.log(`Found ${services.length} services`);

    const result = {};
    let totalSubservices = 0;

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const serviceId = service.id;
      const serviceName = service.name_value_list.name.value;
      console.log(`\n[${i + 1}/${services.length}] Service: ${serviceName} (ID: ${serviceId})`);

      const subservices = await getSubservices(session_id, serviceId);

      if (subservices.length === 0) {
        console.log("  No subservices found");
        result[serviceId] = [];
        continue;
      }

      const formattedSubs = subservices.map((sub) => {
        const fields = {};
        
        // Handle different data structures
        if (sub.name_value_list) {
          if (Array.isArray(sub.name_value_list)) {
            // Array format
            sub.name_value_list.forEach(field => {
              fields[field.name] = field.value;
            });
          } else if (typeof sub.name_value_list === 'object') {
            // Object format
            Object.keys(sub.name_value_list).forEach(fieldName => {
              const field = sub.name_value_list[fieldName];
              if (field && typeof field === 'object' && field.value !== undefined) {
                fields[fieldName] = field.value;
              } else {
                fields[fieldName] = field;
              }
            });
          }
        }
        
        return {
          id: fields.id || sub.id,
          name: fields.name || '',
          name_ar_c: fields.name_ar_c || '',
          name_fr_c: fields.name_fr_c || '',
          description: fields.description || '',
          description_subservice: fields.description_subservice || '',
          description_subservice_ar_c: fields.description_subservice_ar_c || '',
          description_subservice_fr_c: fields.description_subservice_fr_c || ''
        };
      });

      result[serviceId] = formattedSubs;
      totalSubservices += formattedSubs.length;

      console.log(`  ✅ Found ${formattedSubs.length} subservices`);
      formattedSubs.forEach((sub) => {
        console.log(`    - ${sub.name} (ID: ${sub.id})`);
      });

      // Add a small delay to avoid overwhelming the server
      if (i < services.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Processing completed!`);
    console.log(`📊 Total services: ${Object.keys(result).length}`);
    console.log(`📊 Total subservices: ${totalSubservices}`);

    // Generate TypeScript data file
    const timestamp = new Date().toISOString();
    const fileContent = `// Service-Subservices data exported from CRM
// Generated on: ${timestamp}
// Total services: ${Object.keys(result).length}
// Total subservices: ${totalSubservices}
// Relationship: ms_service_ms_subservice_1 (Services -> Subservices, One to Many)

export interface SubserviceDetail {
  id: string;
  name: string;
  name_ar_c: string;
  name_fr_c: string;
  description: string;
  description_subservice: string;
  description_subservice_ar_c: string;
  description_subservice_fr_c: string;
}

export interface ServiceSubservicesData {
  [serviceId: string]: SubserviceDetail[];
}

export const serviceSubservicesData: ServiceSubservicesData = ${JSON.stringify(result, null, 2)};

// Helper functions
export const getSubservicesByServiceId = (serviceId: string): SubserviceDetail[] => {
  return serviceSubservicesData[serviceId] || [];
};

export const getSubserviceById = (subserviceId: string): SubserviceDetail | null => {
  for (const serviceId in serviceSubservicesData) {
    const subservice = serviceSubservicesData[serviceId].find(s => s.id === subserviceId);
    if (subservice) return subservice;
  }
  return null;
};

export const getAllServiceIds = (): string[] => {
  return Object.keys(serviceSubservicesData);
};

export const getAllSubservices = (): SubserviceDetail[] => {
  return Object.values(serviceSubservicesData).flat();
};

// Export summary
export const dataSummary = {
  totalServices: Object.keys(serviceSubservicesData).length,
  totalSubservices: Object.values(serviceSubservicesData).flat().length,
  exportDate: "${timestamp}"
};
`;

    // Save to Data/sub-service/data.ts
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
    console.log(`📄 Data saved to: ${filePath}`);

    // Save raw JSON backup
    const jsonPath = path.join(dataDir, 'service-subservices-raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      exportDate: timestamp,
      serviceSubservicesData: result,
      services: services
    }, null, 2), 'utf8');
    console.log(`📄 Raw backup saved to: ${jsonPath}`);

  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
  }
}

main();
