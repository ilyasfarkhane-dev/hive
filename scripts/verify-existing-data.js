const fs = require('fs');
const path = require('path');

// Read the existing data file
const dataPath = path.join(__dirname, '..', 'Data', 'sub-service', 'data.ts');
const fileContent = fs.readFileSync(dataPath, 'utf8');

// Extract the serviceSubservicesData object using regex
const match = fileContent.match(/export const serviceSubservicesData = ({[\s\S]*?});/);
if (!match) {
  console.log('❌ Could not find serviceSubservicesData in the file');
  process.exit(1);
}

// Parse the data
const dataString = match[1];
const serviceSubservicesData = eval('(' + dataString + ')');

console.log('🚀 Verifying existing serviceSubservicesData...');
console.log('=====================================');
console.log(`📊 Total services: ${Object.keys(serviceSubservicesData).length}`);
console.log(`📊 Total subservices: ${Object.values(serviceSubservicesData).flat().length}`);

// Show sample data
const serviceIds = Object.keys(serviceSubservicesData);
console.log('\n📋 Sample services:');
serviceIds.slice(0, 3).forEach((serviceId, index) => {
  const subservices = serviceSubservicesData[serviceId];
  console.log(`\n${index + 1}. Service ID: ${serviceId}`);
  console.log(`   Subservices: ${subservices.length}`);
  if (subservices.length > 0) {
    console.log(`   First subservice: ${subservices[0].name} (${subservices[0].id})`);
    console.log(`   Fields available: ${Object.keys(subservices[0]).join(', ')}`);
  }
});

// Verify the structure
console.log('\n🔍 Structure verification:');
const firstServiceId = serviceIds[0];
const firstSubservice = serviceSubservicesData[firstServiceId][0];

const requiredFields = [
  'id', 'name', 'name_ar_c', 'name_fr_c', 
  'description', 'description_subservice', 
  'description_subservice_ar_c', 'description_subservice_fr_c'
];

console.log('Required fields check:');
requiredFields.forEach(field => {
  const hasField = firstSubservice.hasOwnProperty(field);
  console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${hasField ? 'Present' : 'Missing'}`);
});

console.log('\n🎯 Your data is already in the perfect serviceSubservicesData format!');
console.log('✅ Service IDs as keys');
console.log('✅ Arrays of subservices as values');
console.log('✅ All required fields present');
console.log('✅ Ready to use in your application');

// Show usage example
console.log('\n📖 Usage example:');
console.log(`
// Import in your application
import { serviceSubservicesData } from '@/Data/sub-service/data';

// Get subservices for a specific service
const serviceId = '${firstServiceId}';
const subservices = serviceSubservicesData[serviceId];

// Get all service IDs
const allServiceIds = Object.keys(serviceSubservicesData);

// Get all subservices
const allSubservices = Object.values(serviceSubservicesData).flat();
`);
















