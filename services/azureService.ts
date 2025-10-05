import { 
  BlobServiceClient, 
  BlockBlobClient, 
  BlobUploadCommonResponse,
  BlobDeleteResponse,
  BlobProperties
} from '@azure/storage-blob';

// Azure Storage configuration - using NEXT_PUBLIC_ prefix for client-side access
const AZURE_STORAGE_ACCOUNT = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT;
const AZURE_STORAGE_CONTAINER = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONTAINER;
const AZURE_STORAGE_SAS_TOKEN = process.env.NEXT_PUBLIC_AZURE_STORAGE_SAS_TOKEN;

if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_CONTAINER || !AZURE_STORAGE_SAS_TOKEN) {
    throw new Error('Azure Storage configuration missing. Please set NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT, NEXT_PUBLIC_AZURE_STORAGE_CONTAINER, and NEXT_PUBLIC_AZURE_STORAGE_SAS_TOKEN in your environment variables.');
  }

// Create BlobServiceClient
const blobServiceClient = new BlobServiceClient(
    `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net?${AZURE_STORAGE_SAS_TOKEN}`
  );

const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);

export interface AzureUploadResult {
  fileName: string;
  downloadURL: string;
  fullPath: string;
  originalName: string;
  size: number;
  contentType: string;
  etag?: string;
  lastModified?: Date;
}

export interface AzureUploadOptions {
  folder?: string;
  fileName?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a file to Azure Blob Storage
 */
export async function uploadToAzure(
  file: File | Buffer,
  options: AzureUploadOptions = {}
): Promise<AzureUploadResult> {
  try {
    console.log('☁️ Starting Azure upload...', {
      fileName: file instanceof File ? file.name : 'Buffer',
      fileSize: file instanceof File ? file.size : file.length,
      options
    });

    // Convert File to Buffer if needed
    let buffer: Uint8Array;
    let originalName: string;
    let contentType: string;
    
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
      originalName = file.name;
      contentType = file.type;
    } else {
      buffer = new Uint8Array(file);
      originalName = options.fileName || 'uploaded_file';
      contentType = 'application/octet-stream';
    }

    // Generate a unique file path
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = options.folder || 'hive-documents';
    const fileName = options.fileName || `${timestamp}_${sanitizedName}`;
    const fullPath = `${folder}/${fileName}`;

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(fullPath);

    // Prepare metadata
    const blobMetadata = {
      originalName: originalName,
      uploadedAt: new Date().toISOString(),
      ...options.metadata
    };

    // Upload the file
    const uploadResponse: BlobUploadCommonResponse = await blockBlobClient.upload(
      buffer,
      buffer.length,
      {
        blobHTTPHeaders: {
          blobContentType: contentType
        },
        metadata: blobMetadata
      }
    );

    // Get the download URL (using SAS token for authenticated access)
    const downloadURL = blockBlobClient.url;

    console.log('✅ Azure upload successful:', {
      fileName: fileName,
      fullPath: fullPath,
      downloadURL: downloadURL,
      size: buffer.length,
      etag: uploadResponse.etag
    });

    return {
      fileName: fileName,
      downloadURL: downloadURL,
      fullPath: fullPath,
      originalName: originalName,
      size: buffer.length,
      contentType: contentType,
      etag: uploadResponse.etag,
      lastModified: uploadResponse.lastModified
    };

  } catch (error) {
    console.error('❌ Azure upload failed:', error);
    throw new Error(`Azure upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from Azure Blob Storage
 */
export async function deleteFromAzure(fullPath: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting from Azure:', fullPath);
    
    const blockBlobClient = containerClient.getBlockBlobClient(fullPath);
    const deleteResponse: BlobDeleteResponse = await blockBlobClient.delete();
    
    console.log('✅ Successfully deleted from Azure:', fullPath);
    return true;
  } catch (error) {
    console.error('❌ Azure deletion failed:', error);
    return false;
  }
}

/**
 * Get file information from Azure Blob Storage
 */
export async function getAzureFileInfo(fullPath: string) {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(fullPath);
    const properties = await blockBlobClient.getProperties();
    
    return {
      name: fullPath.split('/').pop() || fullPath,
      fullPath: fullPath,
      size: properties.contentLength,
      contentType: properties.contentType,
      timeCreated: properties.createdOn,
      lastModified: properties.lastModified || new Date(),
      etag: properties.etag,
      metadata: properties.metadata || {}
    };
  } catch (error) {
    console.error('❌ Failed to get Azure file info:', error);
    throw error;
  }
}

/**
 * Generate a download URL for a file
 */
export async function getAzureDownloadURL(fullPath: string): Promise<string> {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(fullPath);
    return blockBlobClient.url;
  } catch (error) {
    console.error('❌ Failed to get Azure download URL:', error);
    throw error;
  }
}

/**
 * List files in a specific folder
 */
export async function listAzureFiles(folder?: string): Promise<any[]> {
  try {
    const files: any[] = [];
    
    for await (const blob of containerClient.listBlobsFlat({
      prefix: folder
    })) {
      files.push({
        name: blob.name,
        size: blob.properties.contentLength,
        contentType: blob.properties.contentType,
        lastModified: blob.properties.lastModified,
        url: `${containerClient.url}/${blob.name}`
      });
    }
    
    return files;
  } catch (error) {
    console.error('❌ Failed to list Azure files:', error);
    throw error;
  }
}

/**
 * Extract file path from Azure blob URL
 */
export function extractPathFromAzureURL(url: string): string | null {
  try {
    // Azure blob URLs have the pattern:
    // https://account.blob.core.windows.net/container/path/to/file?sas_token
    const match = url.match(/\/[^\/]+\/(.+?)(?:\?.*)?$/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to extract path from Azure URL:', error);
    return null;
  }
}

/**
 * Check if a URL is an Azure blob URL
 */
export function isAzureUrl(url: string): boolean {
  return url.includes('.blob.core.windows.net/');
}

export default containerClient;
