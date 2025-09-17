// Utility to clean existing data in localStorage
// This can be run to fix existing corrupted data

export const cleanExistingProjectData = () => {
  try {
    const projects = localStorage.getItem('project_suggestions');
    if (!projects) return;

    const parsedProjects = JSON.parse(projects);
    let hasChanges = false;

    const cleanedProjects = parsedProjects.map((project: any) => {
      const cleanString = (str: string) => {
        return str
          .replace(/[\^]/g, '') // Remove caret symbols
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      };

      const originalProject = { ...project };
      
      // Clean beneficiaries
      if (project.beneficiaries && Array.isArray(project.beneficiaries)) {
        project.beneficiaries = project.beneficiaries.map(cleanString);
        if (JSON.stringify(project.beneficiaries) !== JSON.stringify(originalProject.beneficiaries)) {
          hasChanges = true;
        }
      }

      // Clean other_beneficiaries
      if (project.other_beneficiaries && typeof project.other_beneficiaries === 'string') {
        const cleaned = cleanString(project.other_beneficiaries);
        if (cleaned !== project.other_beneficiaries) {
          project.other_beneficiaries = cleaned;
          hasChanges = true;
        }
      }

      // Clean partners
      if (project.partners && Array.isArray(project.partners)) {
        project.partners = project.partners.map(cleanString);
        if (JSON.stringify(project.partners) !== JSON.stringify(originalProject.partners)) {
          hasChanges = true;
        }
      }

      // Clean institutions
      if (project.institutions && Array.isArray(project.institutions)) {
        project.institutions = project.institutions.map(cleanString);
        if (JSON.stringify(project.institutions) !== JSON.stringify(originalProject.institutions)) {
          hasChanges = true;
        }
      }

      // Clean milestones
      if (project.milestones && Array.isArray(project.milestones)) {
        project.milestones = project.milestones.map(cleanString);
        if (JSON.stringify(project.milestones) !== JSON.stringify(originalProject.milestones)) {
          hasChanges = true;
        }
      }

      // Clean expected_outputs
      if (project.expected_outputs && Array.isArray(project.expected_outputs)) {
        project.expected_outputs = project.expected_outputs.map(cleanString);
        if (JSON.stringify(project.expected_outputs) !== JSON.stringify(originalProject.expected_outputs)) {
          hasChanges = true;
        }
      }

      // Clean kpis
      if (project.kpis && Array.isArray(project.kpis)) {
        project.kpis = project.kpis.map(cleanString);
        if (JSON.stringify(project.kpis) !== JSON.stringify(originalProject.kpis)) {
          hasChanges = true;
        }
      }

      return project;
    });

    if (hasChanges) {
      localStorage.setItem('project_suggestions', JSON.stringify(cleanedProjects));
      console.log('✅ Cleaned existing project data in localStorage');
      return true;
    } else {
      console.log('ℹ️ No corrupted data found in localStorage');
      return false;
    }
  } catch (error) {
    console.error('❌ Error cleaning project data:', error);
    return false;
  }
};

// Run cleanup on import (optional)
// cleanExistingProjectData();




