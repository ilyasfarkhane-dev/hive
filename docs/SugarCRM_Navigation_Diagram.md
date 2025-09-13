# SugarCRM Interface Navigation Diagram

## Main Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    SugarCRM Header                              │
│  [Logo] ICESCO CRM    [Quick Create ▼] [User Menu ▼] [Logout] │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar │                    Main Content Area                 │
│         │                                                     │
│ [🏠]    │  ┌─────────────────────────────────────────────────┐ │
│ Home    │  │                Dashboard                        │ │
│         │  │  [Recent Records] [Activity Stream] [Charts]   │ │
│ [📋]    │  └─────────────────────────────────────────────────┘ │
│ Project │                                                     │
│ Suggest │                                                     │
│ [🎯]    │                                                     │
│ Goals   │                                                     │
│ [🏛️]    │                                                     │
│ Pillars │                                                     │
│ [⚙️]    │                                                     │
│ Services│                                                     │
│ [🔧]    │                                                     │
│ Sub-Serv│                                                     │
│ [👥]    │                                                     │
│ Contacts│                                                     │
│ [📊]    │                                                     │
│ Reports │                                                     │
│ [⚙️]    │                                                     │
│ Admin   │                                                     │
└─────────┴─────────────────────────────────────────────────────┘
```

## Project Suggestions Module Navigation

### List View
```
┌─────────────────────────────────────────────────────────────────┐
│ icesc_project_suggestions - List View                          │
├─────────────────────────────────────────────────────────────────┤
│ [Search Box] [Advanced Search] [Filter ▼] [Export] [Create]    │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Name        │ Description │ Contact │ Goal │ Pillar │ Budget │
│ ☐ Project A   │ Description │ John    │ 2    │ 2.1    │ $10K  │
│ ☐ Project B   │ Description │ Jane    │ 3    │ 3.2    │ $15K  │
│ ☐ Project C   │ Description │ Bob     │ 2    │ 2.1    │ $8K   │
├─────────────────────────────────────────────────────────────────┤
│ [Previous] 1 2 3 4 5 [Next] │ Showing 1-10 of 50 records      │
└─────────────────────────────────────────────────────────────────┘
```

### Detail View Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Project Name - Detail View                    [Edit] [Delete]   │
├─────────────────────────────────────────────────────────────────┤
│ Basic Information                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name: Project Title                                         │ │
│ │ Description: Full project description...                   │ │
│ │ Problem Statement: Problem being addressed...              │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Strategic Framework                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Goal ID: 1915ff7b-ece8-11f5-63bd-68be9e0244bc              │ │
│ │ Goal: 2                                                     │ │
│ │ Pillar ID: 90b5601b-2267-df3c-9abb-68be9fe67ef2            │ │
│ │ Pillar: 2.1                                                 │ │
│ │ Service ID: 4d86dd66-054e-bf42-1ccc-68bea192ffe6           │ │
│ │ Service: 2.1.1                                              │ │
│ │ Sub-Service ID: 526a9796-eed1-0a86-9c5d-68bea5a9fcea       │ │
│ │ Sub-Service: 2.1.1.1                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Contact Information                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name: John Doe                                              │ │
│ │ Email: john@example.com                                     │ │
│ │ Phone: +1234567890                                          │ │
│ │ Role: Project Manager                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Budget Information                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ICESCO Budget: $10,000                                      │ │
│ │ Member State Budget: $5,000                                 │ │
│ │ Sponsorship Budget: $2,000                                  │ │
│ │ Total: $17,000                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Project Details                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Start Date: 2025-09-03                                      │ │
│ │ End Date: 2025-09-10                                        │ │
│ │ Frequency: One-time                                         │ │
│ │ Delivery: Physical                                          │ │
│ │ Scope: National                                             │ │
│ │ Type: Workshop                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Partners (Array Fields)                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Partner 1: Organization A                                   │ │
│ │ Partner 2: Organization B                                   │ │
│ │ Partner 3: Organization C                                   │ │
│ │ Partner 4: (empty)                                          │ │
│ │ Partner 5: (empty)                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Milestones (Array Fields)                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Milestone 1: Project Kickoff                               │ │
│ │ Milestone 2: Mid-term Review                               │ │
│ │ Milestone 3: Final Presentation                            │ │
│ │ Milestone 4: (empty)                                       │ │
│ │ Milestone 5: (empty)                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ KPIs (Array Fields)                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ KPI 1: 100 participants trained                            │ │
│ │ KPI 2: 90% satisfaction rate                               │ │
│ │ KPI 3: (empty)                                             │ │
│ │ KPI 4: (empty)                                             │ │
│ │ KPI 5: (empty)                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Comments                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Strategic Framework Relationship:                           │ │
│ │ - Goal: 2 (ID: 1915ff7b-ece8-11f5-63bd-68be9e0244bc)      │ │
│ │ - Pillar: 2.1 (ID: 90b5601b-2267-df3c-9abb-68be9fe67ef2)  │ │
│ │ - Service: 2.1.1 (ID: 4d86dd66-054e-bf42-1ccc-68bea192ffe6)│ │
│ │ - Sub-Service: 2.1.1.1 (ID: 526a9796-eed1-0a86-9c5d-68bea5a9fcea)│ │
│ │                                                             │ │
│ │ Test submission from ICESCO Portal - 2025-09-12T13:30:00Z  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Strategic Framework Navigation

### Goals Module
```
┌─────────────────────────────────────────────────────────────────┐
│ ms_goal - List View                                            │
├─────────────────────────────────────────────────────────────────┤
│ [Search] [Filter] [Export] [Create]                            │
├─────────────────────────────────────────────────────────────────┤
│ ☐ ID                    │ Name │ Description                   │
│ ☐ 1915ff7b-ece8-11f5   │ 2    │ Strategic Goal 2 Description  │
│ ☐ 2915ff7b-ece8-11f5   │ 3    │ Strategic Goal 3 Description  │
│ ☐ 3915ff7b-ece8-11f5   │ 4    │ Strategic Goal 4 Description  │
└─────────────────────────────────────────────────────────────────┘
```

### Goal Detail View with Related Projects
```
┌─────────────────────────────────────────────────────────────────┐
│ Goal 2 - Detail View                          [Edit] [Delete]   │
├─────────────────────────────────────────────────────────────────┤
│ Goal Information                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ID: 1915ff7b-ece8-11f5-63bd-68be9e0244bc                   │ │
│ │ Name: 2                                                     │ │
│ │ Description: Strategic Goal 2 Description                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Related Records                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Related Projects (3)                                       │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Project A - Workshop on Education                       │ │
│ │ │ Project B - Training Program                            │ │
│ │ │ Project C - Research Initiative                         │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ Related Pillars (2)                                        │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Pillar 2.1 - Education and Training                    │ │
│ │ │ Pillar 2.2 - Research and Development                  │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Search and Filter Interface

### Advanced Search Dialog
```
┌─────────────────────────────────────────────────────────────────┐
│ Advanced Search - icesc_project_suggestions                   │
├─────────────────────────────────────────────────────────────────┤
│ Search Criteria                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Strategic Goal: [Dropdown ▼]                               │ │
│ │ Pillar: [Dropdown ▼]                                       │ │
│ │ Service: [Dropdown ▼]                                      │ │
│ │ Sub-Service: [Dropdown ▼]                                  │ │
│ │ Project Type: [Dropdown ▼]                                 │ │
│ │ Delivery Modality: [Dropdown ▼]                            │ │
│ │ Geographic Scope: [Dropdown ▼]                             │ │
│ │ Budget Range: [$____] to [$____]                           │ │
│ │ Date Range: [Start Date] to [End Date]                     │ │
│ │ Contact: [Text Input]                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ [Search] [Clear] [Save Search] [Cancel]                       │
└─────────────────────────────────────────────────────────────────┘
```

## Reports Interface

### Report Builder
```
┌─────────────────────────────────────────────────────────────────┐
│ Create Report - icesc_project_suggestions                     │
├─────────────────────────────────────────────────────────────────┤
│ Report Type: [Summary ▼] [Detail ▼] [Matrix ▼]                │
├─────────────────────────────────────────────────────────────────┤
│ Fields to Display                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Available Fields:                    Selected Fields:       │ │
│ │ ┌─────────────────────────────────┐ ┌─────────────────────┐ │ │
│ │ │ ☐ Name                          │ │ ✓ Name              │ │
│ │ │ ☐ Description                   │ │ ✓ Description       │ │
│ │ │ ☐ Contact Name                  │ │ ✓ Contact Name      │ │
│ │ │ ☐ Strategic Goal                │ │ ✓ Strategic Goal    │ │
│ │ │ ☐ Pillar                        │ │ ✓ Pillar            │ │
│ │ │ ☐ Service                       │ │ ✓ Service           │ │
│ │ │ ☐ Sub-Service                   │ │ ✓ Sub-Service       │ │
│ │ │ ☐ Budget Total                  │ │ ✓ Budget Total      │ │
│ │ │ ☐ Start Date                    │ │ ✓ Start Date        │ │
│ │ │ ☐ End Date                      │ │ ✓ End Date          │ │
│ │ │ ☐ Project Type                  │ │ ✓ Project Type      │ │
│ │ └─────────────────────────────────┘ └─────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Group By: [Strategic Goal ▼] [Pillar ▼] [Service ▼]           │
│ Sort By: [Name ▼] [Date ▼] [Budget ▼]                         │
│ Filter: [Add Filter]                                           │
├─────────────────────────────────────────────────────────────────┤
│ [Preview] [Save] [Cancel]                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation Paths

### Common User Journeys

#### 1. View All Projects
```
Login → icesc_project_suggestions → List View
```

#### 2. View Specific Project
```
Login → icesc_project_suggestions → List View → Click Project Name → Detail View
```

#### 3. Find Projects by Goal
```
Login → ms_goal → List View → Click Goal Name → Detail View → Related Projects
```

#### 4. Create New Project
```
Login → icesc_project_suggestions → Create → Fill Form → Save
```

#### 5. Search Projects
```
Login → icesc_project_suggestions → List View → Advanced Search → Set Criteria → Search
```

#### 6. Generate Report
```
Login → Reports → Create Report → Select Module → Choose Fields → Preview → Save
```

#### 7. View Strategic Framework
```
Login → ms_goal → List View → Click Goal → View Related Pillars → Click Pillar → View Services → Click Service → View Sub-Services
```

## Field Mapping Reference

### Project Suggestions Fields in SugarCRM
```
┌─────────────────────────────────────────────────────────────────┐
│ Field Name in CRM    │ Display Name        │ Type              │
├─────────────────────────────────────────────────────────────────┤
│ name                 │ Project Name        │ Text              │
│ description          │ Description         │ Text Area         │
│ problem_statement    │ Problem Statement   │ Text              │
│ contact_name         │ Contact Name        │ Text              │
│ contact_email        │ Contact Email       │ Email             │
│ contact_phone        │ Contact Phone       │ Phone             │
│ contact_role         │ Contact Role        │ Text              │
│ budget_icesco        │ ICESCO Budget       │ Currency          │
│ budget_member_state  │ Member State Budget │ Currency          │
│ budget_sponsorship   │ Sponsorship Budget  │ Currency          │
│ date_start           │ Start Date          │ Date              │
│ date_end             │ End Date            │ Date              │
│ project_frequency    │ Project Frequency   │ Dropdown          │
│ delivery_modality    │ Delivery Modality   │ Dropdown          │
│ geographic_scope     │ Geographic Scope    │ Dropdown          │
│ project_type         │ Project Type        │ Dropdown          │
│ beneficiaries        │ Beneficiaries       │ Multi-Select      │
│ partner1             │ Partner 1           │ Text              │
│ partner2             │ Partner 2           │ Text              │
│ partner3             │ Partner 3           │ Text              │
│ partner4             │ Partner 4           │ Text              │
│ partner5             │ Partner 5           │ Text              │
│ milestones1          │ Milestone 1         │ Text              │
│ milestones2          │ Milestone 2         │ Text              │
│ milestones3          │ Milestone 3         │ Text              │
│ milestones4          │ Milestone 4         │ Text              │
│ milestones5          │ Milestone 5         │ Text              │
│ kpis1                │ KPI 1               │ Text              │
│ kpis2                │ KPI 2               │ Text              │
│ kpis3                │ KPI 3               │ Text              │
│ kpis4                │ KPI 4               │ Text              │
│ kpis5                │ KPI 5               │ Text              │
│ expected_outputs     │ Expected Outputs    │ Text Area         │
│ comments             │ Comments            │ Text Area         │
│ strategic_goal_id    │ Strategic Goal ID   │ Text              │
│ strategic_goal       │ Strategic Goal      │ Text              │
│ pillar_id            │ Pillar ID           │ Text              │
│ pillar               │ Pillar              │ Text              │
│ service_id           │ Service ID          │ Text              │
│ service              │ Service             │ Text              │
│ sub_service_id       │ Sub-Service ID      │ Text              │
│ sub_service          │ Sub-Service         │ Text              │
└─────────────────────────────────────────────────────────────────┘
```

This visual guide should help you navigate the SugarCRM interface effectively to view and manage ICESCO project data and strategic framework relationships.



