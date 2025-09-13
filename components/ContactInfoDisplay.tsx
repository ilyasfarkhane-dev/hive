"use client";
import React from 'react';
import { useStoredContact } from '@/hooks/useStoredContact';

const ContactInfoDisplay: React.FC = () => {
  const {
    contactInfo,
    sessionId,
    goals,
    isAuthenticated,
    fullName,
    email,
    phone,
    title,
    department,
    primaryAddress,
    altAddress,
    refreshData,
    logContactInfo
  } = useStoredContact();

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Not Authenticated</h3>
        <p className="text-yellow-700">Please log in to view contact information.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Stored Contact Information</h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
          <button
            onClick={logContactInfo}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Log to Console
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <p className="text-gray-900">{fullName || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{email || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <p className="text-gray-900">{phone || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <p className="text-gray-900">{title || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <p className="text-gray-900">{department || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact ID</label>
            <p className="text-gray-900">{contactInfo?.id || 'Not available'}</p>
          </div>
        </div>
      </div>

      {/* Primary Address */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
            <p className="text-gray-900">{primaryAddress.street || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <p className="text-gray-900">{primaryAddress.city || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <p className="text-gray-900">{primaryAddress.state || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <p className="text-gray-900">{primaryAddress.postalcode || 'Not available'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <p className="text-gray-900">{primaryAddress.country || 'Not available'}</p>
          </div>
        </div>
      </div>

      {/* Alternative Address */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Alternative Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
            <p className="text-gray-900">{altAddress.street || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <p className="text-gray-900">{altAddress.city || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <p className="text-gray-900">{altAddress.state || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <p className="text-gray-900">{altAddress.postalcode || 'Not available'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <p className="text-gray-900">{altAddress.country || 'Not available'}</p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
            <p className="text-gray-900 font-mono text-sm">{sessionId || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portal Access</label>
            <p className="text-gray-900">{contactInfo?.portal_access_c === '1' ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Entered</label>
            <p className="text-gray-900">{contactInfo?.date_entered || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Modified</label>
            <p className="text-gray-900">{contactInfo?.date_modified || 'Not available'}</p>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Goals ({goals.length})</h3>
        {goals.length > 0 ? (
          <div className="space-y-2">
            {goals.map((goal, index) => (
              <div key={goal.id || index} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{goal.title || goal.name}</p>
                {goal.desc && (
                  <p className="text-sm text-gray-600 mt-1">{goal.desc}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No goals available</p>
        )}
      </div>

      {/* Raw Data */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Raw Contact Data</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-xs text-gray-600 overflow-auto max-h-40">
            {JSON.stringify(contactInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoDisplay;
