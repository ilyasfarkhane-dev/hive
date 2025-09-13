# ICESCO CRM Structure Guide

## Overview
This document provides a comprehensive guide to the ICESCO CRM system structure, including relationship mappings, field names, methods, and access patterns.

## CRM System Information
- **Base URL**: `http://3.145.21.11`
- **REST API Endpoint**: `http://3.145.21.11/service/v4_1/rest.php`
- **Authentication**: Session-based with admin credentials
- **API Version**: v4_1

## Core Modules

### 1. Project Suggestions Module
**Module Name**: `icesc_project_suggestions`

This is the main module for storing project proposals submitted through the ICESCO portal.

#### Key Fields
| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `name` | string | Project title | Yes |
| `description` | text | Project description | Yes |
| `problem_statement` | string | Problem statement | Yes |
| `contact_name` | string | Contact person name | Yes |
| `contact_email` | string | Contact email | Yes |
| `contact_phone` | string | Contact phone | Yes |
| `contact_role` | string | Contact role | Yes |
| `budget_icesco` | currency | ICESCO budget | No |
| `budget_member_state` | currency | Member state budget | Yes |
| `budget_sponsorship` | currency | Sponsorship budget | Yes |
| `date_start` | date | Project start date | Yes |
| `date_end` | date | Project end date | Yes |
| `project_frequency` | enum | Project frequency (Onetime/Continuous) | Yes |
| `delivery_modality` | enum | Delivery method (Physical/Virtual/Hybrid) | Yes |
| `geographic_scope` | enum | Geographic scope (National/Regional/International) | Yes |
| `project_type` | enum | Project type (Training/Workshop/Conference/Campaign/Research/Other) | Yes |
| `beneficiaries` | multienum | Target beneficiaries | Yes |
| `comments` | text | Additional comments | No |

#### Partner Fields (Array Mapping)
| Field Name | Type | Description |
|------------|------|-------------|
| `partner1` | string | First partner |
| `partner2` | string | Second partner |
| `partner3` | string | Third partner |
| `partner4` | string | Fourth partner |
| `partner5` | string | Fifth partner |

#### Milestone Fields (Array Mapping)
| Field Name | Type | Description |
|------------|------|-------------|
| `milestones1` | string | First milestone |
| `milestones2` | string | Second milestone |
| `milestones3` | string | Third milestone |
| `milestones4` | string | Fourth milestone |
| `milestones5` | string | Fifth milestone |

#### KPI Fields (Array Mapping)
| Field Name | Type | Description |
|------------|------|-------------|
| `kpis1` | string | First KPI |
| `kpis2` | string | Second KPI |
| `kpis3` | string | Third KPI |
| `kpis4` | string | Fourth KPI |
| `kpis5` | string | Fifth KPI |

#### Strategic Relationship Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `strategic_goal_id` | string | Strategic goal ID |
| `strategic_goal` | string | Strategic goal name |
| `pillar_id` | string | Strategic pillar ID |
| `pillar` | string | Strategic pillar name |
| `service_id` | string | Service ID |
| `service` | string | Service name |
| `sub_service_id` | string | Sub-service ID |
| `sub_service` | string | Sub-service name |

### 2. Strategic Framework Modules

#### Goals Module
**Module Name**: `ms_goal`

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Goal ID |
| `name` | string | Goal name |
| `description` | text | Goal description (English) |
| `name_goal_fr_c` | string | Goal name (French) |
| `name_goal_ar_c` | string | Goal name (Arabic) |

#### Pillars Module
**Module Name**: `ms_pillar`

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Pillar ID |
| `name` | string | Pillar name |
| `description` | text | Pillar description |

#### Services Module
**Module Name**: `ms_service`

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Service ID |
| `name` | string | Service name |
| `description` | text | Service description |

#### Sub-Services Module
**Module Name**: `ms_subservice`

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Sub-service ID |
| `name` | string | Sub-service name |
| `description` | text | Sub-service description |

### 3. Contacts Module
**Module Name**: `Contacts`

| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Contact ID |
| `first_name` | string | First name |
| `last_name` | string | Last name |
| `login_c` | string | Login username |
| `email1` | string | Primary email |
| `phone_work` | string | Work phone |
| `password_c` | string | Password (hashed) |
| `portal_access_c` | boolean | Portal access permission |

## API Methods

### Authentication Methods

#### Login
```javascript
method: "login"
input_type: "JSON"
response_type: "JSON"
rest_data: {
  "user_auth": {
    "user_name": "username",
    "password": "hashed_password"
  },
  "application_name": "MyApp"
}
```

#### Logout
```javascript
method: "logout"
input_type: "JSON"
response_type: "JSON"
rest_data: {
  "session": "session_id"
}
```

### Data Retrieval Methods

#### Get Entry List
```javascript
method: "get_entry_list"
input_type: "JSON"
response_type: "JSON"
rest_data: {
  "session": "session_id",
  "module_name": "module_name",
  "query": "query_string",
  "order_by": "field_name",
  "offset": 0,
  "select_fields": ["field1", "field2"],
  "max_results": 50
}
```

#### Get Entry
```javascript
method: "get_entry"
input_type: "JSON"
response_type: "JSON"
rest_data: {
  "session": "session_id",
  "module_name": "module_name",
  "id": "record_id",
  "select_fields": ["field1", "field2"]
}
```

### Data Modification Methods

#### Set Entry (Create/Update)
```javascript
method: "set_entry"
input_type: "JSON"
response_type: "JSON"
rest_data: {
  "session": "session_id",
  "module_name": "module_name",
  "name_value_list": [
    {"name": "field_name", "value": "field_value"}
  ]
}
```

#### Set Entries (Bulk Create/Update)
```javascript
method: "set_entries"
input_type: "JSON"
response_type: "JSON"
rest_data: {
  "session": "session_id",
  "module_name": "module_name",
  "name_value_list": [
    [
      {"name": "field_name", "value": "field_value"}
    ]
  ]
}
```

## Relationship Structure

### Strategic Framework Hierarchy
```
Strategic Goals (ms_goal)
├── Strategic Pillars (ms_pillar)
    ├── Services (ms_service)
        └── Sub-Services (ms_subservice)
```

### Project Relationship Mapping
```
Project Suggestion (icesc_project_suggestions)
├── Strategic Goal (via strategic_goal_id)
├── Strategic Pillar (via pillar_id)
├── Service (via service_id)
└── Sub-Service (via sub_service_id)
```

## Access Patterns

### 1. Get All Goals
```javascript
const goals = await getModuleEntries(sessionId, "ms_goal", ["id", "name", "description"]);
```

### 2. Get Goals by Language
```javascript
const goals = await getGoals(sessionId, "fr"); // French
const goals = await getGoals(sessionId, "ar"); // Arabic
const goals = await getGoals(sessionId, "en"); // English
```

### 3. Get Pillars for a Goal
```javascript
const pillars = await getModuleEntries(
  sessionId, 
  "ms_pillar", 
  ["id", "name", "description"],
  "goal_id='goal_id_here'"
);
```

### 4. Get Services for a Pillar
```javascript
const services = await getModuleEntries(
  sessionId, 
  "ms_service", 
  ["id", "name", "description"],
  "pillar_id='pillar_id_here'"
);
```

### 5. Get Sub-Services for a Service
```javascript
const subServices = await getModuleEntries(
  sessionId, 
  "ms_subservice", 
  ["id", "name", "description"],
  "service_id='service_id_here'"
);
```

### 6. Get Project Suggestions
```javascript
const projects = await getModuleEntries(
  sessionId, 
  "icesc_project_suggestions", 
  ["id", "name", "description", "strategic_goal_id", "pillar_id", "service_id", "sub_service_id"]
);
```

### 7. Get Projects by Strategic Framework
```javascript
// Get projects for a specific goal
const projectsByGoal = await getModuleEntries(
  sessionId, 
  "icesc_project_suggestions", 
  ["id", "name", "description"],
  "strategic_goal_id='goal_id_here'"
);

// Get projects for a specific pillar
const projectsByPillar = await getModuleEntries(
  sessionId, 
  "icesc_project_suggestions", 
  ["id", "name", "description"],
  "pillar_id='pillar_id_here'"
);
```

## Field Mapping Examples

### Project Data to CRM Fields
```javascript
const projectData = {
  name: "Project Title",
  description: "Project Description",
  strategic_goal_id: "1915ff7b-ece8-11f5-63bd-68be9e0244bc",
  strategic_goal: "2",
  pillar_id: "90b5601b-2267-df3c-9abb-68be9fe67ef2",
  pillar: "2.1",
  service_id: "4d86dd66-054e-bf42-1ccc-68bea192ffe6",
  service: "2.1.1",
  sub_service_id: "526a9796-eed1-0a86-9c5d-68bea5a9fcea",
  sub_service: "2.1.1.1",
  partners: ["Partner 1", "Partner 2", "Partner 3"],
  milestones: ["Milestone 1", "Milestone 2"],
  kpis: ["KPI 1", "KPI 2"]
};

// Maps to CRM fields:
// name -> name
// description -> description
// strategic_goal_id -> strategic_goal_id
// strategic_goal -> strategic_goal
// pillar_id -> pillar_id
// pillar -> pillar
// service_id -> service_id
// service -> service
// sub_service_id -> sub_service_id
// sub_service -> sub_service
// partners[0] -> partner1
// partners[1] -> partner2
// partners[2] -> partner3
// milestones[0] -> milestones1
// milestones[1] -> milestones2
// kpis[0] -> kpis1
// kpis[1] -> kpis2
```

## Error Handling

### Common Error Types
1. **Invalid Session ID**: Session expired or invalid
2. **Module Not Found**: Module name doesn't exist
3. **Field Not Found**: Field name doesn't exist in module
4. **Validation Error**: Required field missing or invalid value
5. **Permission Error**: Insufficient permissions for operation

### Error Response Format
```json
{
  "name": "Error Name",
  "number": 11,
  "description": "Error description"
}
```

## Best Practices

1. **Session Management**: Always use fresh session IDs for operations
2. **Field Validation**: Validate required fields before submission
3. **Error Handling**: Implement comprehensive error handling
4. **Data Mapping**: Use consistent field mapping patterns
5. **Query Optimization**: Use specific select_fields to reduce data transfer
6. **Relationship Tracking**: Always log strategic framework relationships

## Security Considerations

1. **Authentication**: Use secure admin credentials
2. **Session Security**: Don't expose session IDs in client-side code
3. **Data Validation**: Validate all input data before CRM submission
4. **Error Messages**: Don't expose sensitive information in error messages
5. **Access Control**: Implement proper access control for different user types



