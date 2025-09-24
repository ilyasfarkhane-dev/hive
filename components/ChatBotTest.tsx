'use client';

import React from 'react';
import { useChatBot } from '@/hooks/useChatBot';

const ChatBotTest: React.FC = () => {
  const { 
    isOpen, 
    isEnabled, 
    openChat, 
    closeChat, 
    toggleChat, 
    enableChat, 
    disableChat 
  } = useChatBot();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">ChatBot Control Panel</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Chat Status:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Chat Enabled:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleChat}
            disabled={!isEnabled}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isOpen ? 'Close Chat' : 'Open Chat'}
          </button>

          <button
            onClick={isEnabled ? disableChat : enableChat}
            className={`px-4 py-2 rounded transition-colors ${
              isEnabled 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isEnabled ? 'Disable Chat' : 'Enable Chat'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Instructions:</strong> Use these controls to test the chatbot functionality. 
            The floating chat button should be visible in the bottom-right corner when enabled.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBotTest;





