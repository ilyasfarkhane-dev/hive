// Simple script to get subservices using session_id from localStorage
// Just copy and paste this in browser console after logging in

async function getSubservices() {
  try {
    // Get session_id from localStorage
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      console.log('❌ No session_id found. Please login first.');
      return;
    }
    
    console.log('✅ Found session_id:', sessionId.substring(0, 10) + '...');
    
    // Fetch subservices
    console.log('📋 Fetching subservices...');
    const response = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
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
    
    const data = await response.json();
    
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
      
      // Download the file
      const blob = new Blob([fileContent], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subservices-data.ts';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📄 File downloaded: subservices-data.ts');
      console.log('📊 Total subservices:', subservices.length);
      
      return subservices;
    } else {
      console.log('❌ No subservices found:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
console.log('🚀 Starting subservices export...');
getSubservices();














