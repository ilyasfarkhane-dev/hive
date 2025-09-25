const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// CRM Configuration
const CRM_BASE_URL = 'https://crm.icesco.org';
const CRM_ADMIN_USER = 'portal';
const CRM_ADMIN_PASS = 'Portal@2025';

async function getSessionId() {
  try {
    console.log('🔐 Getting fresh session ID...');
    
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

async function getSubservices() {
  try {
    console.log('🚀 Starting subservices export...');
    
    // Get fresh session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId.substring(0, 10) + '...');
    
    // Fetch subservices
    console.log('📋 Fetching subservices...');
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
          select_fields: ['id', 'name', 'code', 'title', 'description', 'ms_service_ms_subservice_1'],
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
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 500) + '...');
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Full response text:', responseText);
      return;
    }
    
    if (data.entry_list) {
      console.log(`✅ Found ${data.entry_list.length} subservices`);
      
      // Process the data
      const subservices = data.entry_list.map(entry => {
        const obj = {};
        
        // Get basic fields
        if (entry.name_value_list) {
          entry.name_value_list.forEach(field => {
            obj[field.name] = field.value;
          });
        }
        
        // Get service relationship
        if (entry.link_list && entry.link_list.ms_service_ms_subservice_1) {
          const service = entry.link_list.ms_service_ms_subservice_1[0];
          obj.service = {
            id: service.id?.value || service.id,
            name: service.name?.value || service.name,
            code: service.code?.value || service.code,
            title: service.title?.value || service.title
          };
        }
        
        return obj;
      });
      
      // Generate TypeScript file content
      const fileContent = `// Subservices data exported from CRM
// Generated on: ${new Date().toISOString()}
// Total subservices: ${subservices.length}

export interface Subservice {
  id: string;
  name: string;
  code?: string;
  title?: string;
  description?: string;
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
export const getSubserviceById = (id: string) => subservices.find(s => s.id === id);
export const getSubservicesByService = (serviceId: string) => 
  subservices.filter(s => s.ms_service_ms_subservice_1 === serviceId || s.service?.id === serviceId);
export const getSubserviceByCode = (code: string) => subservices.find(s => s.code === code);
`;
      
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
      console.log(`📊 Total subservices: ${subservices.length}`);
      
      // Also save raw JSON for backup
      const jsonPath = path.join(dataDir, 'subservices-raw.json');
      fs.writeFileSync(jsonPath, JSON.stringify({
        exportDate: new Date().toISOString(),
        subservices: subservices,
        rawData: data.entry_list
      }, null, 2), 'utf8');
      
      console.log(`📄 Raw data saved to: ${jsonPath}`);
      
      return subservices;
    } else {
      console.log('❌ No subservices found:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
getSubservices();
