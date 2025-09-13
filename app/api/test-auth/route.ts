import { NextRequest, NextResponse } from 'next/server';
import CRMService from '@/services/crmService';

// CRM Configuration for testing
const CRM_CONFIG = {
  baseUrl: process.env.CRM_BASE_URL || 'http://3.145.21.11',
  username: process.env.CRM_USERNAME || 'your-username',
  password: process.env.CRM_PASSWORD || 'your-password',
  application: process.env.CRM_APPLICATION || 'ICESCO Portal',
};

export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing CRM Authentication ===');
    console.log('Environment variables:');
    console.log('CRM_BASE_URL:', process.env.CRM_BASE_URL);
    console.log('CRM_USERNAME:', process.env.CRM_USERNAME);
    console.log('CRM_PASSWORD:', process.env.CRM_PASSWORD ? '***HIDDEN***' : 'NOT SET');
    console.log('CRM_APPLICATION:', process.env.CRM_APPLICATION);
    
    console.log('CRM Config:', CRM_CONFIG);
    
    // Test basic connection first
    try {
      const testUrl = `${CRM_CONFIG.baseUrl}/service/v4_1/rest.php`;
      console.log('Testing connection to:', testUrl);
      
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_server_info',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({}),
        }),
      });
      
      console.log('Connection test status:', testResponse.status);
      const testData = await testResponse.text();
      console.log('Connection test response:', testData);
      
    } catch (connError) {
      console.error('Connection test failed:', connError);
      return NextResponse.json({
        success: false,
        error: `Connection failed: ${connError instanceof Error ? connError.message : 'Unknown error'}`,
        config: CRM_CONFIG
      }, { status: 500 });
    }
    
    const crmService = new CRMService(CRM_CONFIG);
    
    try {
      const sessionId = await crmService.authenticate();
      return NextResponse.json({
        success: true,
        sessionId: sessionId,
        message: 'Authentication successful'
      });
    } catch (authError) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({
        success: false,
        error: authError instanceof Error ? authError.message : 'Authentication failed',
        config: {
          baseUrl: CRM_CONFIG.baseUrl,
          username: CRM_CONFIG.username,
          application: CRM_CONFIG.application
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
