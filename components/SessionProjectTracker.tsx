"use client";
import React, { useState } from 'react';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useAuth } from '@/context/AuthContext';

const SessionProjectTracker: React.FC = () => {
  const { sessionId } = useAuth();
  const {
    projects,
    statistics,
    projectCount,
    totalBudget,
    isLoading,
    error,
    loadProjects,
    loadStatistics,
    refreshData,
    exportProjects,
    logProjects,
    getProjectsByGoal,
    getProjectsByPillar,
    getProjectsByService,
    getProjectsBySubService,
    getProjectsByType,
    createSummary
  } = useSessionTracking();

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [filterValue, setFilterValue] = useState<string>('');

  if (!sessionId) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Active Session</h3>
        <p className="text-yellow-700">Please log in to view session project tracking.</p>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      await exportProjects();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleLogProjects = () => {
    logProjects();
  };

  const getFilteredProjects = () => {
    switch (selectedFilter) {
      case 'goal':
        return getProjectsByGoal(filterValue);
      case 'pillar':
        return getProjectsByPillar(filterValue);
      case 'service':
        return getProjectsByService(filterValue);
      case 'subservice':
        return getProjectsBySubService(filterValue);
      case 'type':
        return getProjectsByType(filterValue);
      default:
        return projects;
    }
  };

  const filteredProjects = getFilteredProjects();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Session Project Tracker</h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={handleLogProjects}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Log to Console
          </button>
        </div>
      </div>

      {/* Session Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Session Information</h3>
        <p className="text-sm text-gray-600">Session ID: {sessionId}</p>
        <p className="text-sm text-gray-600">Total Projects: {projectCount}</p>
        <p className="text-sm text-gray-600">Total Budget: ${totalBudget.toLocaleString()}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Session Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded">
              <h4 className="font-semibold text-gray-700">Total Projects</h4>
              <p className="text-2xl font-bold text-blue-600">{statistics.totalProjects}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <h4 className="font-semibold text-gray-700">Total Budget</h4>
              <p className="text-2xl font-bold text-green-600">${statistics.totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <h4 className="font-semibold text-gray-700">Average Budget</h4>
              <p className="text-2xl font-bold text-purple-600">${statistics.averageBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Projects</h3>
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            <option value="goal">By Strategic Goal</option>
            <option value="pillar">By Pillar</option>
            <option value="service">By Service</option>
            <option value="subservice">By Sub-Service</option>
            <option value="type">By Project Type</option>
          </select>
          {selectedFilter !== 'all' && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={`Enter ${selectedFilter} ID or name`}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Projects ({filteredProjects.length})
        </h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No projects found for the current filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">{project.name}</h4>
                  <span className="text-sm text-gray-500">ID: {project.id}</span>
                </div>
                <p className="text-gray-600 mb-3">{project.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Strategic Framework</h5>
                    <p className="text-sm text-gray-600">
                      {project.strategicFramework.goal.name} → {project.strategicFramework.pillar.name} → {project.strategicFramework.service.name} → {project.strategicFramework.subService.name}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Contact</h5>
                    <p className="text-sm text-gray-600">{project.contact.name} ({project.contact.email})</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Budget</h5>
                    <p className="text-sm text-gray-600">Total: ${project.budget.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Timeline</h5>
                    <p className="text-sm text-gray-600">{project.timeline.start} to {project.timeline.end}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Type</h5>
                    <p className="text-sm text-gray-600">{project.scope.type} ({project.scope.delivery})</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Submitted: {new Date(project.submissionDate).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Session Summary</h3>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
          {createSummary()}
        </pre>
      </div>
    </div>
  );
};

export default SessionProjectTracker;


