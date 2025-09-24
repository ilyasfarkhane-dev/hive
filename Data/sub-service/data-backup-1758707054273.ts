// Service-Subservices data exported from CRM
// Generated on: 2025-09-24T09:43:58.124Z
// Total services: 0
// Total subservices: 0
// Relationship: ms_service_ms_subservice_1 (Services -> Subservices, One to Many)

export const serviceSubservicesData = {};

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
