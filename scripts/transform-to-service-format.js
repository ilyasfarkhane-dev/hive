const fs = require('fs');
const path = require('path');

// Read the existing data file
function readExistingData() {
  try {
    const dataPath = path.join(__dirname, '..', 'Data', 'sub-service', 'data.ts');
    const content = fs.readFileSync(dataPath, 'utf8');
    
    // Extract the subservices array from the file
    const match = content.match(/export const subservices: Subservice\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      // Parse the JSON array
      const subservicesArray = JSON.parse(match[1]);
      console.log(`✅ Read ${subservicesArray.length} subservices from existing data`);
      return subservicesArray;
    } else {
      throw new Error('Could not find subservices array in data file');
    }
  } catch (error) {
    console.error('❌ Error reading existing data:', error);
    return [];
  }
}

function transformToServiceSubservicesData(subservices) {
  console.log('🔄 Transforming data to serviceSubservicesData format...');
  
  const serviceSubservicesData = {};
  
  subservices.forEach(subservice => {
    // Get service ID from the relationship field
    const serviceId = subservice.ms_service_ms_subservice_1 || subservice.service?.id;
    
    if (serviceId) {
      // Initialize service array if it doesn't exist
      if (!serviceSubservicesData[serviceId]) {
        serviceSubservicesData[serviceId] = [];
      }
      
      // Add subservice to the service
      serviceSubservicesData[serviceId].push({
        id: subservice.id,
        name: subservice.name,
        name_ar_c: '', // These fields might not be in the existing data
        name_fr_c: '',
        description: subservice.description || '',
        description_subservice: '',
        description_subservice_ar_c: '',
        description_subservice_fr_c: ''
      });
    }
  });
  
  console.log(`✅ Transformed to ${Object.keys(serviceSubservicesData).length} services with subservices`);
  return serviceSubservicesData;
}

function generateServiceSubservicesDataFile(serviceSubservicesData) {
  console.log('📝 Generating serviceSubservicesData file...');
  
  const timestamp = new Date().toISOString();
  
  const fileContent = `// Service-Subservices data transformed from existing data
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

function main() {
  try {
    console.log('🚀 Transforming existing data to serviceSubservicesData format...');
    console.log('=====================================');
    
    // Read existing data
    const subservices = readExistingData();
    
    if (subservices.length === 0) {
      console.log('❌ No subservices found in existing data. Exiting.');
      return;
    }
    
    // Transform to the format you want
    const serviceSubservicesData = transformToServiceSubservicesData(subservices);
    
    // Generate the new file
    const fileContent = generateServiceSubservicesDataFile(serviceSubservicesData);
    
    // Save the file
    const dataDir = path.join(__dirname, '..', 'Data', 'sub-service');
    const filePath = path.join(dataDir, 'service-subservices-data.ts');
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    console.log('=====================================');
    console.log('✅ Transformation completed successfully!');
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
    const jsonPath = path.join(dataDir, 'service-subservices-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(serviceSubservicesData, null, 2), 'utf8');
    
    console.log(`📄 JSON backup saved to: ${jsonPath}`);
    
  } catch (error) {
    console.error('❌ Transformation failed:', error);
    process.exit(1);
  }
}

// Run it
main();
















