import { NextResponse } from 'next/server';

export async function GET() {
  // Return a simple response to prevent 404 error
  // This is requested by Chrome DevTools automatically
  return NextResponse.json({ 
    message: 'Chrome DevTools configuration not available',
    timestamp: new Date().toISOString()
  });
}
