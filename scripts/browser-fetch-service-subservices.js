// Browser script to fetch subservices with service relationships
// Copy and paste this in browser console after logging in

async function fetchServiceSubservices() {
  try {
    // Get session_id from localStorage
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      console.log('❌ No session_id found. Please login first.');
      return;
    }
    
    console.log('🚀 Fetching subservices with service relationships from CRM...');
    console.log('Session ID:', sessionId.substring(0, 10) + '...');
    console.log('Relationship: ms_service_ms_subservice_1 (Services -> Subservices, One to Many)');
    
    // Fetch subservices with service relationships
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
          select_fields: [
            'id',
            'name',
            'name_ar_c',
            'name_fr_c',
            'description',
            'description_subservice',
            'description_subservice_ar_c',
            'description_subservice_fr_c',
            'ms_service_ms_subservice_1' // Service relationship field
          ],
          link_name_to_fields_array: [{
            name: 'ms_service_ms_subservice_1', // Service relationship
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
    
    const data = await response.json();
    
    if (data.entry_list) {
      console.log(`✅ Found ${data.entry_list.length} subservices`);
      
      // Process data into serviceSubservicesData format
      const serviceSubservicesData = {};
      
      data.entry_list.forEach(entry => {
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
      
      // Generate TypeScript file content
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
      
      // Download the file
      const blob = new Blob([fileContent], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'service-subservices-data.ts';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📄 File downloaded: service-subservices-data.ts');
      console.log('📊 Total services:', Object.keys(serviceSubservicesData).length);
      console.log('📊 Total subservices:', Object.values(serviceSubservicesData).flat().length);
      
      // Show sample data
      const firstServiceId = Object.keys(serviceSubservicesData)[0];
      if (firstServiceId) {
        console.log(`📋 Sample data for service ${firstServiceId}:`);
        console.log(JSON.stringify(serviceSubservicesData[firstServiceId].slice(0, 2), null, 2));
      }
      
      return serviceSubservicesData;
    } else {
      console.log('❌ No subservices found:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
console.log('📋 SERVICE-SUBSERVICES EXPORT SCRIPT');
console.log('=====================================');
console.log('This script will fetch subservices with service relationships from CRM.');
console.log('Relationship: ms_service_ms_subservice_1 (Services -> Subservices, One to Many)');
console.log('Make sure you are logged in to the application first.');
console.log('');
console.log('Running export...');
fetchServiceSubservices();















