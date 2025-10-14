// Only import fs and path on server-side
let fs: any = null;
let path: any = null;
let LOG_DIR: string = '';
let LOG_FILE: string = '';

if (typeof window === 'undefined') {
  // Server-side only imports
  fs = require('fs');
  path = require('path');
  LOG_DIR = path.join(process.cwd(), 'logs');
  LOG_FILE = path.join(LOG_DIR, 'azure-uploads.log');
  
  // Ensure log directory exists
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create log directory:', error);
  }
}

export function logToFile(message: string, data?: any) {
  // Only log on server-side
  if (typeof window !== 'undefined') {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;

  try {
    // Also log to console
    console.log(message, data || '');
    
    // Write to file
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

export function logError(message: string, error: any) {
  const timestamp = new Date().toISOString();
  const errorDetails = error instanceof Error ? {
    ...error,
    message: error.message,
    stack: error.stack,
    name: error.name
  } : error;
  
  const logEntry = `[${timestamp}] ❌ ERROR: ${message}\n${JSON.stringify(errorDetails, null, 2)}\n`;

  try {
    // Also log to console
    console.error(message, error);
    
    // Write to file
    if (typeof window === 'undefined') {
      fs.appendFileSync(LOG_FILE, logEntry);
    }
  } catch (err) {
    console.error('Failed to write error to log file:', err);
  }
}

export function clearLogFile() {
  if (typeof window === 'undefined') {
    try {
      if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
      }
    } catch (error) {
      console.error('Failed to clear log file:', error);
    }
  }
}

