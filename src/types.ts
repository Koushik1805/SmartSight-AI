export interface DetectedObject {
  name: string;
  confidence: number;
  explanation: string;
}

export interface ScanResult {
  extractedText: string;
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  type: 'object' | 'notes';
  title: string;
  timestamp: number;
  data: DetectedObject | ScanResult;
  imageUrl?: string;
}

export interface UserSettings {
  language: string;
  autoSpeak: boolean;
  voiceEnabled: boolean;
}
