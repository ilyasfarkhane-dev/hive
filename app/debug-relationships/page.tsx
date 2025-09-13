"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const DebugRelationshipsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const runDebug = async () => {
    setIsLoadingDebug(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug-relationships');
      const data = await response.json();
      
      if (data.success) {
        setDebugData(data);
      } else {
        setError(data.error || 'Debug failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingDebug(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Debug Relationship Fields</h1>
          <p className="mt-2 text-gray-600">
            Discover the correct relationship field names in SugarCRM.
          </p>
        </div>
        
        <div className="mb-6">
          <button
            onClick={runDebug}
            disabled={isLoadingDebug}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingDebug ? 'Running Debug...' : 'Run Relationship Debug'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {debugData && (
          <div className="space-y-6">
            {/* Relationship Fields */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Relationship Fields Found</h2>
              {debugData.relationshipFields && debugData.relationshipFields.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {debugData.relationshipFields.map((field: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{field.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.source}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.required ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No relationship fields found</p>
              )}
            </div>

            {/* Existing Projects */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Project Suggestions</h2>
              {debugData.existingProjects && debugData.existingProjects.length > 0 ? (
                <div className="space-y-4">
                  {debugData.existingProjects.map((project: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800">{project.name}</h3>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Subservice ID:</span> {project.sub_service_id || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Subservice Name:</span> {project.sub_service || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Contact ID:</span> {project.contact_id || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Contact Name:</span> {project.contact_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">ms_subservice_icesc_project_suggestions_1:</span> {project.ms_subservice_icesc_project_suggestions_1 || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">ms_subservice_icesc_project_suggestions_1_name:</span> {project.ms_subservice_icesc_project_suggestions_1_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">contacts_icesc_project_suggestions_1:</span> {project.contacts_icesc_project_suggestions_1 || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">contacts_icesc_project_suggestions_1_name:</span> {project.contacts_icesc_project_suggestions_1_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">accounts_icesc_project_suggestions_1:</span> {project.accounts_icesc_project_suggestions_1 || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">accounts_icesc_project_suggestions_1_name:</span> {project.accounts_icesc_project_suggestions_1_name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No existing projects found</p>
              )}
            </div>

            {/* Raw Debug Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Raw Debug Data</h2>
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugRelationshipsPage;


