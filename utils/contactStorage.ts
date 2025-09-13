/**
 * Contact Storage Utilities
 * Handles storing and retrieving contact information from localStorage
 */

export interface StoredContactInfo {
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

/**
 * Get contact information from localStorage
 */
export function getStoredContactInfo(): StoredContactInfo | null {
  try {
    const stored = localStorage.getItem("contactInfo");
    if (stored) {
      const contactInfo = JSON.parse(stored);
      console.log('=== DEBUG: Retrieved Contact Info from localStorage ===');
      console.log('Contact ID:', contactInfo.id);
      console.log('Full Name:', contactInfo.first_name, contactInfo.last_name);
      console.log('Email:', contactInfo.email1);
      console.log('Phone Work:', contactInfo.phone_work);
      console.log('Phone Mobile:', contactInfo.phone_mobile);
      console.log('Title:', contactInfo.title);
      console.log('Department:', contactInfo.department);
      console.log('Portal Access:', contactInfo.portal_access_c);
      console.log('=====================================================');
      return contactInfo;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving contact info from localStorage:', error);
    return null;
  }
}

/**
 * Get session ID from localStorage
 */
export function getStoredSessionId(): string | null {
  try {
    const sessionId = localStorage.getItem("session_id");
    if (sessionId) {
      console.log('=== DEBUG: Retrieved Session ID from localStorage ===');
      console.log('Session ID:', sessionId);
      console.log('====================================================');
      return sessionId;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving session ID from localStorage:', error);
    return null;
  }
}

/**
 * Get stored goals from localStorage
 */
export function getStoredGoals(): any[] {
  try {
    const stored = localStorage.getItem("goals");
    if (stored) {
      const goals = JSON.parse(stored);
      console.log('=== DEBUG: Retrieved Goals from localStorage ===');
      console.log('Goals Count:', goals.length);
      console.log('Goals:', goals);
      console.log('===============================================');
      return goals;
    }
    return [];
  } catch (error) {
    console.error('Error retrieving goals from localStorage:', error);
    return [];
  }
}

/**
 * Check if user is authenticated based on localStorage
 */
export function isUserAuthenticated(): boolean {
  const sessionId = getStoredSessionId();
  const contactInfo = getStoredContactInfo();
  const hashedEmail = localStorage.getItem("contactEeemailHash");
  
  const isAuth = !!(sessionId || (hashedEmail && contactInfo));
  
  console.log('=== DEBUG: Authentication Check ===');
  console.log('Session ID exists:', !!sessionId);
  console.log('Contact Info exists:', !!contactInfo);
  console.log('Hashed Email exists:', !!hashedEmail);
  console.log('Is Authenticated:', isAuth);
  console.log('===================================');
  
  return isAuth;
}

/**
 * Get user's full name from stored contact info
 */
export function getUserFullName(): string {
  const contactInfo = getStoredContactInfo();
  if (contactInfo) {
    const firstName = contactInfo.first_name || '';
    const lastName = contactInfo.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }
  return '';
}

/**
 * Get user's email from stored contact info
 */
export function getUserEmail(): string {
  const contactInfo = getStoredContactInfo();
  return contactInfo?.email1 || '';
}

/**
 * Get user's phone from stored contact info
 */
export function getUserPhone(): string {
  const contactInfo = getStoredContactInfo();
  return contactInfo?.phone_work || contactInfo?.phone_mobile || '';
}

/**
 * Get user's title from stored contact info
 */
export function getUserTitle(): string {
  const contactInfo = getStoredContactInfo();
  return contactInfo?.title || '';
}

/**
 * Get user's department from stored contact info
 */
export function getUserDepartment(): string {
  const contactInfo = getStoredContactInfo();
  return contactInfo?.department || '';
}

/**
 * Get user's primary address from stored contact info
 */
export function getUserPrimaryAddress(): {
  street?: string;
  city?: string;
  state?: string;
  postalcode?: string;
  country?: string;
} {
  const contactInfo = getStoredContactInfo();
  if (contactInfo) {
    return {
      street: contactInfo.primary_address_street,
      city: contactInfo.primary_address_city,
      state: contactInfo.primary_address_state,
      postalcode: contactInfo.primary_address_postalcode,
      country: contactInfo.primary_address_country
    };
  }
  return {};
}

/**
 * Get user's alternative address from stored contact info
 */
export function getUserAltAddress(): {
  street?: string;
  city?: string;
  state?: string;
  postalcode?: string;
  country?: string;
} {
  const contactInfo = getStoredContactInfo();
  if (contactInfo) {
    return {
      street: contactInfo.alt_address_street,
      city: contactInfo.alt_address_city,
      state: contactInfo.alt_address_state,
      postalcode: contactInfo.alt_address_postalcode,
      country: contactInfo.alt_address_country
    };
  }
  return {};
}

/**
 * Log all stored contact information
 */
export function logStoredContactInfo(): void {
  const contactInfo = getStoredContactInfo();
  const sessionId = getStoredSessionId();
  const goals = getStoredGoals();
  
  console.log('=== DEBUG: Complete Stored User Information ===');
  console.log('Session ID:', sessionId);
  console.log('Contact Info:', contactInfo);
  console.log('Goals:', goals);
  console.log('Full Name:', getUserFullName());
  console.log('Email:', getUserEmail());
  console.log('Phone:', getUserPhone());
  console.log('Title:', getUserTitle());
  console.log('Department:', getUserDepartment());
  console.log('Primary Address:', getUserPrimaryAddress());
  console.log('Alternative Address:', getUserAltAddress());
  console.log('===============================================');
}

/**
 * Clear all stored user information
 */
export function clearStoredUserInfo(): void {
  console.log('=== DEBUG: Clearing Stored User Information ===');
  localStorage.removeItem("contactEeemailHash");
  localStorage.removeItem("contactInfo");
  localStorage.removeItem("goals");
  localStorage.removeItem("session_id");
  console.log('All user information cleared from localStorage');
  console.log('===============================================');
}
