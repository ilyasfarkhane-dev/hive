import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing CRM Connection ===');
    
    // Test 1: Get session ID
    console.log('1. Testing session ID retrieval...');
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);
    
    // Test 2: Test basic module query
    console.log('2. Testing basic module query...');
    const testProjects = await getModuleEntries(
      sessionId,
      "icesc_project_suggestions",
      ["id", "name"],
      "",
      5 // Limit to 5 results
    );
    console.log('Test projects retrieved:', testProjects.length);
    console.log('Sample project:', testProjects[0]);
    
    // Test 3: Test with specific session query
    console.log('3. Testing session-specific query...');
    const sessionQuery = `session_id='jgvipl3anm9pvfgd377pu2547j'`;
    const sessionProjects = await getModuleEntries(
      sessionId,
      "icesc_project_suggestions",
      ["id", "name", "session_id"],
      sessionQuery,
      10
    );
    console.log('Session projects retrieved:', sessionProjects.length);
    console.log('Session projects:', sessionProjects);
    
    return NextResponse.json({
      success: true,
      message: 'CRM connection test completed',
      data: {
        sessionId: sessionId,
        totalProjects: testProjects.length,
        sessionProjects: sessionProjects.length,
        sampleProject: testProjects[0],
        sessionProjectsData: sessionProjects
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('CRM Connection Test Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `CRM connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}


