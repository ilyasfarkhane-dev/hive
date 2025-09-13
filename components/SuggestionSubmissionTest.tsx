"use client";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSuggestionSubmission, SuggestionData } from '@/hooks/useSuggestionSubmission';
import { useStoredContact } from '@/hooks/useStoredContact';

const SuggestionSubmissionTest: React.FC = () => {
  const { t } = useTranslation('common');
  const { contactInfo, isAuthenticated } = useStoredContact();
  const { isSubmitting, submissionResult, submitSuggestion, clearResult } = useSuggestionSubmission();
  
  const [subserviceId, setSubserviceId] = useState('10ccc16c-7729-6fc2-d065-68bea5e09c6b'); // Real subservice ID
  const [suggestionData, setSuggestionData] = useState<SuggestionData>({
    name: 'Test Project Suggestion',
    description: 'This is a test project suggestion submitted via ICESCO Portal',
    brief: 'Brief description of the project suggestion',
    problemStatement: 'The problem this project aims to solve',
    rationale: 'Why this project is important and needed',
    budgetIcesco: 10000,
    budgetMemberState: 5000,
    budgetSponsorship: 2000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    frequency: 'Onetime',
    deliveryModality: 'Hybrid',
    geographicScope: 'International',
    projectType: 'Training',
    beneficiaries: ['Students', 'Teachers'],
    milestone1: 'Project kickoff',
    milestone2: 'Mid-term review',
    milestone3: 'Project completion',
    kpi1: 'Number of participants',
    kpi2: 'Completion rate',
    kpi3: 'Satisfaction score',
    partner1: 'Partner Organization 1',
    partner2: 'Partner Organization 2',
    additionalComments: 'Additional comments about the project suggestion'
  });

  const handleSubmit = async () => {
    if (!isAuthenticated || !contactInfo) {
      alert('Please log in first to submit a suggestion');
      return;
    }

    console.log('=== DEBUG: Starting Suggestion Submission ===');
    console.log('Contact ID from localStorage:', contactInfo.id);
    console.log('Subservice ID:', subserviceId);
    console.log('Suggestion Data:', suggestionData);

    const result = await submitSuggestion(subserviceId, suggestionData);
    
    if (result.success) {
      console.log('Suggestion submitted successfully:', result);
    } else {
      console.error('Suggestion submission failed:', result);
    }
  };

  const handleInputChange = (field: keyof SuggestionData, value: any) => {
    setSuggestionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Required</h3>
        <p className="text-yellow-700">Please log in to submit project suggestions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Project Suggestion Submission Test</h2>
        <button
          onClick={clearResult}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      {/* Contact Information Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Using Contact Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Contact ID:</span> {contactInfo?.id}
          </div>
          <div>
            <span className="font-medium">Name:</span> {contactInfo?.first_name} {contactInfo?.last_name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {contactInfo?.email1}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {contactInfo?.phone_work || contactInfo?.phone_mobile}
          </div>
        </div>
      </div>

      {/* Relationship Fields Info */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Relationships Being Established</h3>
        <div className="text-sm space-y-1">
          <div><span className="font-medium">Subservice Link Field:</span> ms_subservice_icesc_project_suggestions_1</div>
          <div><span className="font-medium">Contact Link Field:</span> contacts_icesc_project_suggestions_1</div>
          <div><span className="font-medium">Account Link Field:</span> accounts_icesc_project_suggestions_1</div>
          <div className="text-xs text-gray-600 mt-2">
            ✅ Using correct link field names from debug results<br/>
            ✅ The _name fields will be automatically populated by SugarCRM
          </div>
        </div>
      </div>

      {/* Subservice ID Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subservice ID
        </label>
        <input
          type="text"
          value={subserviceId}
          onChange={(e) => setSubserviceId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter subservice ID"
        />
      </div>

      {/* Project Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={suggestionData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
            <select
              value={suggestionData.projectType || ''}
              onChange={(e) => handleInputChange('projectType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Training">Training</option>
              <option value="Workshop">Workshop</option>
              <option value="Conference">Conference</option>
              <option value="Campaign">Campaign</option>
              <option value="Research">Research</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={suggestionData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Budget Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ICESCO Budget</label>
            <input
              type="number"
              value={suggestionData.budgetIcesco || ''}
              onChange={(e) => handleInputChange('budgetIcesco', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member State Budget</label>
            <input
              type="number"
              value={suggestionData.budgetMemberState || ''}
              onChange={(e) => handleInputChange('budgetMemberState', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorship Budget</label>
            <input
              type="number"
              value={suggestionData.budgetSponsorship || ''}
              onChange={(e) => handleInputChange('budgetSponsorship', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={suggestionData.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={suggestionData.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mb-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Project Suggestion'}
        </button>
      </div>

      {/* Results Display */}
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
          {submissionResult.success ? (
            <div className="text-green-700">
              <p><strong>Message:</strong> {submissionResult.message}</p>
              <p><strong>Suggestion ID:</strong> {submissionResult.suggestionId}</p>
              <p><strong>Contact ID:</strong> {submissionResult.contactId}</p>
              <p><strong>Subservice ID:</strong> {submissionResult.subserviceId}</p>
            </div>
          ) : (
            <div className="text-red-700">
              <p><strong>Error:</strong> {submissionResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestionSubmissionTest;
