import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Comprehensive Relationship Test ===');
    
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);
    
    // Test 1: Create a record in icesc_suggestion with direct ID field setting
    console.log('=== TEST 1: Direct ID Field Setting ===');
    const testData1 = {
      session: sessionId,
      module_name: 'icesc_suggestion',
      name_value_list: [
        { name: 'name', value: 'Test Suggestion Direct' },
        { name: 'description', value: 'Testing direct ID field setting' },
        { name: 'contact_name', value: 'Test Contact' },
        { name: 'contact_email', value: 'test@example.com' },
        { name: 'contact_phone', value: '123456789' },
        { name: 'contact_role', value: 'Test Role' },
        { name: 'rationale_impact', value: 'Test rationale' },
        { name: 'target_beneficiaries', value: 'GeneralPublic' },
        { name: 'budget_icesco', value: 1000 },
        { name: 'budget_sponsorship', value: 500 },
        { name: 'project_frequency', value: 'Onetime' },
        { name: 'modality', value: 'Hybrid' },
        { name: 'geographic_scope', value: 'International' },
        { name: 'project_type', value: 'Other' },
        // Try setting relationship ID fields directly
        { name: 'ms_subservice_icesc_suggestion_1ms_subservice_ida', value: 'ms_subservice_icesc_project_suggestions_1' },
        { name: 'contacts_icesc_suggestion_1contacts_ida', value: '30b63613-1e46-c183-7e0c-68bdff000a8a' },
        { name: 'accounts_icesc_suggestion_1accounts_ida', value: 'default' }
      ]
    };
    
    const response1 = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'set_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(testData1),
      }),
    });
    
    const result1 = await response1.json();
    console.log('Test 1 result:', result1);
    
    let test1RecordId = null;
    if (result1.id && result1.id !== '-1') {
      test1RecordId = result1.id;
      console.log('Test 1 record created with ID:', test1RecordId);
    }
    
    // Test 2: Create a record without relationship fields, then use set_relationship
    console.log('=== TEST 2: set_relationship Method ===');
    const testData2 = {
      session: sessionId,
      module_name: 'icesc_suggestion',
      name_value_list: [
        { name: 'name', value: 'Test Suggestion Relationship' },
        { name: 'description', value: 'Testing set_relationship method' },
        { name: 'contact_name', value: 'Test Contact 2' },
        { name: 'contact_email', value: 'test2@example.com' },
        { name: 'contact_phone', value: '123456789' },
        { name: 'contact_role', value: 'Test Role' },
        { name: 'rationale_impact', value: 'Test rationale 2' },
        { name: 'target_beneficiaries', value: 'GeneralPublic' },
        { name: 'budget_icesco', value: 1000 },
        { name: 'budget_sponsorship', value: 500 },
        { name: 'project_frequency', value: 'Onetime' },
        { name: 'modality', value: 'Hybrid' },
        { name: 'geographic_scope', value: 'International' },
        { name: 'project_type', value: 'Other' }
      ]
    };
    
    const response2 = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'set_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(testData2),
      }),
    });
    
    const result2 = await response2.json();
    console.log('Test 2 result:', result2);
    
    let test2RecordId = null;
    if (result2.id && result2.id !== '-1') {
      test2RecordId = result2.id;
      console.log('Test 2 record created with ID:', test2RecordId);
      
      // Now try set_relationship for subservice
      console.log('=== TEST 2a: Setting Subservice Relationship ===');
      const subserviceRelationshipData = {
        session: sessionId,
        module_name: 'icesc_suggestion',
        module_id: test2RecordId,
        link_field_name: 'ms_subservice_icesc_suggestion_1',
        related_ids: ['ms_subservice_icesc_project_suggestions_1']
      };
      
      const subserviceResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'set_relationship',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(subserviceRelationshipData),
        }),
      });
      
      const subserviceResult = await subserviceResponse.json();
      console.log('Subservice relationship result:', subserviceResult);
      
      // Try set_relationship for contact
      console.log('=== TEST 2b: Setting Contact Relationship ===');
      const contactRelationshipData = {
        session: sessionId,
        module_name: 'icesc_suggestion',
        module_id: test2RecordId,
        link_field_name: 'contacts_icesc_suggestion_1',
        related_ids: ['30b63613-1e46-c183-7e0c-68bdff000a8a']
      };
      
      const contactResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'set_relationship',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(contactRelationshipData),
        }),
      });
      
      const contactResult = await contactResponse.json();
      console.log('Contact relationship result:', contactResult);
    }
    
    // Test 3: Check both records to see which method worked
    console.log('=== TEST 3: Verification ===');
    const verificationResults = [];
    
    if (test1RecordId) {
      const verify1Response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_entry',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({
            session: sessionId,
            module_name: 'icesc_suggestion',
            id: test1RecordId,
            select_fields: [
              'id',
              'name',
              'ms_subservice_icesc_suggestion_1_name',
              'contacts_icesc_suggestion_1_name',
              'accounts_icesc_suggestion_1_name'
            ]
          }),
        }),
      });
      
      const verify1Result = await verify1Response.json();
      verificationResults.push({
        method: 'Direct ID Field Setting',
        recordId: test1RecordId,
        result: verify1Result
      });
    }
    
    if (test2RecordId) {
      const verify2Response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_entry',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({
            session: sessionId,
            module_name: 'icesc_suggestion',
            id: test2RecordId,
            select_fields: [
              'id',
              'name',
              'ms_subservice_icesc_suggestion_1_name',
              'contacts_icesc_suggestion_1_name',
              'accounts_icesc_suggestion_1_name'
            ]
          }),
        }),
      });
      
      const verify2Result = await verify2Response.json();
      verificationResults.push({
        method: 'set_relationship Method',
        recordId: test2RecordId,
        result: verify2Result
      });
    }
    
    return NextResponse.json({
      success: true,
      test1: result1,
      test2: result2,
      verificationResults: verificationResults,
      message: 'Comprehensive relationship test completed'
    });
    
  } catch (error) {
    console.error('Relationship debug test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to run relationship debug test'
    }, { status: 500 });
  }
}



