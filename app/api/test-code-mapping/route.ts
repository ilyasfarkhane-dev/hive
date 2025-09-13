import { NextRequest, NextResponse } from 'next/server';
import { getSubServiceCodeFromProject, getSubServiceCodeFromId, getGoalCodeFromSubserviceId, getPillarCodeFromSubserviceId, getServiceCodeFromSubserviceId } from '@/utils/codeMapping';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Test Code Mapping ===');
    
    // Test the manual mapping
    const projectEe = {
      id: '8aee0b61-cf2d-ff6b-72de-68c47f67270b',
      name: 'ee',
      subservice_id: '',
      subservice_name: ''
    };
    
    const projectAa = {
      id: '1d01e13e-a705-62d0-e69c-68c47dbf1119',
      name: 'aa',
      subservice_id: '',
      subservice_name: ''
    };
    
    console.log('Testing project "ee":');
    const subserviceCodeEe = getSubServiceCodeFromProject(projectEe);
    console.log('Subservice code for ee:', subserviceCodeEe);
    
    if (subserviceCodeEe) {
      const goalCodeEe = getGoalCodeFromSubserviceId(subserviceCodeEe);
      const pillarCodeEe = getPillarCodeFromSubserviceId(subserviceCodeEe);
      const serviceCodeEe = getServiceCodeFromSubserviceId(subserviceCodeEe);
      
      console.log('Hierarchy for ee:', {
        subservice: subserviceCodeEe,
        service: serviceCodeEe,
        pillar: pillarCodeEe,
        goal: goalCodeEe
      });
    }
    
    console.log('Testing project "aa":');
    const subserviceCodeAa = getSubServiceCodeFromProject(projectAa);
    console.log('Subservice code for aa:', subserviceCodeAa);
    
    if (subserviceCodeAa) {
      const goalCodeAa = getGoalCodeFromSubserviceId(subserviceCodeAa);
      const pillarCodeAa = getPillarCodeFromSubserviceId(subserviceCodeAa);
      const serviceCodeAa = getServiceCodeFromSubserviceId(subserviceCodeAa);
      
      console.log('Hierarchy for aa:', {
        subservice: subserviceCodeAa,
        service: serviceCodeAa,
        pillar: pillarCodeAa,
        goal: goalCodeAa
      });
    }
    
    // Test direct subservice ID lookup
    console.log('Testing direct subservice ID lookup:');
    const directCodeEe = getSubServiceCodeFromId('526a9796-eed1-0a86-9c5d-68bea5a9fcea');
    const directCodeAa = getSubServiceCodeFromId('bee3c484-5c84-5b05-7768-68bea51dbac4');
    console.log('Direct lookup ee:', directCodeEe);
    console.log('Direct lookup aa:', directCodeAa);
    
    return NextResponse.json({
      success: true,
      projectEe: {
        subserviceCode: subserviceCodeEe,
        goalCode: subserviceCodeEe ? getGoalCodeFromSubserviceId(subserviceCodeEe) : null,
        pillarCode: subserviceCodeEe ? getPillarCodeFromSubserviceId(subserviceCodeEe) : null,
        serviceCode: subserviceCodeEe ? getServiceCodeFromSubserviceId(subserviceCodeEe) : null
      },
      projectAa: {
        subserviceCode: subserviceCodeAa,
        goalCode: subserviceCodeAa ? getGoalCodeFromSubserviceId(subserviceCodeAa) : null,
        pillarCode: subserviceCodeAa ? getPillarCodeFromSubserviceId(subserviceCodeAa) : null,
        serviceCode: subserviceCodeAa ? getServiceCodeFromSubserviceId(subserviceCodeAa) : null
      },
      directLookup: {
        ee: directCodeEe,
        aa: directCodeAa
      }
    });
    
  } catch (error) {
    console.error('Test code mapping error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


