/**
 * Utility functions for file handling
 */

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
