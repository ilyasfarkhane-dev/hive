/**
 * Test CRM login directly without using the Next.js API
 * This bypasses the API layer to test CRM authentication directly
 */

const md5 = require('md5');

const CRM_CONFIG = {
  baseUrl: process.env.CRM_BASE_URL || 'https://crm.icesco.org',
  username: process.env.CRM_USERNAME || 'portal',
  password: process.env.CRM_PASSWORD || 'Portal@2025',
};

async function authenticate() {
  console.log('Authenticating with CRM...');
  
  const authData = {
    user_auth: {
      user_name: CRM_CONFIG.username,
      password: md5(CRM_CONFIG.password),
    },
    application_name: "MyApp",
  };
  
  const response = await fetch(`${CRM_CONFIG.baseUrl}/service/v4_1/rest.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      method: 'login',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify(authData),
    }),
  });
  
  const data = await response.json();
  if (data.id) {
    console.log('✅ Authenticated successfully, session:', data.id.substring(0, 20) + '...');
    return data.id;
  } else {
    throw new Error('Authentication failed: ' + JSON.stringify(data));
  }
}

async function searchContact(sessionId, login, password) {
  console.log('\n=== Searching for contact ===');
  console.log('Login:', login);
  console.log('Password:', password);
  
  // Get all contacts and filter (like the fallback in the actual code)
  const searchData = {
    session: sessionId,
    module_name: 'Contacts',
    query: '', // Empty query to get all
    order_by: 'contacts.date_entered DESC',
    offset: 0,
    select_fields: [
      'id',
      'first_name',
      'last_name',
      'email1',
      'phone_mobile',
      'phone_work',
      'title',
      'account_name',
      'account_id',
      'primary_address_country',
      'login_c',
      'password_c'
    ],
    max_results: 100
  };

  const response = await fetch(`${CRM_CONFIG.baseUrl}/service/v4_1/rest.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      method: 'get_entry_list',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify(searchData),
    }),
  });

  const data = await response.json();
  
  console.log('\nContacts returned:', data.entry_list?.length || 0);

  if (data.entry_list && data.entry_list.length > 0) {
    // Find the matching contact
    const matchingContact = data.entry_list.find((contact) => 
      contact.name_value_list.login_c?.value === login
    );
    
    if (matchingContact) {
      console.log('\n✅ Found contact with matching login_c');
      console.log('Contact ID:', matchingContact.id);
      console.log('Name:', matchingContact.name_value_list.first_name?.value, matchingContact.name_value_list.last_name?.value);
      console.log('Email:', matchingContact.name_value_list.email1?.value);
      console.log('Login (login_c):', matchingContact.name_value_list.login_c?.value);
      console.log('Password (password_c):', matchingContact.name_value_list.password_c?.value);
      
      // Verify password
      const storedPassword = matchingContact.name_value_list.password_c?.value;
      console.log('\n=== Password Verification ===');
      console.log('Stored password:', `"${storedPassword}"`);
      console.log('Provided password:', `"${password}"`);
      console.log('Passwords match:', storedPassword === password ? '✅ YES' : '❌ NO');
      
      if (storedPassword === password) {
        console.log('\n✅✅✅ LOGIN SHOULD SUCCEED ✅✅✅');
        return {
          success: true,
          contact: matchingContact
        };
      } else {
        console.log('\n❌ Password mismatch - login will fail');
        return {
          success: false,
          error: 'Invalid password'
        };
      }
    } else {
      console.log('\n❌ No contact found with login_c =', login);
      console.log('\nAvailable login_c values (first 10):');
      data.entry_list.slice(0, 10).forEach((contact, idx) => {
        console.log(`  ${idx + 1}. "${contact.name_value_list.login_c?.value || '(empty)'}"`);
      });
      return {
        success: false,
        error: 'Contact not found'
      };
    }
  } else {
    console.log('❌ No contacts returned from CRM');
    return {
      success: false,
      error: 'No contacts found'
    };
  }
}

async function main() {
  try {
    const email = process.argv[2] || 'marcelkouka73@gmail.com';
    const password = process.argv[3] || 'MarGm26';
    
    console.log('Testing CRM login for:', email);
    console.log('With password:', password);
    
    // Authenticate with admin credentials
    const sessionId = await authenticate();
    
    // Search for contact
    const result = await searchContact(sessionId, email, password);
    
    console.log('\n=== FINAL RESULT ===');
    console.log('Success:', result.success);
    if (!result.success) {
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

