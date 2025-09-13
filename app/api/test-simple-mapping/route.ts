import { NextRequest, NextResponse } from 'next/server';
import { getSubServiceCodeFromId } from '@/utils/codeMapping';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Simple Code Mapping Test ===');
    
    // Test direct subservice ID lookup
    const subserviceIdEe = '526a9796-eed1-0a86-9c5d-68bea5a9fcea';
    const subserviceIdAa = 'bee3c484-5c84-5b05-7768-68bea51dbac4';
    
    console.log('Testing subservice ID lookup:');
    console.log('ID for ee:', subserviceIdEe);
    console.log('ID for aa:', subserviceIdAa);
    
    const codeEe = getSubServiceCodeFromId(subserviceIdEe);
    const codeAa = getSubServiceCodeFromId(subserviceIdAa);
    
    console.log('Code for ee:', codeEe);
    console.log('Code for aa:', codeAa);
    
    return NextResponse.json({
      success: true,
      results: {
        ee: {
          id: subserviceIdEe,
          code: codeEe
        },
        aa: {
          id: subserviceIdAa,
          code: codeAa
        }
      }
    });
    
  } catch (error) {
    console.error('Simple mapping test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}



