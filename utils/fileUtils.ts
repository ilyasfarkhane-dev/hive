/**
 * Utility functions for file handling
 */

import { extractPathFromAzureURL, isAzureUrl } from '@/services/azureService';

/**
 * Sanitizes a filename by removing or replacing special characters
 * Keeps only alphanumeric characters, underscores, dots, and hyphens
 * 
 * @param filename - The original filename
 * @returns The sanitized filename safe for server storage
 * 
 * @example
 * sanitizeFileName("90_Attestation d'inscription.pdf")
 * // Returns: "90_Attestation_d_inscription.pdf"
 */
export function sanitizeFileName(filename: string): string {
  return filename.replace(/[^a-z0-9_.-]/gi, '_');
}

/**
 * Generates a unique filename with timestamp and sanitized original name
 * 
 * @param originalName - The original filename
 * @returns A unique filename with format: timestamp_sanitized_name
 * 
 * @example
 * generateUniqueFileName("My Document.pdf")
 * // Returns: "1759493863631_My_Document.pdf"
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(originalName);
  return `${timestamp}_${sanitized}`;
}

/**
 * Validates file type based on allowed extensions
 * 
 * @param filename - The filename to validate
 * @param allowedExtensions - Array of allowed file extensions (with dots)
 * @returns True if file type is allowed
 */
export function isValidFileType(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
}

/**
 * Checks if a URL is an Azure Blob Storage URL or path
 * 
 * @param url - The URL or path to check
 * @returns True if the URL is from Azure Blob Storage or is a storage path
 */
export function isAzureStorageUrl(url: string): boolean {
  return isAzureUrl(url) || url.includes('hive-documents/');
}

/**
 * Checks if a URL is a Cloudinary URL or public ID (for backward compatibility)
 * 
 * @param url - The URL or public ID to check
 * @returns True if the URL is from Cloudinary or is a public ID
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.startsWith('https://res.cloudinary.com/') || url.includes('/');
}

/**
 * Gets the appropriate download URL for a file
 * Handles Azure Storage paths, Cloudinary URLs, and local file paths
 * 
 * @param filePath - The file path, Azure Storage path, or Cloudinary URL
 * @returns The download URL
 */
export function getDownloadUrl(filePath: string): string {
  if (isAzureStorageUrl(filePath)) {
    // For Azure Storage paths, use the Azure download API
    return `/api/azure-download?fullPath=${encodeURIComponent(filePath)}`;
  } else if (isCloudinaryUrl(filePath)) {
    // For Cloudinary URLs, use the download API which will generate signed URLs
    return `/api/download-file?path=${encodeURIComponent(filePath)}`;
  } else {
    // For local files, use the download API
    return `/api/download-file?path=${encodeURIComponent(filePath)}`;
  }
}

/**
 * Extracts filename from a file path, Azure Storage path, Cloudinary URL, or public ID
 * 
 * @param filePath - The file path, Azure Storage path, Cloudinary URL, or public ID
 * @returns The filename
 */
export function extractFilename(filePath: string): string {
  if (isAzureStorageUrl(filePath)) {
    // For Azure Storage URLs or paths, extract the filename from the last part
    const parts = filePath.split('/');
    let filename = parts[parts.length - 1];
    
    // Remove any query parameters if it's a full URL
    filename = filename.split('?')[0];
    
    // If it's a path with timestamp prefix, try to clean it up
    // Format: timestamp_filename.ext -> filename.ext
    if (filename.match(/^\d+_.*/)) {
      filename = filename.replace(/^\d+_/, '');
    }
    
    return filename;
  } else if (isCloudinaryUrl(filePath)) {
    // For Cloudinary URLs or public IDs, extract the filename from the last part
    const parts = filePath.split('/');
    let filename = parts[parts.length - 1];
    
    // Remove any version parameters if it's a full URL
    filename = filename.split('?')[0];
    
    // If it's a public ID with timestamp prefix, try to clean it up
    // Format: timestamp_filename.ext -> filename.ext
    if (filename.match(/^\d+_.*/)) {
      filename = filename.replace(/^\d+_/, '');
    }
    
    return filename;
  } else {
    // Extract filename from local path
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }
}

/**
 * Formats file size in human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

