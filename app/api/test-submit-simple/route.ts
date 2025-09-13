import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Test Submit Simple ===');
    
    const { subserviceId, projectData, contactInfo } = await request.json();
    console.log('Subservice ID:', subserviceId);
    console.log('Project Data:', JSON.stringify(projectData, null, 2));
    console.log('Contact Info:', JSON.stringify(contactInfo, null, 2));
    
    // Validate contact information
    if (!contactInfo || !contactInfo.id) {
      console.error('No contact information provided in request');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No contact information provided. Please log in again.',
          errorType: 'NO_CONTACT_INFO'
        },
        { status: 400 }
      );
    }
    
    // Simulate a successful response
    return NextResponse.json({
      success: true,
      message: 'Test submission successful',
      data: {
        id: 'test-id-123',
        name: projectData.name,
        subserviceId: subserviceId,
        contactId: contactInfo.id,
        relationships: {
          subservice: 'ms_subservice_icesc_suggestion_1',
          contact: 'contacts_icesc_suggestion_1',
          account: 'accounts_icesc_suggestion_1'
        }
      }
    });
  } catch (error) {
    console.error('Test submit error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



