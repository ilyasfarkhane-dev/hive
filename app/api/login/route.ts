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
    console.log('=== Login API Called ===');
    const { email, password, language = 'en' } = await request.json();
    console.log('Login attempt for email:', email);

    // Try CRM authentication first, with fallback to bypass mode
    try {
      const crmService = new CRMService(CRM_CONFIG);
      
      // First authenticate with admin credentials
      console.log('Authenticating with CRM using admin credentials...');
      await crmService.authenticate();
      
      // Search for the contact in CRM
      console.log('Searching for contact in CRM...');
      const contactResult = await crmService.searchContact(email, password);
      
      if (contactResult.success && contactResult.contact) {
        console.log('Contact found in CRM:', contactResult.contact);
        
        // Use the actual CRM session ID
        const sessionId = crmService.currentSessionId;
        
        // Create contact info from CRM data
        const contactInfo = {
          id: contactResult.contact.id,
          name: `${contactResult.contact.first_name} ${contactResult.contact.last_name}`.trim(),
          email: contactResult.contact.email,
          phone: contactResult.contact.phone,
          organization: contactResult.contact.account_name || 'ICESCO',
          role: contactResult.contact.title || 'Member',
          country: contactResult.contact.country
        };

        // Create demo goals (you might want to fetch these from CRM too)
        const goals = [
          {
            id: "goal_1",
            name: "Strategic Goal 1",
            description: "Strategic goal from CRM"
          },
          {
            id: "goal_2",
            name: "Strategic Goal 2", 
            description: "Another strategic goal"
          }
        ];

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
            message: "Invalid login or password" 
          },
          { status: 401 }
        );
      }

    } catch (crmError) {
      console.error('CRM authentication/search failed:', crmError);
      console.log('=== FALLING BACK TO BYPASS MODE ===');
      
      // Bypass mode for development when CRM is unavailable
      const validCredentials = [
        { email: 'demo@icesco.org', password: 'demo123', name: 'Demo User', organization: 'ICESCO' },
        { email: 'admin@icesco.org', password: 'admin123', name: 'Admin User', organization: 'ICESCO' },
        { email: 'test@icesco.org', password: 'test123', name: 'Test User', organization: 'ICESCO' }
      ];
      
      const user = validCredentials.find(cred => cred.email === email && cred.password === password);
      
      if (user) {
        console.log('Bypass authentication successful for:', user.email);
        
        // Create contact info for bypass mode
        const contactInfo = {
          id: `bypass_${Date.now()}`,
          name: user.name,
          email: user.email,
          phone: '+1234567890',
          organization: user.organization,
          role: 'Member',
          country: 'Morocco'
        };

        // Create demo goals
        const goals = [
          {
            id: "goal_1",
            name: "Strategic Goal 1",
            description: "Strategic goal from bypass mode"
          },
          {
            id: "goal_2",
            name: "Strategic Goal 2", 
            description: "Another strategic goal"
          }
        ];

        // Generate hashed email for backward compatibility
        const hashedEmail = Buffer.from(email).toString('base64');
        const sessionId = `bypass_session_${Date.now()}`;

        console.log('=== DEBUG: BYPASS Login Success ===');
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
          message: "Login successful (bypass mode - CRM unavailable)"
        });
      } else {
        console.log('Invalid credentials in bypass mode');
        return NextResponse.json(
          { 
            success: false, 
            message: "Invalid login or password" 
          },
          { status: 401 }
        );
      }
    }

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Login failed. Please try again." 
      },
      { status: 500 }
    );
  }
}
