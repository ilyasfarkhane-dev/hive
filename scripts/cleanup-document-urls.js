/**
 * Cleanup Script: Remove Document URLs from Text Fields
 * 
 * This script cleans up old projects that have document URLs in text fields
 * (description, problem_statement1_c, expected_outputs, comments)
 * 
 * Run with: node scripts/cleanup-document-urls.js
 */

const CRM_BASE_URL = 'https://crm.icesco.org';

// Login credentials
const LOGIN = {
  user_name: process.env.CRM_ADMIN_USER || 'admin',
  password: process.env.CRM_ADMIN_PASS || ''
};

async function login() {
  console.log('🔐 Logging in to CRM...');
  
  const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      method: 'login',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify({
        user_auth: {
          user_name: LOGIN.user_name,
          password: LOGIN.password
        },
        application_name: 'Hive Cleanup Script'
      }),
    }),
  });

  const data = await response.json();
  
  if (!data.id) {
    throw new Error('Failed to login: ' + JSON.stringify(data));
  }
  
  console.log('✅ Logged in successfully');
  return data.id;
}

async function getAllProjects(sessionId) {
  console.log('\n📋 Fetching all projects...');
  
  const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      method: 'get_entry_list',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: 'icesc_project_suggestions',
        query: '',
        select_fields: [
          'id',
          'name',
          'description',
          'problem_statement1_c',
          'expected_outputs',
          'comments'
        ],
        max_results: 1000
      }),
    }),
  });

  const data = await response.json();
  
  if (!data.entry_list) {
    throw new Error('Failed to fetch projects: ' + JSON.stringify(data));
  }
  
  console.log(`✅ Found ${data.entry_list.length} projects`);
  return data.entry_list;
}

function cleanTextField(text) {
  if (!text) return '';
  
  // Remove patterns like "Document URL: https://..."
  let cleaned = text
    .replace(/Document URL:\s*https?:\/\/[^\s\n]+/gi, '')
    .replace(/Full Document URL:\s*https?:\/\/[^\s\n]+/gi, '')
    .replace(/Project document uploaded via Hive platform\s*/gi, '')
    .trim();
  
  // Remove empty lines
  cleaned = cleaned.replace(/\n\n+/g, '\n').trim();
  
  return cleaned;
}

function needsCleaning(project) {
  const getValue = (field) => {
    if (!field) return '';
    return field.value || field;
  };
  
  const description = getValue(project.name_value_list?.description);
  const problemStatement = getValue(project.name_value_list?.problem_statement1_c);
  const expectedOutputs = getValue(project.name_value_list?.expected_outputs);
  const comments = getValue(project.name_value_list?.comments);
  
  return (
    description?.includes('Document URL') ||
    problemStatement?.includes('Document URL') ||
    expectedOutputs?.includes('Document URL') ||
    comments?.includes('Document URL')
  );
}

async function cleanProject(sessionId, project) {
  const getValue = (field) => {
    if (!field) return '';
    return field.value || field;
  };
  
  const projectId = project.id;
  const projectName = getValue(project.name_value_list?.name);
  
  console.log(`\n🧹 Cleaning project: ${projectName} (${projectId})`);
  
  const description = getValue(project.name_value_list?.description);
  const problemStatement = getValue(project.name_value_list?.problem_statement1_c);
  const expectedOutputs = getValue(project.name_value_list?.expected_outputs);
  const comments = getValue(project.name_value_list?.comments);
  
  const cleanedDescription = cleanTextField(description);
  const cleanedProblemStatement = cleanTextField(problemStatement);
  const cleanedExpectedOutputs = cleanTextField(expectedOutputs);
  const cleanedComments = cleanTextField(comments);
  
  // Check what needs to be updated
  const updates = [];
  
  if (description !== cleanedDescription) {
    updates.push({ name: 'description', value: cleanedDescription });
    console.log('  - Cleaning description');
  }
  
  if (problemStatement !== cleanedProblemStatement) {
    updates.push({ name: 'problem_statement1_c', value: cleanedProblemStatement });
    console.log('  - Cleaning problem_statement1_c');
  }
  
  if (expectedOutputs !== cleanedExpectedOutputs) {
    updates.push({ name: 'expected_outputs', value: cleanedExpectedOutputs });
    console.log('  - Cleaning expected_outputs');
  }
  
  if (comments !== cleanedComments) {
    updates.push({ name: 'comments', value: cleanedComments });
    console.log('  - Cleaning comments');
  }
  
  if (updates.length === 0) {
    console.log('  ✅ No cleaning needed');
    return { success: true, updated: false };
  }
  
  // Update the project
  console.log(`  📤 Updating ${updates.length} fields...`);
  
  const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      method: 'set_entry',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: 'icesc_project_suggestions',
        id: projectId,
        name_value_list: updates
      }),
    }),
  });

  const data = await response.json();
  
  if (data.id && data.id !== '-1') {
    console.log('  ✅ Updated successfully');
    return { success: true, updated: true };
  } else {
    console.log('  ❌ Update failed:', data);
    return { success: false, error: data };
  }
}

async function main() {
  try {
    console.log('=== Document URL Cleanup Script ===\n');
    
    // Step 1: Login
    const sessionId = await login();
    
    // Step 2: Get all projects
    const projects = await getAllProjects(sessionId);
    
    // Step 3: Find projects that need cleaning
    const projectsToClean = projects.filter(needsCleaning);
    
    console.log(`\n📊 Summary:`);
    console.log(`Total projects: ${projects.length}`);
    console.log(`Projects needing cleanup: ${projectsToClean.length}`);
    console.log(`Clean projects: ${projects.length - projectsToClean.length}`);
    
    if (projectsToClean.length === 0) {
      console.log('\n✅ All projects are already clean! No action needed.');
      return;
    }
    
    console.log(`\n🚀 Starting cleanup of ${projectsToClean.length} projects...`);
    
    // Step 4: Clean each project
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < projectsToClean.length; i++) {
      const project = projectsToClean[i];
      
      try {
        const result = await cleanProject(sessionId, project);
        
        if (result.success && result.updated) {
          successCount++;
        }
        
        // Add delay to avoid overwhelming CRM
        if (i < projectsToClean.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`  ❌ Error cleaning project:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n=== Cleanup Complete ===`);
    console.log(`✅ Successfully cleaned: ${successCount} projects`);
    console.log(`❌ Failed: ${failCount} projects`);
    console.log(`📊 Total processed: ${projectsToClean.length} projects`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();



