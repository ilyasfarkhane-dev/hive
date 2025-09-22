// Utility functions for local storage and file handling

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  project_brief: string;
  problem_statement: string;
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
export const handleFileUpload = async (file: File): Promise<string> => {
  try {
    console.log('Attempting to upload file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      isFile: file instanceof File,
      constructor: file.constructor.name,
      hasName: 'name' in file,
      hasSize: 'size' in file,
      hasType: 'type' in file
    });
    
    // Validate that this is actually a File object
    if (!(file instanceof File)) {
      console.error('Invalid file object provided:', file);
      throw new Error('Invalid file object - not a File instance');
    }
    
    // Validate file properties
    if (!file.name || file.size === undefined || file.size === 0) {
      console.error('File has invalid properties:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      throw new Error('File has invalid properties');
    }
    
    // Try to upload to server first
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Upload successful:', result);
      return result.url;
    } else {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Server upload failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.warn('Server upload failed, falling back to localStorage:', error);
    
    // Fallback to localStorage if server upload fails
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        // Generate a unique filename with proper extension handling
        const timestamp = Date.now();
        const fileName = file.name || 'unknown_file';
        const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
        const filename = `project_${timestamp}.${extension}`;
        
        // Store file data in localStorage
        const fileData = {
          filename,
          dataUrl,
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        
        // Store file data in localStorage
        const existingFiles = JSON.parse(localStorage.getItem('uploaded_files') || '[]');
        existingFiles.push(fileData);
        localStorage.setItem('uploaded_files', JSON.stringify(existingFiles));
        
        // Return the filename as the URL
        resolve(`/uploads/${filename}`);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
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
