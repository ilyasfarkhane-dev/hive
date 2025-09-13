# SugarCRM Interface Guide for ICESCO Project Management

## Overview
This guide explains how to access and view project data, strategic framework relationships, and manage submissions through the SugarCRM web interface.

## Access Information
- **CRM URL**: `http://3.145.21.11`
- **Admin Login**: Use the admin credentials configured in your environment
- **Default Admin**: `portal` / `Portal@2025` (if using default settings)

## Main Navigation

### 1. Dashboard Overview
After logging in, you'll see the main SugarCRM dashboard with:
- **Quick Create** menu (top right)
- **Module Navigation** (left sidebar)
- **Recent Records** widgets
- **Activity Stream**

### 2. Key Modules for ICESCO

#### A. Project Suggestions Module
**Location**: Main navigation → `icesc_project_suggestions`

This is the primary module for managing project submissions.

**Key Views**:
- **List View**: Shows all project submissions in a table format
- **Detail View**: Individual project record with all fields
- **Edit View**: Modify project information
- **Create View**: Add new project submissions

#### B. Strategic Framework Modules

##### Goals Module
**Location**: Main navigation → `ms_goal`
- View all strategic goals
- See goal descriptions in multiple languages
- Track goal-related projects

##### Pillars Module  
**Location**: Main navigation → `ms_pillar`
- View strategic pillars
- See pillar descriptions
- Track pillar-related projects

##### Services Module
**Location**: Main navigation → `ms_service`
- View available services
- See service descriptions
- Track service-related projects

##### Sub-Services Module
**Location**: Main navigation → `ms_subservice`
- View sub-services
- See sub-service descriptions
- Track sub-service-related projects

#### C. Contacts Module
**Location**: Main navigation → `Contacts`
- Manage user accounts
- View contact information
- Track portal access permissions

## Project Suggestions Module - Detailed Guide

### 1. List View Navigation

#### Accessing the List View
1. Login to SugarCRM
2. Navigate to `icesc_project_suggestions` in the main menu
3. You'll see a table with all project submissions

#### List View Columns
The list view shows these key columns:
- **Name**: Project title
- **Description**: Project description (truncated)
- **Contact Name**: Primary contact
- **Contact Email**: Contact email
- **Strategic Goal**: Associated goal
- **Pillar**: Associated pillar
- **Service**: Associated service
- **Sub-Service**: Associated sub-service
- **Budget Total**: Combined budget
- **Start Date**: Project start date
- **End Date**: Project end date
- **Status**: Project status

#### List View Actions
- **Search**: Use the search bar to find specific projects
- **Filter**: Use filter options to narrow down results
- **Sort**: Click column headers to sort
- **Export**: Export data to CSV/Excel
- **Mass Actions**: Select multiple records for bulk operations

### 2. Detail View Navigation

#### Accessing Detail View
1. From the list view, click on any project name
2. This opens the detailed record view

#### Detail View Sections

##### Basic Information
- **Project Name**: `name` field
- **Description**: `description` field (full text)
- **Problem Statement**: `problem_statement` field
- **Project Brief**: `project_brief` field
- **Rationale & Impact**: `rationale_impact` field

##### Strategic Framework Section
- **Strategic Goal ID**: `strategic_goal_id` field
- **Strategic Goal**: `strategic_goal` field
- **Pillar ID**: `pillar_id` field
- **Pillar**: `pillar` field
- **Service ID**: `service_id` field
- **Service**: `service` field
- **Sub-Service ID**: `sub_service_id` field
- **Sub-Service**: `sub_service` field

##### Contact Information
- **Contact Name**: `contact_name` field
- **Contact Email**: `contact_email` field
- **Contact Phone**: `contact_phone` field
- **Contact Role**: `contact_role` field

##### Budget Information
- **ICESCO Budget**: `budget_icesco` field
- **Member State Budget**: `budget_member_state` field
- **Sponsorship Budget**: `budget_sponsorship` field

##### Timeline Information
- **Start Date**: `date_start` field
- **End Date**: `date_end` field
- **Project Frequency**: `project_frequency` field
- **Frequency Duration**: `frequency_duration` field

##### Project Scope
- **Delivery Modality**: `delivery_modality` field
- **Geographic Scope**: `geographic_scope` field
- **Project Type**: `project_type` field
- **Project Type Other**: `project_type_other` field

##### Beneficiaries
- **Beneficiaries**: `beneficiaries` field (multi-select)
- **Other Beneficiaries**: `other_beneficiaries` field

##### Partners (Array Fields)
- **Partner 1**: `partner1` field
- **Partner 2**: `partner2` field
- **Partner 3**: `partner3` field
- **Partner 4**: `partner4` field
- **Partner 5**: `partner5` field

##### Milestones (Array Fields)
- **Milestone 1**: `milestones1` field
- **Milestone 2**: `milestones2` field
- **Milestone 3**: `milestones3` field
- **Milestone 4**: `milestones4` field
- **Milestone 5**: `milestones5` field

##### KPIs (Array Fields)
- **KPI 1**: `kpis1` field
- **KPI 2**: `kpis2` field
- **KPI 3**: `kpis3` field
- **KPI 4**: `kpis4` field
- **KPI 5**: `kpis5` field

##### Additional Information
- **Expected Outputs**: `expected_outputs` field
- **Comments**: `comments` field (includes strategic relationship info)
- **Supporting Documents**: File attachments

### 3. Searching and Filtering

#### Basic Search
1. In the list view, use the search bar at the top
2. Search by project name, contact name, or description
3. Press Enter or click the search icon

#### Advanced Search
1. Click the "Advanced Search" button
2. Use multiple criteria:
   - **Strategic Goal**: Filter by specific goal
   - **Pillar**: Filter by specific pillar
   - **Service**: Filter by specific service
   - **Sub-Service**: Filter by specific sub-service
   - **Project Type**: Filter by project type
   - **Delivery Modality**: Filter by delivery method
   - **Geographic Scope**: Filter by scope
   - **Budget Range**: Filter by budget amount
   - **Date Range**: Filter by start/end dates
   - **Contact**: Filter by contact person

#### Saved Searches
1. After creating a search, click "Save Search"
2. Give it a name (e.g., "Workshop Projects")
3. Access saved searches from the "Saved Searches" dropdown

### 4. Reports and Analytics

#### Creating Reports
1. Navigate to **Reports** in the main menu
2. Click **Create Report**
3. Select **icesc_project_suggestions** as the module
4. Choose report type:
   - **Summary Report**: Aggregate data
   - **Detail Report**: Individual records
   - **Matrix Report**: Cross-tabulation

#### Useful Report Templates

##### Projects by Strategic Framework
- **Group by**: Strategic Goal, Pillar, Service, Sub-Service
- **Show**: Count of projects, total budget
- **Filter**: Date range, project type

##### Budget Analysis
- **Show**: Budget fields, total budget calculation
- **Group by**: Strategic framework levels
- **Charts**: Pie charts, bar charts

##### Contact Analysis
- **Show**: Contact information, project count per contact
- **Group by**: Contact role, geographic scope

##### Timeline Analysis
- **Show**: Start/end dates, project duration
- **Group by**: Project frequency, delivery modality

### 5. Strategic Framework Navigation

#### Viewing Goal Details
1. Navigate to **ms_goal** module
2. Click on any goal name to view details
3. See related projects in the "Related" section

#### Viewing Pillar Details
1. Navigate to **ms_pillar** module
2. Click on any pillar name to view details
3. See related projects and services

#### Viewing Service Details
1. Navigate to **ms_service** module
2. Click on any service name to view details
3. See related projects and sub-services

#### Viewing Sub-Service Details
1. Navigate to **ms_subservice** module
2. Click on any sub-service name to view details
3. See related projects

### 6. Relationship Tracking

#### Viewing Project Relationships
1. Open any project in detail view
2. Scroll to the **Strategic Framework** section
3. See the complete hierarchy:
   - Goal → Pillar → Service → Sub-Service
4. Click on any ID to navigate to that framework element

#### Following Relationships
1. In any framework module, look for the **Related** section
2. Click on **Projects** to see related project submissions
3. Use the relationship links to navigate between related records

### 7. Data Export and Import

#### Exporting Data
1. In list view, select records to export
2. Click **Export** button
3. Choose format: CSV, Excel, or PDF
4. Select fields to include
5. Download the file

#### Importing Data
1. Navigate to **Admin** → **Import**
2. Select **icesc_project_suggestions** module
3. Upload CSV file
4. Map fields to CRM fields
5. Preview and import

### 8. User Management

#### Managing Contacts
1. Navigate to **Contacts** module
2. View user information
3. Edit contact details
4. Manage portal access permissions

#### User Roles and Permissions
1. Navigate to **Admin** → **Users**
2. Manage user accounts
3. Set role-based permissions
4. Configure portal access

### 9. System Administration

#### Field Management
1. Navigate to **Admin** → **Studio**
2. Select **icesc_project_suggestions** module
3. View and modify field configurations
4. Add custom fields if needed

#### Module Configuration
1. Navigate to **Admin** → **Module Loader**
2. Manage installed modules
3. Configure module settings

#### Data Maintenance
1. Navigate to **Admin** → **Repair**
2. Rebuild relationships
3. Clear cache
4. Optimize database

### 10. Troubleshooting Common Issues

#### Cannot See Project Data
- Check user permissions
- Verify module access rights
- Clear browser cache
- Check if records are deleted

#### Search Not Working
- Try different search terms
- Use advanced search
- Check if data exists
- Verify field names

#### Relationship Links Broken
- Rebuild relationships in Admin
- Check if related records exist
- Verify field mappings

#### Performance Issues
- Use filters to limit results
- Avoid loading too many records
- Use pagination
- Clear browser cache

## Quick Reference

### Field Locations in Detail View
- **Basic Info**: Top section
- **Strategic Framework**: Middle section
- **Contact Info**: Contact section
- **Budget**: Financial section
- **Timeline**: Date section
- **Scope**: Project details section
- **Partners**: Array fields section
- **Milestones**: Array fields section
- **KPIs**: Array fields section
- **Comments**: Bottom section

### Common Navigation Paths
- **All Projects**: `icesc_project_suggestions` → List View
- **Project Details**: `icesc_project_suggestions` → Click Project Name
- **Strategic Goals**: `ms_goal` → List View
- **Goal Projects**: `ms_goal` → Click Goal → Related Projects
- **Reports**: `Reports` → Create Report
- **Admin**: `Admin` → Various options

### Keyboard Shortcuts
- **Ctrl+F**: Search
- **Ctrl+N**: New record
- **Ctrl+S**: Save
- **Ctrl+E**: Edit
- **Ctrl+D**: Delete
- **F5**: Refresh

This guide should help you navigate the SugarCRM interface effectively to view and manage ICESCO project data and strategic framework relationships.



