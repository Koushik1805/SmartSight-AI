import { HistoryItem, ChatMessage } from "../types";

const HISTORY_KEY = 'smartsight_history';
const CHAT_HISTORY_KEY = 'smartsight_chat_history';

export const saveHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const history = getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 20); // Limit to 20 items to save space
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return newItem;
  } catch (error) {
    console.error('Failed to save history item:', error);
    // If quota exceeded, try clearing oldest half of history
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const history = getHistory();
      const reducedHistory = history.slice(0, Math.floor(history.length / 2));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(reducedHistory));
    }
    return null;
  }
};

export const getHistory = (): HistoryItem[] => {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
  // Force a small delay to ensure storage is updated before any potential re-reads
  return true;
};

export const deleteHistoryItem = (id: string) => {
  const history = getHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const saveChatHistory = (messages: ChatMessage[]) => {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-100)));
};

export const getChatHistory = (): ChatMessage[] => {
  const data = localStorage.getItem(CHAT_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearChatHistory = () => {
  localStorage.removeItem(CHAT_HISTORY_KEY);
};

export const clearAllData = () => {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(CHAT_HISTORY_KEY);
};
