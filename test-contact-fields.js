/**
 * Test script to check contact fields in CRM
 * This helps diagnose why some contacts can't log in
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
    console.log('✅ Authenticated successfully');
    return data.id;
  } else {
    throw new Error('Authentication failed: ' + JSON.stringify(data));
  }
}

async function searchContactByEmail(sessionId, email) {
  console.log('\n=== Searching for contact with email:', email, '===');
  
  // Try searching by email1 field - use empty query to get all and filter later
  const searchData = {
    session: sessionId,
    module_name: 'Contacts',
    query: '', // Empty query to avoid database errors with custom fields
    offset: 0,
    select_fields: [
      'id',
      'first_name',
      'last_name',
      'email1',
      'login_c',
      'password_c',
      'phone_mobile',
      'phone_work',
      'title',
      'account_name',
    ],
    max_results: 100 // Get more to find the contact
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
  
  const responseText = await response.text();
  
  try {
    const data = JSON.parse(responseText);
    
    // Filter to find contacts with matching email
    if (data.entry_list) {
      data.entry_list = data.entry_list.filter(contact => 
        contact.name_value_list.email1?.value === email
      );
    }
    
    return data;
  } catch (e) {
    console.error('Failed to parse response:', responseText.substring(0, 200));
    return { error: 'Parse error', raw: responseText };
  }
}

async function searchContactByLogin(sessionId, login) {
  console.log('\n=== Searching for contact with login_c:', login, '===');
  
  // Try searching by login_c field (this is what the app uses)
  // Use empty query to avoid database errors
  const searchData = {
    session: sessionId,
    module_name: 'Contacts',
    query: '', // Empty query to get all contacts
    offset: 0,
    select_fields: [
      'id',
      'first_name',
      'last_name',
      'email1',
      'login_c',
      'password_c',
      'phone_mobile',
      'phone_work',
      'title',
      'account_name',
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
  
  const responseText = await response.text();
  
  try {
    const data = JSON.parse(responseText);
    
    // Filter to find contacts with matching login_c
    if (data.entry_list) {
      data.entry_list = data.entry_list.filter(contact => 
        contact.name_value_list.login_c?.value === login
      );
    }
    
    return data;
  } catch (e) {
    console.error('Failed to parse response:', responseText.substring(0, 200));
    return { error: 'Parse error', raw: responseText };
  }
}

async function main() {
  try {
    const email = process.argv[2] || 'marcelkouka73@gmail.com';
    const expectedPassword = process.argv[3] || 'MarGm268';
    
    console.log('Testing contact:', email);
    console.log('Expected password:', expectedPassword);
    
    // Authenticate
    const sessionId = await authenticate();
    
    // Search by email1 field
    console.log('\n📧 Searching by email1 field...');
    const emailResult = await searchContactByEmail(sessionId, email);
    
    if (emailResult.entry_list && emailResult.entry_list.length > 0) {
      console.log(`✅ Found ${emailResult.entry_list.length} contact(s) by email1`);
      emailResult.entry_list.forEach((contact, idx) => {
        console.log(`\n--- Contact ${idx + 1} ---`);
        console.log('ID:', contact.id);
        console.log('Name:', contact.name_value_list.first_name?.value, contact.name_value_list.last_name?.value);
        console.log('Email (email1):', contact.name_value_list.email1?.value || '❌ EMPTY');
        console.log('Login (login_c):', contact.name_value_list.login_c?.value || '❌ EMPTY');
        console.log('Password (password_c):', contact.name_value_list.password_c?.value || '❌ EMPTY');
        console.log('Account:', contact.name_value_list.account_name?.value || 'N/A');
        
        // Check if credentials match
        const loginMatches = contact.name_value_list.login_c?.value === email;
        const passwordMatches = contact.name_value_list.password_c?.value === expectedPassword;
        
        console.log('\n🔍 Diagnosis:');
        console.log(`  login_c matches email: ${loginMatches ? '✅' : '❌'}`);
        console.log(`  password_c matches expected: ${passwordMatches ? '✅' : '❌'}`);
        
        if (!contact.name_value_list.login_c?.value) {
          console.log('\n⚠️  ISSUE: login_c field is EMPTY!');
          console.log('   Solution: Set login_c = "' + email + '" in CRM');
        } else if (!loginMatches) {
          console.log('\n⚠️  ISSUE: login_c field does not match email!');
          console.log('   login_c value: "' + contact.name_value_list.login_c?.value + '"');
          console.log('   email value: "' + email + '"');
        }
        
        if (!contact.name_value_list.password_c?.value) {
          console.log('\n⚠️  ISSUE: password_c field is EMPTY!');
          console.log('   Solution: Set password_c in CRM');
        } else if (!passwordMatches) {
          console.log('\n⚠️  ISSUE: password_c does not match expected password!');
          console.log('   Stored: "' + contact.name_value_list.password_c?.value + '"');
          console.log('   Expected: "' + expectedPassword + '"');
        }
      });
    } else {
      console.log('❌ No contact found with email1 =', email);
      console.log('Error:', emailResult.error);
    }
    
    // Search by login_c field (what the app actually uses)
    console.log('\n\n🔑 Searching by login_c field (what the app uses)...');
    const loginResult = await searchContactByLogin(sessionId, email);
    
    if (loginResult.entry_list && loginResult.entry_list.length > 0) {
      console.log(`✅ Found ${loginResult.entry_list.length} contact(s) by login_c`);
      loginResult.entry_list.forEach((contact, idx) => {
        console.log(`\n--- Contact ${idx + 1} ---`);
        console.log('ID:', contact.id);
        console.log('Name:', contact.name_value_list.first_name?.value, contact.name_value_list.last_name?.value);
        console.log('Email (email1):', contact.name_value_list.email1?.value || '❌ EMPTY');
        console.log('Login (login_c):', contact.name_value_list.login_c?.value || '❌ EMPTY');
        console.log('Password (password_c):', contact.name_value_list.password_c?.value || '❌ EMPTY');
      });
    } else {
      console.log('❌ No contact found with login_c =', email);
      console.log('Error:', loginResult.error);
      console.log('\n⚠️  This is why login fails! The app searches by login_c, not email1.');
    }
    
    console.log('\n\n=== SUMMARY ===');
    const foundByEmail = emailResult.entry_list && emailResult.entry_list.length > 0;
    const foundByLogin = loginResult.entry_list && loginResult.entry_list.length > 0;
    
    if (foundByLogin) {
      console.log('✅ Contact can log in (found by login_c)');
    } else if (foundByEmail) {
      console.log('⚠️  Contact exists but CANNOT log in');
      console.log('   Reason: login_c field is not set or does not match the email');
      console.log('\n   TO FIX: In the CRM, update the contact and set:');
      console.log('   - login_c = "' + email + '"');
      console.log('   - password_c = "' + expectedPassword + '"');
    } else {
      console.log('❌ Contact does not exist in CRM');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

