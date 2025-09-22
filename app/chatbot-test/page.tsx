import React from 'react';
import ChatBotTest from '@/components/ChatBotTest';

export default function ChatBotTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ChatBot Test Page</h1>
          <p className="text-gray-600">Test and control the chatbot functionality</p>
        </div>
        
        <ChatBotTest />
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Instructions</h2>
          <div className="space-y-3 text-gray-600">
            <p><strong>1.</strong> The floating chat button should be visible in the bottom-right corner of your screen.</p>
            <p><strong>2.</strong> Use the control panel above to enable/disable or open/close the chat.</p>
            <p><strong>3.</strong> The chatbot uses OpenAI Assistant API with the "Alem AI" assistant.</p>
            <p><strong>4.</strong> Make sure you're logged in to the application for full functionality.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

