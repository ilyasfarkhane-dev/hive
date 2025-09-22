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

    // CRM authentication only - no bypass mode
    const crmService = new CRMService(CRM_CONFIG);
    
    // First authenticate with admin credentials from .env
    console.log('Authenticating with CRM using portal credentials...');
    await crmService.authenticate();
    
    // Search for the contact in CRM using provided credentials
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
