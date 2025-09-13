"use client";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectSubmission } from '@/hooks/useProjectSubmission';
import { useAuth } from '@/context/AuthContext';

const ProjectSubmissionTest: React.FC = () => {
  const { t } = useTranslation('common');
  const { sessionId } = useAuth();
  const { submitProject, isSubmitting, submissionResult } = useProjectSubmission();
  const [testData, setTestData] = useState({
    name: 'Test Project',
    description: 'This is a test project for session tracking',
    project_brief: 'Brief description of the test project',
    problem_statement: 'Problem being addressed',
    rationale_impact: 'Rationale and impact of the project',
    strategic_goal: '2',
    strategic_goal_id: '1915ff7b-ece8-11f5-63bd-68be9e0244bc',
    pillar: '2.1',
    pillar_id: '90b5601b-2267-df3c-9abb-68be9fe67ef2',
    service: '2.1.1',
    service_id: '4d86dd66-054e-bf42-1ccc-68bea192ffe6',
    sub_service: '2.1.1.1',
    sub_service_id: '526a9796-eed1-0a86-9c5d-68bea5a9fcea',
    beneficiaries: ['Teachers', 'Students'],
    other_beneficiaries: '',
    budget_icesco: 10000,
    budget_member_state: 5000,
    budget_sponsorship: 2000,
    start_date: '2025-09-03',
    end_date: '2025-09-10',
    frequency: 'One-time',
    frequency_duration: '',
    partners: ['Organization A', 'Organization B'],
    institutions: [],
    delivery_modality: 'Physical',
    geographic_scope: 'National',
    convening_method: 'In-person',
    project_type: 'Workshop',
    project_type_other: '',
    milestones: ['Project Kickoff', 'Mid-term Review', 'Final Presentation'],
    expected_outputs: ['Trained teachers', 'Improved teaching methods'],
    kpis: ['100 participants trained', '90% satisfaction rate'],
    contact_name: 'John Doe',
    contact_email: 'john@example.com',
    contact_phone: '+1234567890',
    contact_role: 'Project Manager',
    comments: 'Test project for session tracking',
    supporting_documents: []
  });

  const handleSubmit = async () => {
    console.log('=== STARTING PROJECT SUBMISSION TEST ===');
    console.log('Session ID:', sessionId);
    console.log('Test Data:', testData);
    console.log('========================================');
    
    const result = await submitProject(testData);
    
    if (result.success) {
      console.log('✅ Project submitted successfully!');
      console.log('Project ID:', result.projectId);
    } else {
      console.error('❌ Project submission failed:', result.error);
    }
  };

  if (!sessionId) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Active Session</h3>
        <p className="text-yellow-700">Please log in to test project submission.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Submission Test</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Session Information</h3>
        <p className="text-sm text-blue-700">Session ID: {sessionId}</p>
        <p className="text-sm text-blue-700">This test will submit a project and automatically log all your projects.</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Project Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={testData.name}
              onChange={(e) => setTestData({ ...testData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input
              type="text"
              value={testData.contact_name}
              onChange={(e) => setTestData({ ...testData, contact_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={testData.contact_email}
              onChange={(e) => setTestData({ ...testData, contact_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ICESCO Budget</label>
            <input
              type="number"
              value={testData.budget_icesco}
              onChange={(e) => setTestData({ ...testData, budget_icesco: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Test Project'}
        </button>
      </div>

      {submissionResult && (
        <div className={`p-4 rounded-lg ${
          submissionResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            submissionResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {submissionResult.success ? t('success') : t('error')}
          </h3>
          <p className={`text-sm ${
            submissionResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {submissionResult.success ? submissionResult.message : submissionResult.error}
          </p>
          {submissionResult.success && submissionResult.projectId && (
            <p className="text-sm text-green-700 mt-2">
              {t('projectId')} {submissionResult.projectId}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructions</h3>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>Click "Submit Test Project" to submit a test project</li>
          <li>Check the browser console (F12 → Console) to see the logging</li>
          <li>You should see detailed logs including all your projects</li>
          <li>The system will automatically log all projects after successful submission</li>
        </ol>
      </div>
    </div>
  );
};

export default ProjectSubmissionTest;


