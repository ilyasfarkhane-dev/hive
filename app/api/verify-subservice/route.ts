import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Verifying Subservice ID ===');
    
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);
    
    // Get the subservice we're trying to use
    const subserviceId = 'ms_subservice_icesc_project_suggestions_1';
    
    console.log('Looking for subservice:', subserviceId);
    
    const subserviceDetails = await getModuleEntries(
      sessionId,
      'ms_subservice',
      ['id', 'name', 'description'],
      `id='${subserviceId}'`
    );
    
    console.log('Subservice details:', subserviceDetails);
    
    if (subserviceDetails.length === 0) {
      // Try to get all subservices to see what's available
      console.log('Subservice not found, getting all subservices...');
      const allSubservices = await getModuleEntries(
        sessionId,
        'ms_subservice',
        ['id', 'name', 'description'],
        '',
        10
      );
      
      return NextResponse.json({
        success: false,
        error: 'Subservice not found',
        requestedId: subserviceId,
        availableSubservices: allSubservices,
        message: 'The subservice ID does not exist'
      });
    }
    
    return NextResponse.json({
      success: true,
      subservice: subserviceDetails[0],
      message: 'Subservice found and verified'
    });
    
  } catch (error) {
    console.error('Verify subservice error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to verify subservice'
    }, { status: 500 });
  }
}


