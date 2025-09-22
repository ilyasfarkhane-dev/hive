'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Configuration - using environment variables
  const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "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";
  const ASSISTANT_ID = process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID || "asst_dCQiKh1IQwYBmTJhQl5htC4u";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const removeCitations = (text: string): string => {
    return text
      .replace(/【[^】]*source[^】]*】/gi, '')
      .replace(/\s*\[source\]/gi, '')
      .replace(/\s*\(source:?[^)]*\)/gi, '')
      .replace(/\s*\[[0-9]+\]/g, '');
  };

  const renderWithLinks = (text: string): string => {
    const cleaned = removeCitations(text);
    const escaped = escapeHtml(cleaned);
    return escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  const initThread = useCallback(async () => {
    try {
      const response = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      if (!data.id) {
        throw new Error("Thread creation failed");
      }

      setThreadId(data.id);
      setIsInitialized(true);
      
      // Add welcome message
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hi, I am Alem. How can I help you?'
      }]);
    } catch (error) {
      console.error("Error initializing thread:", error);
      alert("Failed to initialize chat. Please reload the page.");
    }
  }, [API_KEY]);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      initThread();
    }
  }, [isOpen, isInitialized, initThread]);

  const sendMessage = async () => {
    if (!threadId || !inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Step 1: Add user message to thread
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({ 
          role: "user", 
          content: inputValue 
        })
      });

      // Step 2: Run assistant
      let runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({ assistant_id: ASSISTANT_ID })
      });

      let run = await runResponse.json();

      // Poll for completion
      while (run.status !== "completed" && run.status !== "failed") {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const pollResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
          headers: { 
            "Authorization": `Bearer ${API_KEY}`, 
            "OpenAI-Beta": "assistants=v2" 
          }
        });
        run = await pollResponse.json();
      }

      // Get assistant response
      const msgResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: { 
          "Authorization": `Bearer ${API_KEY}`, 
          "OpenAI-Beta": "assistants=v2" 
        }
      });

      const msgData = await msgResponse.json();
      const lastMsg = msgData.data.find((m: any) => m.role === "assistant");
      const reply = lastMsg?.content?.[0]?.text?.value || "No response";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {/* ChatBot Styles - Matching Original HTML */}
      <style jsx>{`
        .chatbot-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #008484 0%, #47c2c2 100%);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 15px rgba(0, 132, 132, 0.4);
          z-index: 1000;
          transition: all 0.3s ease;
        }
        
        .chatbot-button:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 20px rgba(0, 132, 132, 0.5);
        }
        
        .chatbot-widget {
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 380px;
          height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 999;
        }
        
        .chatbot-input-container {
          display: flex;
          padding: 15px;
          border-top: 1px solid #eee;
          gap: 10px;
          background: white;
        }
        
        .chatbot-input {
          flex: 1;
          padding: 8px 8px;
          border-radius: 24px;
          border: 1px solid #ddd;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.3s;
        }
        
        .chatbot-input:focus {
          border-color: #008484;
          box-shadow: 0 0 0 2px rgba(0,132,132,0.2);
        }
        
        .chatbot-send-btn {
          padding: 12px 24px;
          border-radius: 9999px;
          border: none;
          background: #008484;
          color: white;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .chatbot-send-btn:hover {
          background: #006969;
        }
        
        .chatbot-send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .chatbot-send-btn i {
          font-size: 18px;
          line-height: 1;
        }
        
        .chatbot-messages {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fafafa;
        }
        
        .chatbot-message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          line-height: 1.4;
          animation: fadeIn 0.3s ease;
          position: relative;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .chatbot-message.user {
          align-self: flex-end;
          background: #008484;
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .chatbot-message.assistant {
          align-self: flex-start;
          background: #e8f4f4;
          color: #333;
          border-bottom-left-radius: 4px;
        }
        
        .chatbot-message a {
          color: #006969;
          text-decoration: underline;
        }
        
        .chatbot-header {
          background: linear-gradient(135deg, #008484 0%, #47c2c2 100%);
          color: white;
          padding: 15px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        
        .chatbot-title {
          font-size: 18px;
          font-weight: 700;
        }
        
        .chatbot-close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 22px;
          cursor: pointer;
          padding: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s ease;
          position: absolute;
          right: 8px;
          top: 8px;
        }
        
        .chatbot-close-btn:hover {
          background: rgba(255,255,255,0.18);
        }
      `}</style>
      
      {/* Floating Chat Button */}
       <button
         onClick={() => setIsOpen(!isOpen)}
         className="chatbot-button"
         aria-label="Open chat"
       >
        <i className="fa-solid fa-message"></i>
      </button>

      {/* Chat Widget */}
      {isOpen && (
         <div className="chatbot-widget">
          {/* Chat Header */}
          <div className="chatbot-header">
            <span className="chatbot-title">Alem AI assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close-btn"
              aria-label="Close chat"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

           {/* Messages */}
           <div className="chatbot-messages">
             {messages.map((message) => (
               <div
                 key={message.id}
                 className={`chatbot-message ${message.role}`}
                 dangerouslySetInnerHTML={{
                   __html: message.role === 'assistant' 
                     ? renderWithLinks(message.content) 
                     : escapeHtml(message.content)
                 }}
               />
             ))}
             
             {isLoading && (
               <div className="chatbot-message assistant">
                 Alem is typing...
               </div>
             )}
             <div ref={messagesEndRef} />
           </div>

           {/* Input Container */}
           <div className="chatbot-input-container">
             <input
               ref={inputRef}
               type="text"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyPress={handleKeyPress}
               placeholder="Ask something..."
               disabled={!isInitialized || isLoading}
               className="chatbot-input"
             />
             <button
               onClick={sendMessage}
               disabled={!isInitialized || isLoading || !inputValue.trim()}
               className="chatbot-send-btn"
               aria-label="Send"
             >
               <i className="fa-solid fa-paper-plane"></i>
               <span>Send</span>
             </button>
           </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
