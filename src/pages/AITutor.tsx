import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Trash2, Volume2, VolumeX, AlertCircle, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessageStream } from '../services/api';
import { ChatMessage } from '../types';
import { getChatHistory, saveChatHistory, clearChatHistory } from '../services/historyService';
import { getSettings } from '../services/settingsService';
import { playSpeech, stopSpeech } from '../services/ttsService';

const MAX_INPUT = 2000;

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your AI Tutor powered by Gemini. Ask me anything about your studies — I'm here to help you learn and understand any topic. 🎓",
  timestamp: Date.now(),
};

const formatTime = (ts: number) =>
  new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));

export const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const settings = getSettings();

  // Load history
  useEffect(() => {
    const history = getChatHistory();
    setMessages(history.length > 0 ? history : [WELCOME]);
  }, []);

  // Save & scroll on messages update
  useEffect(() => {
    if (messages.length > 0) saveChatHistory(messages);
  }, [messages]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Show/hide scroll-to-bottom button
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!isNearBottom);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const asstId = (Date.now() + 1).toString();
    const asstMsg: ChatMessage = { id: asstId, role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, asstMsg]);

    try {
      let full = '';
      const prompt = `${text}\n\nIMPORTANT: You are an educational AI tutor. Answer clearly and helpfully. Respond entirely in ${settings.language}.`;
      await sendChatMessageStream(prompt, settings.language, (chunk) => {
        full = chunk;
        setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: chunk } : m));
      });

      if (settings.autoSpeak && settings.voiceEnabled && full) {
        handleToggleSpeech(asstId, full);
      }
    } catch (err: any) {
      const msg = err.message || 'Something went wrong. Please try again.';
      setError(msg);
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `⚠️ ${msg}` } : m));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, settings]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleSpeech = async (id: string, text: string) => {
    if (isSpeaking === id) { stopSpeech(); setIsSpeaking(null); return; }
    stopSpeech();
    setIsSpeaking(id);
    const ok = await playSpeech(text, settings.language);
    if (!ok) setIsSpeaking(null);
  };

  const handleClear = () => {
    if (!window.confirm('Clear all chat messages?')) return;
    stopSpeech(); setIsSpeaking(null);
    clearChatHistory();
    setMessages([WELCOME]);
    setError(null);
  };

  const remaining = MAX_INPUT - input.length;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="font-display text-2xl font-800 text-slate-900 dark:text-white">AI Tutor</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Ask anything — powered by Gemini</p>
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          aria-label="Clear chat history"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Error bar */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="error-box flex items-center gap-2 mb-3 shrink-0"
            role="alert"
          >
            <AlertCircle size={14} className="shrink-0" />
            <span className="text-xs">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 pb-2 pr-1 relative"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] sm:max-w-[78%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user'
                    ? 'bg-[#6c47ff] text-white'
                    : 'bg-white dark:bg-slate-800 text-[#6c47ff] border border-slate-100 dark:border-slate-700'
                }`} aria-hidden="true">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`relative group px-4 py-3 rounded-[1.5rem] ${
                  msg.role === 'user'
                    ? 'bg-[#6c47ff] text-white rounded-tr-lg'
                    : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 rounded-tl-lg border border-slate-100 dark:border-slate-700/50 shadow-sm'
                }`}>
                  {/* Streaming indicator */}
                  {msg.role === 'assistant' && !msg.content && isLoading && (
                    <div className="flex gap-1 py-1 px-1" aria-label="AI is typing">
                      {[0, 0.2, 0.4].map((d, i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1, delay: d }}
                          className="w-1.5 h-1.5 bg-[#6c47ff] rounded-full"
                        />
                      ))}
                    </div>
                  )}

                  {msg.content && (
                    <div className={`text-sm leading-relaxed prose max-w-none ${
                      msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert prose-slate'
                    }`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {formatTime(msg.timestamp)}
                  </p>

                  {/* Voice button (assistant only) */}
                  {msg.role === 'assistant' && msg.content && settings.voiceEnabled && (
                    <button
                      onClick={() => handleToggleSpeech(msg.id, msg.content)}
                      className={`absolute -right-10 top-2 opacity-0 group-hover:opacity-100 p-2 rounded-xl transition-all ${
                        isSpeaking === msg.id ? 'bg-[#6c47ff] text-white opacity-100' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-[#6c47ff] border border-slate-100 dark:border-slate-700 shadow-sm'
                      }`}
                      aria-label={isSpeaking === msg.id ? 'Stop voice' : 'Play message'}
                      aria-pressed={isSpeaking === msg.id}
                    >
                      {isSpeaking === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 right-6 sm:right-12 w-9 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-full flex items-center justify-center text-slate-500 hover:text-[#6c47ff] transition-colors z-10"
            aria-label="Scroll to latest message"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="mt-3 shrink-0">
        <div className="glass-card rounded-[1.75rem] p-2 flex items-end gap-2 shadow-xl shadow-[#6c47ff]/8 dark:shadow-none dark:border dark:border-slate-700/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your studies… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 text-sm resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: '48px' }}
            aria-label="Chat message input"
            aria-multiline="true"
            disabled={isLoading}
          />
          <div className="flex items-center gap-2 mb-1 mr-1">
            {input.length > MAX_INPUT * 0.8 && (
              <span className={`text-[10px] font-semibold ${remaining < 100 ? 'text-red-400' : 'text-slate-400'}`}>
                {remaining}
              </span>
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-[#6c47ff] text-white rounded-full flex items-center justify-center hover:bg-[#5835ee] transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
              aria-label="Send message"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <Send size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-2">Powered by Gemini 2.0 Flash</p>
      </div>
    </div>
  );
};
