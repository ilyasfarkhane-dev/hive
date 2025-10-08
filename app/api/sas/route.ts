import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get Azure Storage configuration from server-side environment variables
    const account = process.env.AZURE_STORAGE_ACCOUNT;
    const container = process.env.AZURE_STORAGE_CONTAINER;
    const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;

    console.log('🔐 SAS API - Configuration check:', {
      hasAccount: !!account,
      hasContainer: !!container,
      hasSasToken: !!sasToken,
      accountName: account ? `${account.substring(0, 3)}...` : 'undefined'
    });

    if (!account || !container || !sasToken) {
      console.error('❌ SAS API - Missing Azure Storage configuration');
      return NextResponse.json(
        { 
          error: 'Azure Storage configuration missing',
          missing: {
            account: !account,
            container: !container,
            sasToken: !sasToken
          }
        },
        { status: 500 }
      );
    }

    // Return the SAS configuration (without exposing the full token in logs)
    const response = {
      account,
      container,
      sasToken,
      blobEndpoint: `https://${account}.blob.core.windows.net`,
      containerUrl: `https://${account}.blob.core.windows.net/${container}`
    };

    console.log('✅ SAS API - Configuration provided successfully');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ SAS API error:', error);
    return NextResponse.json(
      { error: 'Failed to get Azure Storage configuration' },
      { status: 500 }
    );
  }
}


