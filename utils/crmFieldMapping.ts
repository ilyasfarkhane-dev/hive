/**
 * CRM Field Mapping Utilities
 * Handles dynamic mapping between our project data and ICESC CRM fields
 */

export interface CRMFieldMapping {
  [key: string]: {
    crmField: string;
    type: 'string' | 'multienum' | 'enum' | 'currency' | 'date' | 'text' | 'array';
    enumValues?: { [key: string]: string };
    maxLength?: number;
    required?: boolean;
    customMapping?: (value: any) => any;
  };
}

/**
 * Field mapping configuration for icesc_project_suggestions module
 */
export const ICESC_FIELD_MAPPING: CRMFieldMapping = {
  // Basic project information
  name: {
    crmField: 'name',
    type: 'string',
    maxLength: 255,
    required: true
  },
  description: {
    crmField: 'description',
    type: 'text',
    required: false // Made optional for drafts
  },
  problem_statement: {
    crmField: 'problem_statement',
    type: 'string',
    maxLength: 255,
    required: true
  },

  // Beneficiaries
  beneficiaries: {
    crmField: 'beneficiaries',
    type: 'multienum',
    enumValues: {
      'Students': 'Students',
      'Teachers': 'Teachers',
      'Youth': 'Youth',
      'General Public': 'GeneralPublic',
      'Policymakers': 'Policymakers',
      'Other': 'Other'
    },
    required: true
  },
  other_beneficiaries: {
    crmField: 'otherbeneficiary',
    type: 'string',
    maxLength: 255
  },

  // Budget and timeline
  budget_icesco: {
    crmField: 'budget_icesco',
    type: 'currency',
    maxLength: 26
  },
  budget_member_state: {
    crmField: 'budget_member_state',
    type: 'currency',
    maxLength: 26,
    required: true
  },
  budget_sponsorship: {
    crmField: 'budget_sponsorship',
    type: 'currency',
    maxLength: 26,
    required: true
  },
  start_date: {
    crmField: 'date_start',
    type: 'date',
    required: true
  },
  end_date: {
    crmField: 'date_end',
    type: 'date',
    required: true
  },

  // Project frequency
  frequency: {
    crmField: 'project_frequency',
    type: 'enum',
    enumValues: {
      'One-time': 'Onetime',
      'Continuous': 'Continuous'
    },
    maxLength: 100,
    required: true
  },
  frequency_duration: {
    crmField: 'frequency_duration',
    type: 'string',
    maxLength: 255
  },

  // Partners (mapped to partner1-5)
  partners: {
    crmField: 'partners',
    type: 'array',
    maxLength: 5, // Maximum 5 partners
    // Custom mapping function to split into individual partner fields
    customMapping: (value: string[]) => {
      const partnerFields: { [key: string]: string } = {};
      for (let i = 0; i < 5; i++) {
        partnerFields[`partner${i + 1}`] = value[i] || '';
      }
      return partnerFields;
    }
  },

  // Delivery modality
  delivery_modality: {
    crmField: 'delivery_modality',
    type: 'enum',
    enumValues: {
      'Physical': 'Physical',
      'Virtual': 'Virtual',
      'Hybrid': 'Hybrid'
    },
    maxLength: 100,
    required: true
  },

  // Geographic scope
  geographic_scope: {
    crmField: 'geographic_scope',
    type: 'enum',
    enumValues: {
      'National': 'National',
      'Regional': 'Regional',
      'International': 'International'
    },
    maxLength: 100,
    required: true
  },

  // Project type
  project_type: {
    crmField: 'project_type',
    type: 'enum',
    enumValues: {
      'Training': 'Training',
      'Workshop': 'Workshop',
      'Conference': 'Conference',
      'Campaign': 'Campaign',
      'Research': 'Research',
      'Other': 'Other'
    },
    maxLength: 100,
    required: true
  },
  project_type_other: {
    crmField: 'convening_method_other',
    type: 'string',
    maxLength: 255
  },

  // Milestones (mapped to milestones1-5)
  milestones: {
    crmField: 'milestones',
    type: 'array',
    maxLength: 5, // Maximum 5 milestones
    // Custom mapping function to split into individual milestone fields
    customMapping: (value: string[]) => {
      const milestoneFields: { [key: string]: string } = {};
      for (let i = 0; i < 5; i++) {
        milestoneFields[`milestones${i + 1}`] = value[i] || '';
      }
      return milestoneFields;
    }
  },

  // Expected outputs
  expected_outputs: {
    crmField: 'expected_outputs',
    type: 'text'
  },

  // KPIs (mapped to kpis1-5)
  kpis: {
    crmField: 'kpis',
    type: 'array',
    maxLength: 5, // Maximum 5 KPIs
    // Custom mapping function to split into individual KPI fields
    customMapping: (value: string[]) => {
      const kpiFields: { [key: string]: string } = {};
      for (let i = 0; i < 5; i++) {
        kpiFields[`kpis${i + 1}`] = value[i] || '';
      }
      return kpiFields;
    }
  },

  // Contact information
  contact_name: {
    crmField: 'contact_name',
    type: 'string',
    maxLength: 255,
    required: false // Made optional for drafts
  },
  contact_email: {
    crmField: 'contact_email',
    type: 'string',
    maxLength: 255,
    required: false // Made optional for drafts
  },
  contact_phone: {
    crmField: 'contact_phone',
    type: 'string',
    maxLength: 255,
    required: false // Made optional for drafts
  },
  contact_role: {
    crmField: 'contact_role',
    type: 'string',
    maxLength: 255,
    required: false // Made optional for drafts
  },
  contact_id: {
    crmField: 'contact_id',
    type: 'string',
    maxLength: 36
  },

  // Additional information
  comments: {
    crmField: 'comments',
    type: 'text'
  },

  // Status field
  status: {
    crmField: 'status_c',
    type: 'enum',
    enumValues: {
      'Published': 'Published',
      'Draft': 'Draft'
    },
    maxLength: 100,
    required: true
  },

  // Strategic relationship fields
  strategic_goal_id: {
    crmField: 'strategic_goal_id',
    type: 'string',
    maxLength: 255
  },
  strategic_goal: {
    crmField: 'strategic_goal',
    type: 'string',
    maxLength: 255
  },
  pillar_id: {
    crmField: 'pillar_id',
    type: 'string',
    maxLength: 255
  },
  pillar: {
    crmField: 'pillar',
    type: 'string',
    maxLength: 255
  },
  service_id: {
    crmField: 'service_id',
    type: 'string',
    maxLength: 255
  },
  service: {
    crmField: 'service',
    type: 'string',
    maxLength: 255
  },
  sub_service_id: {
    crmField: 'sub_service_id',
    type: 'string',
    maxLength: 255
  },
  sub_service: {
    crmField: 'sub_service',
    type: 'string',
    maxLength: 255
  }
};

/**
 * Convert project data to CRM format using field mapping
 */
export function mapProjectDataToCRM(projectData: any): any[] {
  const nameValueList: any[] = [];

  // Helper function to add field
  const addField = (name: string, value: any) => {
    if (value !== undefined && value !== null && value !== '') {
      nameValueList.push({ name, value });
    }
  };

  // Process each field according to mapping
  Object.entries(ICESC_FIELD_MAPPING).forEach(([projectField, mapping]) => {
    const value = projectData[projectField];
    
    if (value === undefined || value === null || value === '') {
      return;
    }

    switch (mapping.type) {
      case 'multienum':
        if (Array.isArray(value)) {
          const mappedValues = value.map(v => {
            const enumValue = mapping.enumValues?.[v];
            return enumValue || v;
          });
          addField(mapping.crmField, mappedValues.join('^,^'));
        }
        break;

      case 'enum':
        const enumValue = mapping.enumValues?.[value];
        addField(mapping.crmField, enumValue || value);
        break;

      case 'array':
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (index < (mapping.maxLength || 5)) {
              // Special handling for different field types
              if (mapping.crmField === 'partners') {
                addField(`partner${index + 1}`, item);
              } else if (mapping.crmField === 'milestones') {
                addField(`milestones${index + 1}`, item);
              } else if (mapping.crmField === 'kpis') {
                addField(`kpis${index + 1}`, item);
              } else {
                addField(`${mapping.crmField}${index + 1}`, item);
              }
            }
          });
        }
        break;

      case 'currency':
      case 'date':
      case 'string':
      case 'text':
        // Handle arrays in text fields by concatenating them
        if (Array.isArray(value)) {
          addField(mapping.crmField, value.join('; '));
        } else {
          addField(mapping.crmField, value);
        }
        break;

      default:
        // Handle arrays in default case
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (index < 5) { // Default max length of 5
              addField(`${mapping.crmField}${index + 1}`, item);
            }
          });
        } else {
          addField(mapping.crmField, value);
        }
    }
  });

  return nameValueList;
}

/**
 * Validate project data against CRM field requirements
 */
export function validateProjectData(projectData: any, isDraft: boolean = false): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(ICESC_FIELD_MAPPING).forEach(([projectField, mapping]) => {
    // For drafts, only validate title field
    if (isDraft && projectField !== 'name') {
      return;
    }

    // For non-drafts, check if field is required
    if (mapping.required && !isDraft) {
      const value = projectData[projectField];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        errors.push(`Field '${projectField}' is required`);
      }
    }

    if (mapping.maxLength && projectData[projectField]) {
      const value = projectData[projectField];
      if (typeof value === 'string' && value.length > mapping.maxLength) {
        errors.push(`Field '${projectField}' exceeds maximum length of ${mapping.maxLength}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}


/**
 * Get CRM field information for debugging
 */
export function getCRMFieldInfo(fieldName: string): any {
  const mapping = Object.entries(ICESC_FIELD_MAPPING).find(
    ([_, config]) => config.crmField === fieldName
  );
  
  return mapping ? mapping[1] : null;
}
