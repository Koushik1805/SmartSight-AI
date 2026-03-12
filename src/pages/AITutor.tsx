import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Sparkles, Bot, Trash2, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessageStream } from '../services/api';
import { ChatMessage } from '../types';
import { getChatHistory, saveChatHistory, clearChatHistory } from '../services/historyService';
import { getSettings } from '../services/settingsService';
import { playSpeech, stopSpeech } from '../services/ttsService';

export const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = getSettings();

  useEffect(() => {
    const history = getChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! I am your AI Tutor. How can I help you with your studies today?',
          timestamp: Date.now(),
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, initialAssistantMessage]);

    try {
      let fullResponse = "";
      const prompt = `${input}\n\nIMPORTANT: You are a tutor. Explain clearly. You MUST respond entirely in ${settings.language}.`;
      await sendChatMessageStream(prompt, settings.language, (fullText) => {
        fullResponse = fullText;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, content: fullText } : msg
        ));
      });

      // Auto-speak if enabled
      if (settings.autoSpeak && settings.voiceEnabled) {
        handleToggleSpeech(assistantMsgId, fullResponse);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId ? { ...msg, content: "I'm sorry, I encountered an error. Please try again." } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeech = async (id: string, text: string) => {
    if (isSpeaking === id) {
      stopSpeech();
      setIsSpeaking(null);
    } else {
      setIsSpeaking(id);
      const success = await playSpeech(text, settings.language);
      if (!success) setIsSpeaking(null);
    }
  };

  const handleClear = () => {
    stopSpeech();
    setIsSpeaking(null);
    if (window.confirm('Are you sure you want to clear chat history?')) {
      clearChatHistory();
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: 'History cleared. How can I help you today?',
          timestamp: Date.now(),
        }
      ]);
      window.location.reload();
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col max-w-4xl mx-auto px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Tutor</h2>
          <p className="text-sm text-slate-500">Personalized learning companion</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-thin scrollbar-thumb-slate-200"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-5 rounded-[2rem] relative group ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none shadow-sm border border-slate-100'
                }`}>
                  <div className="text-sm leading-relaxed prose prose-slate max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {msg.role === 'assistant' && settings.voiceEnabled && (
                    <button 
                      onClick={() => handleToggleSpeech(msg.id, msg.content)}
                      className={`absolute -right-24 top-0 flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 font-bold text-[10px] ${
                        isSpeaking === msg.id 
                          ? 'bg-indigo-600 text-white opacity-100 shadow-lg shadow-indigo-500/30' 
                          : 'bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm border border-slate-100'
                      }`}
                    >
                      {isSpeaking === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>{isSpeaking === msg.id ? 'Stop' : 'Play Voice'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-sm border border-slate-100">
                  <Bot size={20} />
                </div>
                <div className="p-5 bg-white rounded-[2rem] rounded-tl-none shadow-sm border border-slate-100 flex gap-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 relative">
        <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full border border-slate-100 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Powered by Gemini 3 Flash
          </div>
        </div>
        <div className="glass-card rounded-[2.5rem] p-2 flex items-center gap-2 shadow-2xl shadow-indigo-500/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your studies..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-6 py-4 text-slate-700 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
