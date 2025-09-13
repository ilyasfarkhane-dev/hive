# Session-Based Project Tracking Guide

## Overview
This guide explains how to track and log all projects submitted by a specific session_id that exists in local storage. The system provides comprehensive tracking, logging, and analytics for project submissions.

## Features

### 1. Session Project Tracking
- **Track all projects** submitted by a specific session_id
- **Real-time logging** of project submissions
- **Comprehensive analytics** and statistics
- **Export functionality** for data analysis
- **Filtering and search** capabilities

### 2. API Endpoints

#### `/api/session-projects`
**GET** endpoint with multiple actions:

**Parameters:**
- `session_id` (required): The session ID to track
- `action` (optional): Action to perform (default: 'list')

**Actions:**
- `list`: Get all projects for the session
- `count`: Get project count for the session
- `statistics`: Get detailed statistics
- `export`: Export projects as CSV

**Example Usage:**
```javascript
// Get all projects
const response = await fetch('/api/session-projects?session_id=abc123&action=list');

// Get project count
const count = await fetch('/api/session-projects?session_id=abc123&action=count');

// Get statistics
const stats = await fetch('/api/session-projects?session_id=abc123&action=statistics');

// Export as CSV
const csv = await fetch('/api/session-projects?session_id=abc123&action=export');
```

### 3. React Hooks

#### `useSessionTracking()`
Main hook for session project tracking.

**Returns:**
```typescript
{
  // Data
  projects: SessionProject[];
  statistics: SessionStatistics | null;
  projectCount: number;
  totalBudget: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  refreshData: () => Promise<void>;
  exportProjects: () => Promise<void>;
  logProjects: () => void;
  
  // Filtered data
  getProjectsByGoal: (goalId: string) => SessionProject[];
  getProjectsByPillar: (pillarId: string) => SessionProject[];
  getProjectsByService: (serviceId: string) => SessionProject[];
  getProjectsBySubService: (subServiceId: string) => SessionProject[];
  getProjectsByType: (projectType: string) => SessionProject[];
  
  // Summary
  createSummary: () => string;
}
```

#### `useProjectSubmissionLogging()`
Hook for logging project submissions.

**Returns:**
```typescript
{
  logProjectSubmission: (projectData: any) => void;
}
```

### 4. Utility Functions

#### `SessionProjectTracker` Class
Comprehensive tracker class for session projects.

**Methods:**
- `loadProjects()`: Load all projects for the session
- `loadStatistics()`: Load statistics for the session
- `getProjects()`: Get loaded projects
- `getStatistics()`: Get loaded statistics
- `getProjectCount()`: Get project count
- `getTotalBudget()`: Get total budget
- `getProjectsByGoal(goalId)`: Filter by strategic goal
- `getProjectsByPillar(pillarId)`: Filter by pillar
- `getProjectsByService(serviceId)`: Filter by service
- `getProjectsBySubService(subServiceId)`: Filter by sub-service
- `getProjectsByType(projectType)`: Filter by project type
- `exportAsCSV()`: Export as CSV
- `createSummary()`: Create summary
- `logAllProjects()`: Log all projects to console

### 5. React Components

#### `SessionProjectTracker`
Main component for displaying session project tracking.

**Features:**
- Project list with detailed information
- Statistics dashboard
- Filtering and search
- Export functionality
- Real-time data refresh
- Console logging

**Usage:**
```tsx
import SessionProjectTracker from '@/components/SessionProjectTracker';

function MyPage() {
  return <SessionProjectTracker />;
}
```

#### `SessionProjectsPage`
Full page component for session project tracking.

**Route:** `/session-projects`

**Features:**
- Authentication check
- Full-screen layout
- Complete tracking interface

## Data Structures

### SessionProject
```typescript
interface SessionProject {
  id: string;
  name: string;
  description: string;
  strategicFramework: {
    goal: { id: string; name: string };
    pillar: { id: string; name: string };
    service: { id: string; name: string };
    subService: { id: string; name: string };
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  budget: {
    icesco: number;
    memberState: number;
    sponsorship: number;
    total: number;
  };
  timeline: {
    start: string;
    end: string;
    frequency: string;
  };
  scope: {
    delivery: string;
    geographic: string;
    type: string;
  };
  beneficiaries: string[];
  partners: string[];
  milestones: string[];
  kpis: string[];
  expectedOutputs: string;
  comments: string;
  sessionId: string;
  language: string;
  submissionDate: string;
}
```

### SessionStatistics
```typescript
interface SessionStatistics {
  sessionId: string;
  totalProjects: number;
  totalBudget: number;
  averageBudget: number;
  byGoal: { [key: string]: { count: number; totalBudget: number } };
  byPillar: { [key: string]: { count: number; totalBudget: number } };
  byService: { [key: string]: { count: number; totalBudget: number } };
  bySubService: { [key: string]: { count: number; totalBudget: number } };
  byProjectType: { [key: string]: number };
  byDeliveryModality: { [key: string]: number };
  byGeographicScope: { [key: string]: number };
  submissionTimeline: Array<{
    projectId: string;
    submissionDate: string;
    projectName: string;
  }>;
}
```

## Usage Examples

### 1. Basic Session Tracking
```typescript
import { useSessionTracking } from '@/hooks/useSessionTracking';

function MyComponent() {
  const { projects, projectCount, totalBudget, isLoading } = useSessionTracking();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Session Projects ({projectCount})</h2>
      <p>Total Budget: ${totalBudget.toLocaleString()}</p>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Filtering Projects
```typescript
import { useSessionTracking } from '@/hooks/useSessionTracking';

function FilteredProjects() {
  const { getProjectsByGoal, getProjectsByType } = useSessionTracking();
  
  const goalProjects = getProjectsByGoal('goal-id-123');
  const workshopProjects = getProjectsByType('Workshop');
  
  return (
    <div>
      <h3>Projects by Goal: {goalProjects.length}</h3>
      <h3>Workshop Projects: {workshopProjects.length}</h3>
    </div>
  );
}
```

### 3. Export and Logging
```typescript
import { useSessionTracking } from '@/hooks/useSessionTracking';

function ExportComponent() {
  const { exportProjects, logProjects } = useSessionTracking();
  
  const handleExport = async () => {
    try {
      await exportProjects();
      console.log('Export completed');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const handleLog = () => {
    logProjects();
  };
  
  return (
    <div>
      <button onClick={handleExport}>Export CSV</button>
      <button onClick={handleLog}>Log to Console</button>
    </div>
  );
}
```

### 4. Project Submission Logging
```typescript
import { useProjectSubmissionLogging } from '@/hooks/useSessionTracking';

function SubmissionComponent() {
  const { logProjectSubmission } = useProjectSubmissionLogging();
  
  const handleSubmit = (projectData) => {
    // Log the submission
    logProjectSubmission(projectData);
    
    // Submit to API
    // ... submission logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Console Logging

### Project Submission Log
When a project is submitted, the system logs:
```
=== Session Project Submission Log ===
Session ID: abc123
Project Name: Workshop on Education
Submission Time: 2025-01-12T10:30:00Z
Strategic Framework: {
  goal: "2",
  goalId: "1915ff7b-ece8-11f5-63bd-68be9e0244bc",
  pillar: "2.1",
  pillarId: "90b5601b-2267-df3c-9abb-68be9fe67ef2",
  service: "2.1.1",
  serviceId: "4d86dd66-054e-bf42-1ccc-68bea192ffe6",
  subService: "2.1.1.1",
  subServiceId: "526a9796-eed1-0a86-9c5d-68bea5a9fcea"
}
Contact: {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  role: "Project Manager"
}
Budget: {
  icesco: 10000,
  memberState: 5000,
  sponsorship: 2000,
  total: 17000
}
Timeline: {
  start: "2025-09-03",
  end: "2025-09-10",
  frequency: "One-time"
}
Scope: {
  delivery: "Physical",
  geographic: "National",
  type: "Workshop"
}
Partners: ["Organization A", "Organization B"]
Milestones: ["Project Kickoff", "Mid-term Review", "Final Presentation"]
KPIs: ["100 participants trained", "90% satisfaction rate"]
==========================================
```

### Session Summary Log
When logging all projects:
```
=== All Session Projects ===
Session ID: abc123
Total Projects: 3
Total Budget: $45,000
Projects:
1. Workshop on Education (proj-001)
   Strategic Framework: 2 → 2.1 → 2.1.1 → 2.1.1.1
   Budget: $17,000
   Type: Workshop
   Submission: 2025-01-12T10:30:00Z
2. Training Program (proj-002)
   Strategic Framework: 3 → 3.1 → 3.1.1 → 3.1.1.1
   Budget: $20,000
   Type: Training
   Submission: 2025-01-12T11:15:00Z
3. Research Initiative (proj-003)
   Strategic Framework: 2 → 2.2 → 2.2.1 → 2.2.1.1
   Budget: $8,000
   Type: Research
   Submission: 2025-01-12T14:20:00Z
=============================
```

## API Response Examples

### List Projects Response
```json
{
  "success": true,
  "data": [
    {
      "id": "proj-001",
      "name": "Workshop on Education",
      "description": "Educational workshop for teachers",
      "strategicFramework": {
        "goal": { "id": "goal-123", "name": "2" },
        "pillar": { "id": "pillar-456", "name": "2.1" },
        "service": { "id": "service-789", "name": "2.1.1" },
        "subService": { "id": "subservice-012", "name": "2.1.1.1" }
      },
      "contact": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "role": "Project Manager"
      },
      "budget": {
        "icesco": 10000,
        "memberState": 5000,
        "sponsorship": 2000,
        "total": 17000
      },
      "timeline": {
        "start": "2025-09-03",
        "end": "2025-09-10",
        "frequency": "One-time"
      },
      "scope": {
        "delivery": "Physical",
        "geographic": "National",
        "type": "Workshop"
      },
      "beneficiaries": ["Teachers", "Students"],
      "partners": ["Organization A", "Organization B"],
      "milestones": ["Project Kickoff", "Mid-term Review", "Final Presentation"],
      "kpis": ["100 participants trained", "90% satisfaction rate"],
      "expectedOutputs": "Trained teachers and improved teaching methods",
      "comments": "Strategic Framework Relationship:\n- Goal: 2 (ID: goal-123)\n- Pillar: 2.1 (ID: pillar-456)\n- Service: 2.1.1 (ID: service-789)\n- Sub-Service: 2.1.1.1 (ID: subservice-012)",
      "sessionId": "abc123",
      "language": "en",
      "submissionDate": "2025-01-12T10:30:00Z"
    }
  ],
  "count": 1,
  "sessionId": "abc123",
  "timestamp": "2025-01-12T10:30:00Z"
}
```

### Statistics Response
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123",
    "totalProjects": 3,
    "totalBudget": 45000,
    "averageBudget": 15000,
    "byGoal": {
      "2 (goal-123)": { "count": 2, "totalBudget": 25000 },
      "3 (goal-456)": { "count": 1, "totalBudget": 20000 }
    },
    "byPillar": {
      "2.1 (pillar-456)": { "count": 1, "totalBudget": 17000 },
      "2.2 (pillar-789)": { "count": 1, "totalBudget": 8000 },
      "3.1 (pillar-012)": { "count": 1, "totalBudget": 20000 }
    },
    "byService": {
      "2.1.1 (service-789)": { "count": 1, "totalBudget": 17000 },
      "2.2.1 (service-345)": { "count": 1, "totalBudget": 8000 },
      "3.1.1 (service-678)": { "count": 1, "totalBudget": 20000 }
    },
    "bySubService": {
      "2.1.1.1 (subservice-012)": { "count": 1, "totalBudget": 17000 },
      "2.2.1.1 (subservice-345)": { "count": 1, "totalBudget": 8000 },
      "3.1.1.1 (subservice-678)": { "count": 1, "totalBudget": 20000 }
    },
    "byProjectType": {
      "Workshop": 1,
      "Training": 1,
      "Research": 1
    },
    "byDeliveryModality": {
      "Physical": 2,
      "Virtual": 1
    },
    "byGeographicScope": {
      "National": 2,
      "Regional": 1
    },
    "submissionTimeline": [
      {
        "projectId": "proj-001",
        "submissionDate": "2025-01-12T10:30:00Z",
        "projectName": "Workshop on Education"
      },
      {
        "projectId": "proj-002",
        "submissionDate": "2025-01-12T11:15:00Z",
        "projectName": "Training Program"
      },
      {
        "projectId": "proj-003",
        "submissionDate": "2025-01-12T14:20:00Z",
        "projectName": "Research Initiative"
      }
    ]
  },
  "timestamp": "2025-01-12T10:30:00Z"
}
```

## Integration with Existing System

### 1. Project Submission Integration
The session tracking is automatically integrated with the existing project submission system:

- **Automatic Logging**: Every project submission is automatically logged
- **Session ID Tracking**: Projects are tracked by the session_id from localStorage
- **Real-time Updates**: Session data is updated in real-time

### 2. CRM Integration
The system integrates with the existing CRM:

- **Direct CRM Queries**: Uses existing CRM authentication and query functions
- **Field Mapping**: Uses existing field mapping system
- **Data Consistency**: Ensures data consistency with CRM records

### 3. Authentication Integration
The system integrates with the existing authentication:

- **Session Management**: Uses existing session management from AuthContext
- **User Context**: Automatically tracks projects by current user session
- **Security**: Maintains security through existing authentication system

## Best Practices

### 1. Performance
- **Lazy Loading**: Load data only when needed
- **Caching**: Cache frequently accessed data
- **Pagination**: Use pagination for large datasets

### 2. Error Handling
- **Graceful Degradation**: Handle errors gracefully
- **User Feedback**: Provide clear error messages
- **Retry Logic**: Implement retry logic for failed requests

### 3. Data Management
- **Regular Refresh**: Refresh data regularly
- **Data Validation**: Validate data before processing
- **Cleanup**: Clean up unused data

### 4. User Experience
- **Loading States**: Show loading states during data fetching
- **Progress Indicators**: Show progress for long operations
- **Responsive Design**: Ensure responsive design for all devices

## Troubleshooting

### Common Issues

1. **No Projects Found**
   - Check if session_id is valid
   - Verify authentication status
   - Check CRM connection

2. **Export Fails**
   - Check browser permissions
   - Verify data availability
   - Check network connection

3. **Statistics Not Loading**
   - Check CRM connection
   - Verify data integrity
   - Check authentication status

4. **Filtering Not Working**
   - Verify filter values
   - Check data structure
   - Ensure proper data types

### Debug Steps

1. **Check Console Logs**
   - Look for error messages
   - Check network requests
   - Verify data flow

2. **Verify Session ID**
   - Check localStorage
   - Verify authentication
   - Check session validity

3. **Test API Endpoints**
   - Test individual endpoints
   - Check response format
   - Verify data structure

4. **Check CRM Connection**
   - Verify CRM availability
   - Check authentication
   - Test data queries

This comprehensive session tracking system provides complete visibility into all projects submitted by a specific session_id, with detailed logging, analytics, and export capabilities.


