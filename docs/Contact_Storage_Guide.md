# Contact Storage Guide

## Overview
This guide explains how contact information is stored in localStorage when login is successful, and how to access and use this stored data throughout the application.

## Features

### 1. Comprehensive Contact Information Storage
When a user logs in successfully, the system stores detailed contact information in localStorage including:

- **Basic Information**: Name, email, phone numbers, title, department
- **Address Information**: Primary and alternative addresses with full details
- **System Information**: Contact ID, portal access, dates, user assignments
- **Authentication Data**: Session ID, hashed email, goals

### 2. Automatic Storage on Login
The system automatically stores contact information when:
- User successfully logs in
- Contact is found in CRM
- Portal access is verified
- Password is validated

### 3. Persistent Storage
Contact information persists across:
- Browser sessions
- Page refreshes
- Application restarts
- Tab closures

## Data Structure

### ContactInfo Interface
```typescript
interface ContactInfo {
  id?: string;
  first_name?: string;
  last_name?: string;
  login_c?: string;
  email1?: string;
  phone_work?: string;
  phone_mobile?: string;
  title?: string;
  department?: string;
  description?: string;
  primary_address_street?: string;
  primary_address_city?: string;
  primary_address_state?: string;
  primary_address_postalcode?: string;
  primary_address_country?: string;
  alt_address_street?: string;
  alt_address_city?: string;
  alt_address_state?: string;
  alt_address_postalcode?: string;
  alt_address_country?: string;
  password_c?: string;
  portal_access_c?: string;
  date_entered?: string;
  date_modified?: string;
  created_by?: string;
  modified_user_id?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  created_by_name?: string;
  modified_by_name?: string;
  [key: string]: any;
}
```

## Storage Keys

### localStorage Keys
- **`contactInfo`**: Complete contact information object
- **`session_id`**: CRM session ID for API calls
- **`contactEeemailHash`**: Hashed email for authentication
- **`goals`**: User's associated goals from CRM

## Usage Examples

### 1. Using the AuthContext Hook
```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { contactInfo, sessionId, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {contactInfo?.first_name} {contactInfo?.last_name}</h1>
      <p>Email: {contactInfo?.email1}</p>
      <p>Phone: {contactInfo?.phone_work}</p>
      <p>Title: {contactInfo?.title}</p>
    </div>
  );
}
```

### 2. Using the Contact Storage Utilities
```typescript
import { 
  getStoredContactInfo, 
  getUserFullName, 
  getUserEmail,
  isUserAuthenticated 
} from '@/utils/contactStorage';

function MyComponent() {
  const contactInfo = getStoredContactInfo();
  const fullName = getUserFullName();
  const email = getUserEmail();
  const isAuth = isUserAuthenticated();
  
  return (
    <div>
      <h1>Hello, {fullName}</h1>
      <p>Contact: {email}</p>
      <p>Authenticated: {isAuth ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 3. Using the Stored Contact Hook
```typescript
import { useStoredContact } from '@/hooks/useStoredContact';

function MyComponent() {
  const {
    contactInfo,
    sessionId,
    isAuthenticated,
    fullName,
    email,
    phone,
    title,
    department,
    primaryAddress,
    refreshData,
    logContactInfo
  } = useStoredContact();
  
  return (
    <div>
      <h1>{fullName}</h1>
      <p>{title} - {department}</p>
      <p>{email} | {phone}</p>
      <p>{primaryAddress.city}, {primaryAddress.country}</p>
      
      <button onClick={refreshData}>Refresh Data</button>
      <button onClick={logContactInfo}>Log to Console</button>
    </div>
  );
}
```

## Console Logging

### Login Success Logging
When login is successful, you'll see detailed logs:

```
=== DEBUG: Contact Retrieved ===
Login: user@example.com
Contact found: true
Contact ID: contact-123
Contact Name: John Doe
Contact Email: user@example.com
Contact Phone: +1234567890
Portal Access: 1
===============================

=== DEBUG: Login Success - Contact Info ===
Contact ID: contact-123
Full Name: John Doe
Email: user@example.com
Phone Work: +1234567890
Phone Mobile: +0987654321
Title: Project Manager
Department: IT Department
Primary Address: {
  street: "123 Main Street",
  city: "New York",
  state: "NY",
  postalcode: "10001",
  country: "USA"
}
Portal Access: 1
Date Entered: 2025-01-01T00:00:00Z
Date Modified: 2025-01-12T14:30:00Z
==========================================

=== DEBUG: Storing Contact Info in localStorage ===
Contact Info: { id: "contact-123", first_name: "John", ... }
Session ID: session-abc123
Goals Count: 5
================================================
```

### Data Retrieval Logging
When accessing stored data:

```
=== DEBUG: Retrieved Contact Info from localStorage ===
Contact ID: contact-123
Full Name: John Doe
Email: user@example.com
Phone Work: +1234567890
Phone Mobile: +0987654321
Title: Project Manager
Department: IT Department
Portal Access: 1
=====================================================

=== DEBUG: Retrieved Session ID from localStorage ===
Session ID: session-abc123
====================================================

=== DEBUG: Retrieved Goals from localStorage ===
Goals Count: 5
Goals: [
  { id: "goal-1", title: "Strategic Goal 1" },
  { id: "goal-2", title: "Strategic Goal 2" },
  ...
]
===============================================
```

## Available Utility Functions

### Contact Information
- `getStoredContactInfo()`: Get complete contact object
- `getUserFullName()`: Get formatted full name
- `getUserEmail()`: Get primary email
- `getUserPhone()`: Get work or mobile phone
- `getUserTitle()`: Get job title
- `getUserDepartment()`: Get department

### Address Information
- `getUserPrimaryAddress()`: Get primary address object
- `getUserAltAddress()`: Get alternative address object

### Authentication
- `getStoredSessionId()`: Get CRM session ID
- `getStoredGoals()`: Get associated goals
- `isUserAuthenticated()`: Check authentication status

### Utility Functions
- `logStoredContactInfo()`: Log all stored information
- `clearStoredUserInfo()`: Clear all stored data

## Components

### ContactInfoDisplay Component
A comprehensive component that displays all stored contact information:

```tsx
import ContactInfoDisplay from '@/components/ContactInfoDisplay';

function MyPage() {
  return <ContactInfoDisplay />;
}
```

**Features:**
- Complete contact information display
- Address information (primary and alternative)
- System information (dates, assignments)
- Goals display
- Raw data viewer
- Refresh and logging buttons

### Contact Info Page
Full page component at `/contact-info`:

- Authentication check
- Complete contact information display
- Responsive layout
- Interactive features

## Data Flow

### 1. Login Process
```
User Login → CRM Authentication → Contact Retrieval → localStorage Storage → Context Update
```

### 2. Data Access
```
Component → Hook/Utility → localStorage → Parsed Data → Display
```

### 3. Data Persistence
```
Login Success → Store in localStorage → Available on Page Load → Context Initialization
```

## Error Handling

### Common Issues
1. **No Contact Found**: User not found in CRM
2. **Access Denied**: Portal access not enabled
3. **Invalid Password**: Password doesn't match
4. **Storage Error**: localStorage not available

### Error Logging
All errors are logged to console with detailed information:
```
Error retrieving contact info from localStorage: [error details]
```

## Best Practices

### 1. Always Check Authentication
```typescript
const { isAuthenticated, contactInfo } = useAuth();
if (!isAuthenticated) {
  return <LoginPrompt />;
}
```

### 2. Handle Missing Data
```typescript
const fullName = getUserFullName() || 'Unknown User';
const email = getUserEmail() || 'No email available';
```

### 3. Use Appropriate Hooks
- Use `useAuth()` for basic authentication and contact info
- Use `useStoredContact()` for advanced contact operations
- Use utility functions for specific data access

### 4. Refresh Data When Needed
```typescript
const { refreshData } = useStoredContact();
// Call refreshData() after login or data updates
```

## Security Considerations

### 1. Sensitive Data
- Password is stored but not displayed
- Session ID is stored for API calls
- All data is stored in localStorage (client-side)

### 2. Data Validation
- Contact information is validated against CRM
- Portal access is verified before storage
- Session ID is validated for API calls

### 3. Logout Cleanup
- All stored data is cleared on logout
- Session ID is removed
- Authentication state is reset

## Troubleshooting

### Common Issues

1. **Contact Info Not Loading**
   - Check if user is authenticated
   - Verify localStorage has data
   - Check console for errors

2. **Data Not Persisting**
   - Check browser localStorage support
   - Verify data is being stored correctly
   - Check for storage quota issues

3. **Authentication Issues**
   - Verify session ID exists
   - Check contact info in localStorage
   - Verify portal access is enabled

### Debug Steps

1. **Check Console Logs**
   - Look for contact retrieval logs
   - Check storage operation logs
   - Verify authentication status

2. **Inspect localStorage**
   - Open browser DevTools
   - Check Application → Local Storage
   - Verify all keys exist

3. **Test Data Access**
   - Use utility functions directly
   - Check hook return values
   - Verify component rendering

## Integration with Project Submission

The stored contact information is automatically used in project submissions:

```typescript
// In project submission
const { contactInfo } = useAuth();
const projectData = {
  contact_name: contactInfo?.first_name + ' ' + contactInfo?.last_name,
  contact_email: contactInfo?.email1,
  contact_phone: contactInfo?.phone_work,
  contact_role: contactInfo?.title,
  // ... other project data
};
```

This ensures that project submissions always use the current user's contact information from the stored data.

## Summary

The contact storage system provides:
- ✅ **Comprehensive data storage** for all contact information
- ✅ **Automatic storage** on successful login
- ✅ **Persistent data** across browser sessions
- ✅ **Easy access** through hooks and utilities
- ✅ **Detailed logging** for debugging
- ✅ **Error handling** for edge cases
- ✅ **Security considerations** for sensitive data

The system is fully integrated with the authentication flow and project submission system, ensuring that user contact information is always available and up-to-date.



