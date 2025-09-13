import { NextRequest, NextResponse } from 'next/server';
import { 
  getSubServiceCodeFromProject, 
  getGoalCodeFromSubserviceId, 
  getPillarCodeFromSubserviceId, 
  getServiceCodeFromSubserviceId 
} from '@/utils/codeMapping';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Test Hierarchy Traversal ===');
    
    // Test with project "ee"
    const projectEe = {
      id: '8aee0b61-cf2d-ff6b-72de-68c47f67270b',
      name: 'ee',
      subservice_id: '',
      subservice_name: ''
    };
    
    // Test with project "aa"
    const projectAa = {
      id: '1d01e13e-a705-62d0-e69c-68c47dbf1119',
      name: 'aa',
      subservice_id: '',
      subservice_name: ''
    };
    
    console.log('Testing project "ee":');
    const subserviceCodeEe = getSubServiceCodeFromProject(projectEe);
    console.log('Subservice code for ee:', subserviceCodeEe);
    
    let hierarchyEe = {};
    if (subserviceCodeEe) {
      const goalCodeEe = getGoalCodeFromSubserviceId(subserviceCodeEe);
      const pillarCodeEe = getPillarCodeFromSubserviceId(subserviceCodeEe);
      const serviceCodeEe = getServiceCodeFromSubserviceId(subserviceCodeEe);
      
      hierarchyEe = {
        subservice: subserviceCodeEe,
        service: serviceCodeEe,
        pillar: pillarCodeEe,
        goal: goalCodeEe
      };
      
      console.log('Hierarchy for ee:', hierarchyEe);
    }
    
    console.log('Testing project "aa":');
    const subserviceCodeAa = getSubServiceCodeFromProject(projectAa);
    console.log('Subservice code for aa:', subserviceCodeAa);
    
    let hierarchyAa = {};
    if (subserviceCodeAa) {
      const goalCodeAa = getGoalCodeFromSubserviceId(subserviceCodeAa);
      const pillarCodeAa = getPillarCodeFromSubserviceId(subserviceCodeAa);
      const serviceCodeAa = getServiceCodeFromSubserviceId(subserviceCodeAa);
      
      hierarchyAa = {
        subservice: subserviceCodeAa,
        service: serviceCodeAa,
        pillar: pillarCodeAa,
        goal: goalCodeAa
      };
      
      console.log('Hierarchy for aa:', hierarchyAa);
    }
    
    return NextResponse.json({
      success: true,
      projectEe: hierarchyEe,
      projectAa: hierarchyAa
    });
    
  } catch (error) {
    console.error('Hierarchy test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}



