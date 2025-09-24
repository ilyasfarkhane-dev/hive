import { NextRequest, NextResponse } from 'next/server';
import CRMService from '@/services/crmService';

// CRM Configuration from environment variables
const CRM_CONFIG = {
  baseUrl: process.env.CRM_BASE_URL || 'http://3.145.21.11',
  username: process.env.CRM_USERNAME || 'your-username',
  password: process.env.CRM_PASSWORD || 'your-password',
  application: process.env.CRM_APPLICATION || 'ICESCO Portal',
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, language = 'en' } = await request.json();

    // CRM authentication 
    const crmService = new CRMService(CRM_CONFIG);
    
    // First authenticate with admin credentials from .env
    await crmService.authenticate();
    
    // Search for the contact in CRM using provided credentials
    const contactResult = await crmService.searchContact(email, password);
    
    if (contactResult.success && contactResult.contact) {
      console.log('Contact found in CRM:', contactResult.contact);
      
      // Use the actual CRM session ID
      const sessionId = crmService.currentSessionId;
      
      // Try to get account ID if we have account name but no ID
      let accountId = contactResult.contact.account_id || null;
      const accountName = contactResult.contact.account_name;
      
      if (accountName && !accountId) {
        console.log('=== DEBUG: Trying to get account ID during login ===');
        console.log('Account name:', accountName);
        console.log('Account ID from contact:', accountId);
        
        try {
          // Try multiple search approaches
          const searchQueries = [
            `accounts.name='${accountName.replace(/'/g, "\\'")}'`, // With table prefix
            `name='${accountName.replace(/'/g, "\\'")}'`, // Without table prefix
            `name LIKE '%${accountName.replace(/'/g, "\\'")}%'` // Partial match
          ];
          
          let accountFound = false;
          
          for (let i = 0; i < searchQueries.length && !accountFound; i++) {
            console.log(`Trying account search query ${i + 1}:`, searchQueries[i]);
            
            try {
              const accountSearchData = {
                session: sessionId,
                module_name: 'Accounts',
                query: searchQueries[i],
                select_fields: ['id', 'name'],
                max_results: 1
              };
              
              const accountResponse = await fetch(`${CRM_CONFIG.baseUrl}/service/v4_1/rest.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  method: 'get_entry_list',
                  input_type: 'JSON',
                  response_type: 'JSON',
                  rest_data: JSON.stringify(accountSearchData),
                }),
                signal: AbortSignal.timeout(5000), // 5 second timeout per query
              });
              
              const responseText = await accountResponse.text();
              console.log(`Account search raw response ${i + 1}:`, responseText);
              
              try {
                const accountData = JSON.parse(responseText);
                console.log(`Account search parsed response ${i + 1}:`, accountData);
                
                if (accountData.entry_list && accountData.entry_list.length > 0) {
                  accountId = accountData.entry_list[0].id;
                  console.log('✅ Found account ID during login:', accountId);
                  accountFound = true;
                } else {
                  console.log(`❌ No results with query ${i + 1}`);
                }
              } catch (parseError) {
                console.error(`Failed to parse account search response ${i + 1}:`, parseError);
                console.log('Raw response was:', responseText);
                console.log('This might be a database error or invalid query');
              }
            } catch (fetchError: any) {
              console.error(`Account search fetch error ${i + 1}:`, fetchError);
              if (fetchError?.name === 'TimeoutError' || fetchError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
                console.log(`Query ${i + 1} timed out`);
              }
            }
          }
          
          if (!accountFound) {
            console.log('❌ No account found with any search method for:', accountName);
          }
        } catch (searchError: any) {
          console.error('Account search failed during login:', searchError);
          if (searchError?.name === 'TimeoutError' || searchError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
            console.log('Account search timed out during login - will retry during project submission');
          }
          // Don't fail login if account search fails
        }
      }
      
      // Create contact info from CRM data
      const contactInfo = {
        id: contactResult.contact.id,
        name: `${contactResult.contact.first_name} ${contactResult.contact.last_name}`.trim(),
        email: contactResult.contact.email,
        phone: contactResult.contact.phone,
        organization: accountName || 'ICESCO',
        role: contactResult.contact.title || 'Member',
        country: contactResult.contact.country,
        // Store account information for project submissions
        account_id: accountId,
        account_name: accountName
      };

      // Fetch goals dynamically from CRM
      let goals = [];
      try {
        console.log('Fetching goals from CRM...');
        goals = await crmService.getGoals();
        console.log('Goals fetched from CRM:', goals.length);
      } catch (goalError) {
        console.warn('Failed to fetch goals from CRM, using defaults:', goalError);
        // Fallback to default goals if CRM goals fetch fails
        goals = [
          {
            id: "default_goal_1",
            name: "Strategic Goal 1",
            description: "Default strategic goal"
          },
          {
            id: "default_goal_2",
            name: "Strategic Goal 2", 
            description: "Another default strategic goal"
          }
        ];
      }

      // Generate hashed email for backward compatibility
      const hashedEmail = Buffer.from(email).toString('base64');

      console.log('=== DEBUG: CRM Login Success ===');
      console.log('Contact Info:', contactInfo);
      console.log('Session ID:', sessionId);
      console.log('Goals Count:', goals.length);
      console.log('================================');

      return NextResponse.json({
        success: true,
        hashedEmail,
        sessionId,
        contactInfo,
        goals,
        message: "Login successful"
      });
    } else {
      console.log('Contact not found in CRM:', contactResult.error);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid login credentials. Please check your email and password." 
        },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Login API error:', error);
    
    // Check if it's a CRM connection error
    if (error instanceof Error && (
      error.message.includes('ETIMEDOUT') || 
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('fetch failed')
    )) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Unable to connect to authentication server. Please try again later." 
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Authentication server error. Please contact support." 
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Login failed. Please try again." 
      },
      { status: 500 }
    );
  }
}
