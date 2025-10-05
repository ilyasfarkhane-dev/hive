import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/services/cloudinaryService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    
    console.log('☁️ Cloudinary Download API - Public ID:', publicId);
    
    if (!publicId) {
      console.log('❌ Cloudinary Download API - No public ID provided');
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    try {
      // Get the file resource info
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: 'raw'
      });
      
      console.log('✅ File resource found:', {
        public_id: resource.public_id,
        bytes: resource.bytes,
        format: resource.format,
        created_at: resource.created_at
      });
      
      // Since direct access is blocked, we'll use Cloudinary's API to stream the file
      // This requires using the uploader.upload_large or similar method
      console.log('🔄 Using Cloudinary API to stream file...');
      
      // For now, let's try to generate a signed URL and if that fails, we'll implement a different approach
      const signedUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        type: 'upload',
        sign_url: true,
        secure: true,
      });
      
      console.log('🔐 Generated signed URL:', signedUrl);
      
      // Try the signed URL first
      try {
        const response = await fetch(signedUrl);
        
        if (response.ok) {
          const fileBuffer = await response.arrayBuffer();
          const filename = publicId.split('/').pop() || 'document';
          
          console.log('✅ Signed URL worked, streaming file:', {
            filename,
            size: fileBuffer.byteLength,
            contentType: response.headers.get('content-type')
          });
          
          return new NextResponse(fileBuffer as BodyInit, {
            headers: {
              'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': fileBuffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=3600',
            },
          });
        } else {
          console.log('❌ Signed URL failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('❌ Signed URL error:', error);
      }
      
      // If signed URL fails, return an error with instructions
      return NextResponse.json({
        error: 'File access restricted',
        message: 'This file cannot be accessed due to Cloudinary account restrictions. Please contact the administrator.',
        public_id: publicId,
        signed_url: signedUrl
      }, { status: 403 });
      
    } catch (apiError) {
      console.error('❌ Cloudinary API error:', apiError);
      
      // Fallback: try to use the regular URL
      try {
        const fallbackUrl = cloudinary.url(publicId, {
          resource_type: 'raw',
          secure: true
        });
        
        console.log('🔄 Fallback: trying regular URL:', fallbackUrl);
        
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (fallbackResponse.ok) {
          const fileBuffer = await fallbackResponse.arrayBuffer();
          const filename = publicId.split('/').pop() || 'document';
          
          return new NextResponse(fileBuffer as BodyInit, {
            headers: {
              'Content-Type': fallbackResponse.headers.get('content-type') || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': fileBuffer.byteLength.toString(),
            },
          });
        } else {
          console.error('❌ Fallback also failed:', fallbackResponse.status, fallbackResponse.statusText);
        }
        
      } catch (fallbackError) {
        console.error('❌ Fallback error:', fallbackError);
      }
      
      return NextResponse.json({ error: 'File not found or inaccessible' }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Cloudinary Download API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
