import { NextRequest, NextResponse } from 'next/server';
import { serviceSubservicesData } from '@/Data/sub-service/data';
import { pillarServicesData } from '@/Data/services/data';
import { pillarsData } from '@/Data/pillars/data';
import { goals } from '@/Data/goals/data';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Detailed Hierarchy Test ===');
    
    // Test with subservice code "2.1.1.1"
    const subserviceCode = '2.1.1.1';
    console.log('Looking for subservice code:', subserviceCode);
    
    // Find the subservice
    let foundServiceId = null;
    for (const serviceId in serviceSubservicesData) {
      const subServices = (serviceSubservicesData as any)[serviceId];
      const subService = subServices.find((s: any) => s.name === subserviceCode);
      if (subService) {
        foundServiceId = serviceId;
        console.log('Found subservice in service ID:', serviceId);
        break;
      }
    }
    
    if (!foundServiceId) {
      return NextResponse.json({
        success: false,
        error: 'Subservice not found'
      });
    }
    
    // Find the pillar for this service
    let foundPillarId = null;
    for (const pillarId in pillarServicesData) {
      const services = pillarServicesData[pillarId];
      const service = services.find(s => s.id === foundServiceId);
      if (service) {
        foundPillarId = pillarId;
        console.log('Found service in pillar ID:', pillarId);
        console.log('Service code:', service.code);
        break;
      }
    }
    
    if (!foundPillarId) {
      return NextResponse.json({
        success: false,
        error: 'Service not found in any pillar'
      });
    }
    
    // Find the goal for this pillar
    let foundGoalId = null;
    for (const goalId in pillarsData) {
      const pillars = (pillarsData as any)[goalId];
      const pillar = pillars.find((p: any) => p.id === foundPillarId);
      if (pillar) {
        foundGoalId = goalId;
        console.log('Found pillar in goal ID:', goalId);
        console.log('Pillar code:', pillar.code);
        break;
      }
    }
    
    if (!foundGoalId) {
      return NextResponse.json({
        success: false,
        error: 'Pillar not found in any goal'
      });
    }
    
    // Get the goal code
    const goal = goals.find(g => g.id === foundGoalId);
    const goalCode = goal ? goal.code : foundGoalId;
    console.log('Goal code:', goalCode);
    
    return NextResponse.json({
      success: true,
      hierarchy: {
        subservice: subserviceCode,
        service: foundServiceId,
        pillar: foundPillarId,
        goal: foundGoalId,
        codes: {
          subservice: subserviceCode,
          service: (pillarServicesData as any)[foundPillarId]?.find((s: any) => s.id === foundServiceId)?.code,
          pillar: (pillarsData as any)[foundGoalId]?.find((p: any) => p.id === foundPillarId)?.code,
          goal: goalCode
        }
      }
    });
    
  } catch (error) {
    console.error('Detailed hierarchy test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


