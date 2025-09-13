# SugarCRM Quick Reference Card

## 🚀 Quick Access URLs
- **Main CRM**: `http://3.145.21.11`
- **Project List**: `http://3.145.21.11/index.php?module=icesc_project_suggestions&action=index`
- **Goals List**: `http://3.145.21.11/index.php?module=ms_goal&action=index`
- **Pillars List**: `http://3.145.21.11/index.php?module=ms_pillar&action=index`
- **Services List**: `http://3.145.21.11/index.php?module=ms_service&action=index`
- **Sub-Services List**: `http://3.145.21.11/index.php?module=ms_subservice&action=index`

## 📋 Common Tasks

### View All Projects
1. Login → Click **icesc_project_suggestions** in sidebar
2. See list of all project submissions
3. Click any project name to view details

### Find Projects by Strategic Framework
1. **By Goal**: Click **ms_goal** → Click goal name → See "Related Projects"
2. **By Pillar**: Click **ms_pillar** → Click pillar name → See "Related Projects"
3. **By Service**: Click **ms_service** → Click service name → See "Related Projects"
4. **By Sub-Service**: Click **ms_subservice** → Click sub-service name → See "Related Projects"

### Search Projects
1. Go to **icesc_project_suggestions** list view
2. Use search box for basic search
3. Click **Advanced Search** for detailed criteria
4. Set filters and click **Search**

### View Project Details
1. Click on any project name in the list
2. Scroll through sections:
   - **Basic Information**
   - **Strategic Framework** (Goal → Pillar → Service → Sub-Service)
   - **Contact Information**
   - **Budget Information**
   - **Project Details**
   - **Partners** (Partner 1-5)
   - **Milestones** (Milestone 1-5)
   - **KPIs** (KPI 1-5)
   - **Comments** (includes relationship info)

### Create Reports
1. Click **Reports** in sidebar
2. Click **Create Report**
3. Select **icesc_project_suggestions**
4. Choose report type and fields
5. Set grouping and filters
6. Preview and save

## 🔍 Field Locations in Detail View

### Strategic Framework Section
- **Goal ID**: `strategic_goal_id`
- **Goal Name**: `strategic_goal`
- **Pillar ID**: `pillar_id`
- **Pillar Name**: `pillar`
- **Service ID**: `service_id`
- **Service Name**: `service`
- **Sub-Service ID**: `sub_service_id`
- **Sub-Service Name**: `sub_service`

### Contact Information
- **Name**: `contact_name`
- **Email**: `contact_email`
- **Phone**: `contact_phone`
- **Role**: `contact_role`

### Budget Fields
- **ICESCO**: `budget_icesco`
- **Member State**: `budget_member_state`
- **Sponsorship**: `budget_sponsorship`

### Array Fields (Partners, Milestones, KPIs)
- **Partner 1-5**: `partner1`, `partner2`, `partner3`, `partner4`, `partner5`
- **Milestone 1-5**: `milestones1`, `milestones2`, `milestones3`, `milestones4`, `milestones5`
- **KPI 1-5**: `kpis1`, `kpis2`, `kpis3`, `kpis4`, `kpis5`

## 🔗 Relationship Navigation

### From Project to Framework
1. Open project detail view
2. Scroll to **Strategic Framework** section
3. Click on any ID to navigate to that framework element
4. Use browser back button to return

### From Framework to Projects
1. Open any framework element (goal/pillar/service/sub-service)
2. Look for **Related Records** section
3. Click **Projects** to see related project submissions
4. Click project name to view details

## 📊 Useful Reports

### Projects by Strategic Framework
- **Group by**: Strategic Goal, Pillar, Service, Sub-Service
- **Show**: Count, Total Budget
- **Use for**: Understanding project distribution

### Budget Analysis
- **Show**: All budget fields, calculated totals
- **Group by**: Framework levels
- **Use for**: Financial analysis

### Contact Analysis
- **Show**: Contact info, project count
- **Group by**: Role, Geographic Scope
- **Use for**: User management

### Timeline Analysis
- **Show**: Start/end dates, duration
- **Group by**: Frequency, Delivery Modality
- **Use for**: Project planning

## 🎯 Search Tips

### Basic Search
- Search by project name, contact name, or description
- Use partial matches (e.g., "workshop" finds "Workshop on Education")

### Advanced Search
- **Strategic Goal**: Filter by specific goal
- **Project Type**: Filter by Training, Workshop, Conference, etc.
- **Delivery Modality**: Filter by Physical, Virtual, Hybrid
- **Geographic Scope**: Filter by National, Regional, International
- **Budget Range**: Set minimum and maximum budget
- **Date Range**: Filter by start/end dates

### Saved Searches
- Create common searches and save them
- Access from "Saved Searches" dropdown
- Useful for recurring queries

## ⚡ Keyboard Shortcuts
- **Ctrl+F**: Search
- **Ctrl+N**: New record
- **Ctrl+S**: Save
- **Ctrl+E**: Edit
- **F5**: Refresh page
- **Esc**: Close dialogs

## 🚨 Troubleshooting

### Can't See Data
- Check user permissions
- Clear browser cache
- Verify you're in the correct module

### Search Not Working
- Try different search terms
- Use advanced search instead
- Check if data exists

### Relationships Broken
- Use Admin → Repair to rebuild relationships
- Check if related records exist
- Verify field mappings

### Performance Issues
- Use filters to limit results
- Avoid loading too many records
- Use pagination controls

## 📞 Support Information
- **CRM URL**: `http://3.145.21.11`
- **Admin Access**: Contact system administrator
- **Data Issues**: Check field mappings and relationships
- **Performance**: Use filters and pagination

## 🔄 Data Flow
```
Project Submission → icesc_project_suggestions Module
                  ↓
            Strategic Framework Fields
                  ↓
            Related to ms_goal, ms_pillar, ms_service, ms_subservice
                  ↓
            Viewable in SugarCRM Interface
```

This quick reference should help you efficiently navigate and use the SugarCRM interface for ICESCO project management!


