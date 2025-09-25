# HIVE CRM Export Scripts

This directory contains scripts to export data from the CRM system.

## Available Scripts

### 1. Subservices Export (`get-subservices.js`)

Exports all subservices from the CRM and saves them to `Data/sub-service/data.ts`.

**Relationship**: `ms_service_ms_subservice_1` (Services → Subservices, One to Many)

#### Features:
- Fetches all subservices with their service relationships
- Processes relationship data to include service information
- Generates TypeScript interface and helper functions
- Saves both processed TypeScript file and raw JSON backup
- Includes comprehensive error handling and logging

#### Generated Files:
- `Data/sub-service/data.ts` - TypeScript data file with interfaces and helper functions
- `Data/sub-service/subservices-raw.json` - Raw JSON backup of all data

#### Usage:

**Option 1: Using the batch file (Windows)**
```bash
cd scripts
.\export-subservices.bat
```

**Option 2: Using Node.js directly**
```bash
cd scripts
node get-subservices.js
```

**Requirements:**
- Node.js 18.0.0 or higher (for built-in fetch support)
- No additional packages needed

### 2. Projects Export (`get-all-projects.js`)

Exports all projects from the CRM (if needed).

## Generated Data Structure

### Subservices Data (`Data/sub-service/data.ts`)

```typescript
export interface Subservice {
  id: string;
  name: string;
  code?: string;
  title?: string;
  description?: string;
  date_entered?: string;
  date_modified?: string;
  created_by?: string;
  modified_user_id?: string;
  assigned_user_id?: string;
  deleted?: string;
  ms_service_ms_subservice_1?: string;
  service?: {
    id: string;
    name: string;
    code?: string;
    title?: string;
  };
}

export const subservices: Subservice[] = [...];

// Helper functions
export const getSubserviceById = (id: string): Subservice | undefined;
export const getSubservicesByService = (serviceId: string): Subservice[];
export const getSubserviceByCode = (code: string): Subservice | undefined;
export const getAllSubserviceCodes = (): string[];
export const getAllSubserviceNames = (): string[];
```

## CRM Configuration

The scripts use the following CRM configuration:
- **Base URL**: `https://crm.icesco.org`
- **Admin User**: `portal`
- **Admin Password**: `Portal@2024`

## Requirements

- Node.js 18.0.0 or higher (for built-in fetch support)
- Internet connection to access the CRM
- Valid CRM credentials
- No additional packages needed

## Error Handling

The scripts include comprehensive error handling:
- Connection timeout handling
- Authentication error handling
- Data processing error handling
- File system error handling

## Logging

All scripts provide detailed console output:
- ✅ Success messages
- ❌ Error messages
- 📊 Progress information
- 🔍 Debug information

## Troubleshooting

### Common Issues:

1. **"Node.js is not installed"**
   - Install Node.js from https://nodejs.org/
   - Make sure Node.js is in your system PATH

2. **"Failed to get session ID"**
   - Check internet connection
   - Verify CRM server is accessible
   - Check CRM credentials

3. **"No subservices found"**
   - Verify the CRM has subservices data
   - Check if the module name is correct (`ms_subservice`)

4. **"Permission denied" writing files**
   - Make sure you have write permissions to the Data directory
   - Run as administrator if needed

### Debug Mode:

To see more detailed logging, you can modify the script to add more console.log statements or run with Node.js debug flags.

## Data Relationships

### Subservices → Services Relationship

- **Relationship Name**: `ms_service_ms_subservice_1`
- **Type**: One to Many (Service has many Subservices)
- **Primary Module**: `ms_service` (Services)
- **Related Module**: `ms_subservice` (Subservices)
- **Label**: "Subservicess"
- **Subpanel**: "Subservices"

The script processes this relationship to include service information in each subservice record.

## File Structure

```
scripts/
├── get-subservices.js          # Main subservices export script
├── export-subservices.bat      # Windows batch file to run export
└── README.md                   # This file

Data/
└── sub-service/
    ├── data.ts                 # Generated TypeScript data file
    └── subservices-raw.json    # Raw JSON backup
```

## Usage in Application

After running the export, you can import the data in your application:

```typescript
import { subservices, getSubserviceById, getSubservicesByService } from '../Data/sub-service/data';

// Get all subservices
const allSubservices = subservices;

// Get subservice by ID
const subservice = getSubserviceById('some-id');

// Get subservices by service
const serviceSubservices = getSubservicesByService('service-id');
```