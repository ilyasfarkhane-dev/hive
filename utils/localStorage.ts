// Utility functions for local storage and file handling

import { isCloudinaryUrl, getDownloadUrl } from './fileUtils';

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  project_brief: string;
  problem_statement1_c: string;
  rationale_impact: string;
  strategic_goal: string;
  strategic_goal_id: string;
  pillar: string;
  pillar_id: string;
  service: string;
  service_id: string;
  sub_service: string;
  sub_service_id: string;
  beneficiaries: string[];
  other_beneficiaries: string;
  budget_icesco: number;
  budget_member_state: number;
  budget_sponsorship: number;
  start_date: string;
  end_date: string;
  frequency: string;
  frequency_duration: string;
  partners: string[];
  institutions: string[];
  delivery_modality: string;
  geographic_scope: string;
  convening_method: string;
  project_type: string;
  project_type_other: string;
  milestones: string[];
  expected_outputs: string;
  kpis: string[];
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  comments: string;
  supporting_documents: string[]; // URLs to uploaded files
  created_at: string;
  updated_at: string;
}

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Save project to localStorage
export const saveProjectToLocal = (projectData: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): string => {
  const id = generateId();
  const now = new Date().toISOString();
  
  const project: ProjectData = {
    ...projectData,
    id,
    created_at: now,
    updated_at: now
  };

  // Get existing projects
  const existingProjects = getProjectsFromLocal();
  
  // Add new project
  const updatedProjects = [...existingProjects, project];
  
  // Save to localStorage
  localStorage.setItem('project_suggestions', JSON.stringify(updatedProjects));
  
  return id;
};

// Helper function to clean beneficiary strings
const cleanBeneficiaryString = (str: string) => {
  return str
    .replace(/[\^]/g, '') // Remove caret symbols
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Helper function to clean project data
const cleanProjectData = (project: ProjectData): ProjectData => {
  return {
    ...project,
    beneficiaries: project.beneficiaries?.map(cleanBeneficiaryString) || [],
    other_beneficiaries: project.other_beneficiaries ? cleanBeneficiaryString(project.other_beneficiaries) : '',
    partners: project.partners?.map(cleanBeneficiaryString) || [],
    institutions: project.institutions?.map(cleanBeneficiaryString) || [],
    milestones: project.milestones?.map(cleanBeneficiaryString) || [],
    expected_outputs: project.expected_outputs ? cleanBeneficiaryString(project.expected_outputs) : '',
    kpis: project.kpis?.map(cleanBeneficiaryString) || [],
  };
};

// Get all projects from localStorage
export const getProjectsFromLocal = (): ProjectData[] => {
  try {
    const projects = localStorage.getItem('project_suggestions');
    const parsedProjects = projects ? JSON.parse(projects) : [];
    // Clean all project data to remove unwanted characters
    return parsedProjects.map(cleanProjectData);
  } catch (error) {
    console.error('Error loading projects from localStorage:', error);
    return [];
  }
};

// Get project by ID
export const getProjectById = (id: string): ProjectData | null => {
  const projects = getProjectsFromLocal();
  return projects.find(project => project.id === id) || null;
};

// Update project in localStorage
export const updateProjectInLocal = (updatedProject: ProjectData): boolean => {
  try {
    const projects = getProjectsFromLocal();
    const projectIndex = projects.findIndex(project => project.id === updatedProject.id);
    
    if (projectIndex === -1) return false;
    
    projects[projectIndex] = {
      ...updatedProject,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('project_suggestions', JSON.stringify(projects));
    return true;
  } catch (error) {
    console.error('Error updating project in localStorage:', error);
    return false;
  }
};

// Delete project from localStorage
export const deleteProjectFromLocal = (id: string): boolean => {
  try {
    const projects = getProjectsFromLocal();
    const filteredProjects = projects.filter(project => project.id !== id);
    localStorage.setItem('project_suggestions', JSON.stringify(filteredProjects));
    return true;
  } catch (error) {
    console.error('Error deleting project from localStorage:', error);
    return false;
  }
};

// Handle file upload (save to uploads folder)
export const handleFileUpload = async (file: File | any): Promise<string> => {
  try {
    console.log('Attempting to upload file:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      isFile: file instanceof File,
      constructor: file?.constructor?.name,
      hasName: 'name' in file,
      hasSize: 'size' in file,
      hasType: 'type' in file,
      hasFilePath: 'filePath' in file
    });
    
    // Get user email from localStorage
    let userEmail = 'unknown';
    try {
      const contactInfo = localStorage.getItem('contactInfo');
      console.log('=== DEBUG: Getting user email for file upload ===');
      console.log('contactInfo raw:', contactInfo);
      
      if (contactInfo) {
        const contact = JSON.parse(contactInfo);
        console.log('contactInfo parsed:', contact);
        console.log('contact.email:', contact.email);
        
        userEmail = contact.email || 'unknown';
      } else {
        console.warn('❌ No contactInfo found in localStorage');
        console.log('Available localStorage keys:', Object.keys(localStorage));
      }
      
      console.log('✅ Final userEmail for file upload:', userEmail);
      console.log('===============================================');
    } catch (e) {
      console.error('❌ Error getting user email from localStorage:', e);
      console.log('Available localStorage keys:', Object.keys(localStorage));
    }
    
    // If file already has a filePath, it was already uploaded
    if (file && typeof file === 'object' && file.filePath) {
      console.log('⚠️ File already uploaded, returning existing path:', file.filePath);
      console.log('File object:', file);
      console.log('To upload a new file with email prefix, please select a fresh file or clear project data');
      return file.filePath;
    }
    
    // Validate file properties
    if (!file || !file.name || file.size === undefined) {
      console.error('File has invalid properties:', file);
      throw new Error('File has invalid properties');
    }
    
    // Try to upload to server first
    const formData = new FormData();
    
    // Handle File objects
    if (file instanceof File) {
      formData.append('files', file);
    } else {
      // Handle plain objects - skip upload as they can't be converted to File
      console.warn('File is not a File instance, cannot upload to server. Will use localStorage fallback.');
      throw new Error('Not a File instance - using localStorage fallback');
    }
    
    formData.append('userEmail', userEmail);
    
    const response = await fetch('/api/upload-documents', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Upload successful:', result);
      
      // Return the first file path
      if (result.files && result.files.length > 0) {
        return result.files[0].filePath;
      }
      
      return result.url || result.filePath;
    } else {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Server upload failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.warn('Server upload failed, falling back to localStorage:', error);
    
    // Fallback to localStorage if server upload fails
    return new Promise((resolve, reject) => {
      // Get user email
      let userEmail = 'unknown';
      try {
        const contactInfo = localStorage.getItem('contactInfo');
        console.log('=== DEBUG: Getting user email for localStorage fallback ===');
        console.log('contactInfo raw:', contactInfo);
        
        if (contactInfo) {
          const contact = JSON.parse(contactInfo);
          console.log('contactInfo parsed:', contact);
          userEmail = contact.email || 'unknown';
        } else {
          console.warn('❌ No contactInfo in localStorage (fallback)');
        }
        
        console.log('✅ Final userEmail (fallback):', userEmail);
      } catch (e) {
        console.error('❌ Error getting user email (fallback):', e);
      }
      
      const timestamp = Date.now();
      const fileName = file.name || file.originalName || 'unknown_file';
      const filename = `${userEmail}_${timestamp}_${fileName}`;
      
      // If file is already a plain object with data, use it directly
      if (!(file instanceof File) && !(file instanceof Blob) && (file.dataUrl || file.data)) {
        // Store file data in localStorage
        const fileData = {
          filename,
          dataUrl: file.dataUrl || file.data,
          originalName: fileName,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        
        const existingFiles = JSON.parse(localStorage.getItem('uploaded_files') || '[]');
        existingFiles.push(fileData);
        localStorage.setItem('uploaded_files', JSON.stringify(existingFiles));
        
        resolve(`/uploads/${filename}`);
        return;
      }
      
      // Read file as data URL for localStorage
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        // Store file data in localStorage
        const fileData = {
          filename,
          dataUrl,
          originalName: fileName,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        
        const existingFiles = JSON.parse(localStorage.getItem('uploaded_files') || '[]');
        existingFiles.push(fileData);
        localStorage.setItem('uploaded_files', JSON.stringify(existingFiles));
        
        resolve(`/uploads/${filename}`);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // Only try to read if it's a Blob or File
      if (file instanceof Blob || file instanceof File) {
        reader.readAsDataURL(file);
      } else {
        reject(new Error('Cannot read file - not a Blob or File instance and has no dataUrl'));
      }
    });
  }
};

/**
 * Gets the appropriate download URL for a document
 * Handles both Cloudinary URLs and local file paths
 */
export const getDocumentDownloadUrl = (filePath: string): string => {
  return getDownloadUrl(filePath);
};

/**
 * Checks if a document is stored in Cloudinary
 */
export const isDocumentInCloudinary = (filePath: string): boolean => {
  return isCloudinaryUrl(filePath);
};

/**
 * Formats document information for display
 */
export const formatDocumentInfo = (doc: any) => {
  const isCloudinary = isCloudinaryUrl(doc.filePath || doc.url || '');
  const cloudinaryUrl = doc.filePath || doc.url || doc.cloudinaryUrl || '';
  
  return {
    name: doc.originalName || doc.fileName || doc.name || 'Unknown Document',
    url: cloudinaryUrl,
    signedUrl: doc.signedUrl || '',
    downloadUrl: doc.signedUrl || getDocumentDownloadUrl(cloudinaryUrl),
    size: doc.size || 0,
    type: doc.type || 'application/octet-stream',
    isCloudinary,
    isLocalFallback: doc.isLocalFallback || false,
    hasSignedUrl: !!(doc.signedUrl)
  };
};

// Handle multiple file uploads
export const handleMultipleFileUploads = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => handleFileUpload(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

// Upload files with project ID (after project submission)
export const uploadProjectFiles = async (files: any[], projectId: string): Promise<string[]> => {
  try {
    console.log('🚀 UPLOAD PROJECT FILES FUNCTION CALLED');
    console.log('=== UPLOADING PROJECT FILES ===');
    console.log('Project ID:', projectId);
    console.log('Files count:', files.length);
    console.log('Files array:', files);
    console.log('Files type:', typeof files);
    console.log('Is array:', Array.isArray(files));
    
    // Get user email from localStorage (for logging purposes)
    let userEmail = 'unknown';
    try {
      const contactInfo = localStorage.getItem('contactInfo');
      if (contactInfo) {
        const contact = JSON.parse(contactInfo);
        userEmail = contact.email || 'unknown';
      }
    } catch (e) {
      console.warn('Could not get contact info from localStorage:', e);
    }
    
    // Debug: Log the structure of files array
    console.log('=== DEBUG: Files array structure ===');
    console.log('Total files:', files.length);
    files.forEach((file, index) => {
      console.log(`File ${index}:`, {
        hasFile: 'file' in file,
        hasFileObject: 'fileObject' in file,
        isFileInstance: file.file instanceof File,
        isFileObjectInstance: file.fileObject instanceof File,
        fileType: typeof file.file,
        fileObjectType: typeof file.fileObject,
        name: file.name,
        size: file.size,
        fileObjectConstructor: file.fileObject?.constructor?.name
      });
    });
    
    // Check if files are direct File objects or have fileObject property
    const fileObjects = [];
    
    console.log('=== PROCESSING FILES FOR UPLOAD ===');
    console.log('Total files to process:', files.length);
    
    // Process files asynchronously
    const fileProcessingPromises = files.map(async (fileItem, index) => {
      console.log(`\n--- Processing file ${index} ---`);
      console.log('File item:', fileItem);
      console.log('File item type:', typeof fileItem);
      console.log('File item keys:', Object.keys(fileItem || {}));
      
      let fileToUpload = null;
      
      // Check if it's a direct File object
      if (fileItem instanceof File) {
        fileToUpload = fileItem;
        console.log('✅ Direct File object found');
      }
      // Check if it has a fileObject property that's a File object
      else if (fileItem.fileObject && fileItem.fileObject instanceof File) {
        fileToUpload = fileItem.fileObject;
        console.log('✅ fileObject File instance found');
      }
      // Check if it has a nested file property that's a File object (legacy support)
      else if (fileItem.file && fileItem.file instanceof File) {
        fileToUpload = fileItem.file;
        console.log('✅ Nested file File object found (legacy)');
      }
      // Check if fileObject is empty but we have an id - this means the File object was lost
      else if (fileItem.id && fileItem.fileObject && Object.keys(fileItem.fileObject).length === 0) {
        console.log('⚠️ fileObject is empty but file has ID - File object was lost during serialization');
        console.log('File ID:', fileItem.id);
        console.log('File metadata:', {
          name: fileItem.name,
          size: fileItem.size,
          type: fileItem.type,
          lastModified: fileItem.lastModified
        });
        console.log('This file cannot be uploaded - File object was lost during state management');
        // Skip this file as we can't reconstruct the File object
        return null;
      }
      // If it has File-like properties, try to use it
      else if (fileItem.fileObject && fileItem.fileObject.name && fileItem.fileObject.size !== undefined) {
        // Simple fallback: if it has name and size, use it as a File
        console.log('⚠️ fileObject missing File methods, but has name and size - using as File');
        fileToUpload = fileItem.fileObject;
        console.log('✅ Using fileObject as File (fallback for serialized File)');
      }
      else {
        console.log('⚠️ No valid File object found in file item:', fileItem);
        console.log('Available properties:', Object.keys(fileItem));
      }
      
      if (fileToUpload) {
        console.log('✅ File added to upload queue:', fileToUpload.name);
        console.log('File size:', fileToUpload.size);
        console.log('File type:', fileToUpload.type);
        return fileToUpload;
      }
      console.log('❌ File will be skipped - no valid File object');
      return null;
    });
    
    // Wait for all file processing to complete
    const processedFiles = await Promise.all(fileProcessingPromises);
    fileObjects.push(...processedFiles.filter(file => file !== null));
    
    if (fileObjects.length === 0) {
      console.log('❌ No valid File objects found to upload');
      console.log('Files structure:', files);
      return [];
    }
    
    console.log('✅ File objects to upload:', fileObjects.length);
    
    if (fileObjects.length === 0) {
      console.log('❌ No valid file objects found to upload');
      return [];
    }
    
    // Create FormData
    const formData = new FormData();
    fileObjects.forEach((file, index) => {
      console.log(`Appending file ${index} to FormData:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        isFile: file instanceof File,
        constructor: file.constructor?.name
      });
      formData.append('files', file);
    });
    formData.append('projectId', projectId);
    formData.append('userEmail', userEmail);
    
    // Upload to new API endpoint
    console.log('🌐 Making API call to /api/upload-project-files');
    console.log('FormData contents:', Array.from(formData.entries()));
    console.log('Project ID being sent:', projectId);
    console.log('User email being sent:', userEmail);
    
    const response = await fetch('/api/upload-project-files', {
      method: 'POST',
      body: formData,
    });
    
    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload API error:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Project files uploaded successfully:', result.files);
      return result.files.map((file: any) => file.filePath);
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading project files:', error);
    throw error;
  }
};
