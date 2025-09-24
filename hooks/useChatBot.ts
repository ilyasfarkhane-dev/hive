import { useState, useCallback } from 'react';

interface ChatBotState {
  isOpen: boolean;
  isEnabled: boolean;
}

export const useChatBot = () => {
  const [state, setState] = useState<ChatBotState>({
    isOpen: false,
    isEnabled: true, // You can control this based on user preferences or conditions
  });

  const openChat = useCallback(() => {
    if (state.isEnabled) {
      setState(prev => ({ ...prev, isOpen: true }));
    }
  }, [state.isEnabled]);

  const closeChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleChat = useCallback(() => {
    if (state.isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [state.isOpen, openChat, closeChat]);

  const enableChat = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }));
  }, []);

  const disableChat = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false, isOpen: false }));
  }, []);

  return {
    ...state,
    openChat,
    closeChat,
    toggleChat,
    enableChat,
    disableChat,
  };
};





