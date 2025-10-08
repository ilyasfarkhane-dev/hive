/**
 * Test login API with credentials
 */

async function testLogin(email, password) {
  console.log('Testing login with:', { email, password: '***' });
  
  const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      language: 'en'
    }),
  });
  
  const data = await response.json();
  
  console.log('\n=== LOGIN API RESPONSE ===');
  console.log('Status:', response.status);
  console.log('Success:', data.success);
  
  if (data.success) {
    console.log('✅ Login successful!');
    console.log('\nContact Info:');
    console.log('  ID:', data.contactInfo?.id);
    console.log('  Name:', data.contactInfo?.name);
    console.log('  Email:', data.contactInfo?.email);
    console.log('  Organization:', data.contactInfo?.organization);
    console.log('  Account ID:', data.contactInfo?.account_id);
    console.log('  Account Name:', data.contactInfo?.account_name);
    console.log('\nSession ID:', data.sessionId);
    console.log('Goals count:', data.goals?.length || 0);
  } else {
    console.log('❌ Login failed!');
    console.log('Message:', data.message);
  }
  
  return data;
}

async function main() {
  const email = process.argv[2] || 'marcelkouka73@gmail.com';
  const password = process.argv[3] || 'MarGm26';
  
  try {
    await testLogin(email, password);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

