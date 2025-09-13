/**
 * Session validation utilities
 */

// Flag to prevent infinite redirect loops
let hasValidatedSession = false;

/**
 * Check if a valid session exists in localStorage
 * @returns boolean - true if session exists, false otherwise
 */
export const hasValidSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const sessionId = localStorage.getItem('session_id');
  const contactHash = localStorage.getItem('contactEeemailHash');
  
  // Primary check: session_id exists
  if (sessionId) return true;
  
  // Fallback check: contactEeemailHash exists (backward compatibility)
  if (contactHash) return true;
  
  return false;
};

/**
 * Clear all session data from localStorage
 */
export const clearSession = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('session_id');
  localStorage.removeItem('contactEeemailHash');
  localStorage.removeItem('contactInfo');
  localStorage.removeItem('goals');
  localStorage.removeItem('selectedCards');
  
  // Reset validation flag
  hasValidatedSession = false;
};

/**
 * Redirect to login page
 */
export const redirectToLogin = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear any existing session data
  clearSession();
  
  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Reset validation flag (call this after successful login)
 */
export const resetValidationFlag = (): void => {
  hasValidatedSession = false;
};

/**
 * Validate session on page load and redirect if invalid
 * This should be called in useEffect on every protected page
 */
export const validateSessionOnLoad = (): boolean => {
  // Prevent infinite loops
  if (hasValidatedSession) {
    console.log('Session already validated, skipping validation');
    return hasValidSession();
  }

  console.log('Validating session...');
  if (!hasValidSession()) {
    console.log('No valid session found');
    // Only redirect if we're not already on the login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      console.log('Redirecting to login page');
      hasValidatedSession = true;
      redirectToLogin();
    }
    return false;
  }
  
  console.log('Valid session found');
  hasValidatedSession = true;
  return true;
};
