import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dqmcvusqd',
  api_key: '891648333495448',
  api_secret: 'QEJlFu5zEvnnUuAbXhq0tdIQwIE',
  secure: true
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  transformation?: any[];
  filename_override?: string; // For preserving original filename with extension
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    console.log('🔄 Starting Cloudinary upload...', {
      fileName: file instanceof File ? file.name : 'Buffer',
      fileSize: file instanceof File ? file.size : file.length,
      options
    });

    // Convert File to Buffer if needed
    let buffer: Buffer;
    let originalName: string;
    
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      originalName = file.name;
    } else {
      buffer = file;
      originalName = options.public_id || 'uploaded_file';
    }

    // Generate a unique public_id that preserves the file extension
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniquePublicId = `${timestamp}_${sanitizedName}`;

    // Set default options
    const uploadOptions = {
      folder: options.folder || 'hive-documents',
      resource_type: options.resource_type || 'raw',
      overwrite: options.overwrite || true,
      public_id: options.public_id || uniquePublicId,
      filename_override: options.filename_override || originalName,
      ...options
    };

    // Upload to Cloudinary using upload_stream for better control
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          ...uploadOptions,
          resource_type: 'raw',
          type: 'upload',
          use_filename: true,
          unique_filename: true,
          overwrite: true
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            console.log('✅ Cloudinary upload successful:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
              bytes: result.bytes
            });
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(new Error('Upload failed - no result returned'));
          }
        }
      ).end(buffer);
    });

    return {
      ...result,
      original_filename: originalName
    };

  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting from Cloudinary:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Successfully deleted from Cloudinary:', publicId);
      return true;
    } else {
      console.warn('⚠️ Failed to delete from Cloudinary:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary deletion failed:', error);
    return false;
  }
}

/**
 * Get file information from Cloudinary
 */
export async function getCloudinaryInfo(publicId: string) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('❌ Failed to get Cloudinary info:', error);
    throw error;
  }
}

/**
 * Generate a secure URL with transformations
 */
export function generateCloudinaryUrl(
  publicId: string, 
  transformations: any = {},
  secure: boolean = true
): string {
  return cloudinary.url(publicId, {
    secure,
    ...transformations
  });
}

/**
 * Generate a signed URL for secure access
 */
export function generateSignedUrl(
  publicId: string,
  transformations: any = {}
): string {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    sign_url: true,
    secure: true,
    ...transformations
  });
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Match pattern: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/filename.ext
    // For raw files: /raw/upload/v1234567890/folder/filename.ext
    // For images: /image/upload/v1234567890/folder/filename.ext
    const match = url.match(/\/upload\/v\d+\/(.+?)(?:\?.*)?$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('❌ Failed to extract public ID:', error);
    return null;
  }
}

export default cloudinary;
