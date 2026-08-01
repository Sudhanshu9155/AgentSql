import { createContext, useContext, useMemo, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const value = useMemo(() => ({ messages, setMessages }), [messages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
