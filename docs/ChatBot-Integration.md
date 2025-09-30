# ChatBot Integration

## Overview
The ChatBot component has been successfully integrated into your React.js application using the OpenAI Assistant API. It provides a floating chat interface that appears on all pages of your application.

## Features
- ✅ Floating chat button in bottom-right corner
- ✅ Modern, responsive design using Tailwind CSS
- ✅ OpenAI Assistant integration with Alem AI
- ✅ Real-time typing indicators
- ✅ Message history and auto-scroll
- ✅ Keyboard shortcuts (Enter to send)
- ✅ Proper error handling and loading states

## Configuration

### Environment Variables
Add these to your `.env.local` file:

```env
# OpenAI Configuration for ChatBot
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_ASSISTANT_ID=your_assistant_id_here
```

### Current Configuration
- **API Key**: Currently using the provided key (should be moved to environment variables)
- **Assistant ID**: `asst_dCQiKh1IQwYBmTJhQl5htC4u`
- **Assistant Name**: Alem AI Assistant

## Usage

### Basic Integration
The chatbot is already integrated into your main layout (`app/layout.tsx`) and will appear on all pages.

### Customization Options

#### 1. Enable/Disable Chatbot
```tsx
import { useChatBot } from '@/hooks/useChatBot';

function MyComponent() {
  const { enableChat, disableChat, isEnabled } = useChatBot();
  
  return (
    <div>
      {isEnabled ? (
        <button onClick={disableChat}>Disable Chat</button>
      ) : (
        <button onClick={enableChat}>Enable Chat</button>
      )}
    </div>
  );
}
```

#### 2. Programmatic Control
```tsx
import { useChatBot } from '@/hooks/useChatBot';

function MyComponent() {
  const { openChat, closeChat, isOpen } = useChatBot();
  
  return (
    <div>
      <button onClick={openChat}>Open Chat</button>
      <button onClick={closeChat}>Close Chat</button>
      <p>Chat is {isOpen ? 'open' : 'closed'}</p>
    </div>
  );
}
```

## Styling
The chatbot uses Tailwind CSS classes and matches your application's teal color scheme:
- Primary color: `teal-600`
- Secondary color: `teal-400`
- Background: `teal-50`
- Text: `gray-800`

## Security Notes
⚠️ **Important**: The current implementation includes hardcoded API keys. For production:

1. Move API keys to environment variables
2. Consider implementing a backend proxy for API calls
3. Add rate limiting and user authentication checks
4. Implement proper error boundaries

## File Structure
```
components/
├── ChatBot.tsx          # Main chatbot component
hooks/
├── useChatBot.ts        # Chatbot state management hook
docs/
├── ChatBot-Integration.md # This documentation
```

## API Integration
The chatbot uses the OpenAI Assistant API v2:
- Creates a new thread for each session
- Sends user messages to the thread
- Runs the assistant to generate responses
- Polls for completion and displays results

## Browser Compatibility
- Modern browsers with ES6+ support
- Requires JavaScript enabled
- Responsive design works on mobile and desktop

## Troubleshooting

### Common Issues
1. **Chat not initializing**: Check API key and network connection
2. **Messages not sending**: Verify assistant ID is correct
3. **Styling issues**: Ensure Tailwind CSS is properly configured

### Debug Mode
Enable browser console to see detailed error messages and API responses.

## Future Enhancements
- [ ] Message persistence across sessions
- [ ] File upload support
- [ ] Voice input/output
- [ ] Multiple language support
- [ ] Custom themes
- [ ] Analytics integration







