import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, FileText, MessageSquare, ArrowUpRight, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory } from '../services/historyService';
import { HistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  onClick: () => void;
}> = ({ title, description, icon: Icon, color, bg, onClick }) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="glass-card p-6 sm:p-8 rounded-3xl text-left group relative overflow-hidden w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c47ff] focus-visible:ring-offset-2"
    aria-label={`Go to ${title}`}
  >
    <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
      <Icon size={24} className={color} aria-hidden="true" />
    </div>
    <h3 className="font-display font-700 text-lg text-slate-800 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">{description}</p>
    <div className="flex items-center gap-1 text-[#6c47ff] font-semibold text-sm group-hover:gap-2 transition-all">
      Get Started <ArrowUpRight size={15} aria-hidden="true" />
    </div>
    <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${bg} opacity-20 rounded-full blur-2xl`} aria-hidden="true" />
  </motion.button>
);

const features = [
  {
    title: 'Object Scanner',
    description: 'Point your camera at any object to get instant AI-powered explanations.',
    icon: Camera,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    path: '/scan-object',
  },
  {
    title: 'Notes Scanner',
    description: 'Upload handwritten or printed notes and extract text using AI OCR.',
    icon: FileText,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    path: '/scan-notes',
  },
  {
    title: 'AI Tutor',
    description: 'Ask anything and get clear, educational answers from your AI companion.',
    icon: MessageSquare,
    color: 'text-[#6c47ff]',
    bg: 'bg-[#ede9ff] dark:bg-[#6c47ff]/20',
    path: '/ai-tutor',
  },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { user } = useAuth();

  useEffect(() => { setHistory(getHistory().slice(0, 8)); }, []);

  const handleClearHistory = () => {
    if (!window.confirm('Clear all recent activity?')) return;
    clearHistory();
    setHistory([]);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-[#6c47ff] font-display font-700 text-sm uppercase tracking-widest mb-2">
          {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-800 text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">
          Welcome to<br />SmartSight<span className="text-[#6c47ff]"> AI</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-md">
          Your AI-powered visual learning assistant. Scan objects, extract notes, and ask questions.
        </p>
      </motion.div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {features.map((f, i) => (
          <motion.div
            key={f.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <FeatureCard {...f} onClick={() => navigate(f.path)} />
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <Clock size={20} className="text-[#6c47ff]" aria-hidden="true" /> Recent Activity
          </h2>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors font-semibold"
              aria-label="Clear recent activity"
            >
              <Trash2 size={13} aria-hidden="true" /> Clear
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="glass-card p-3 rounded-2xl text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c47ff]"
                onClick={() => navigate(item.type === 'object' ? '/scan-object' : '/scan-notes')}
                aria-label={`${item.type} scan: ${item.title}`}
              >
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 mb-3 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" aria-hidden="true" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600" aria-hidden="true">
                      {item.type === 'object' ? <Camera size={28} /> : <FileText size={28} />}
                    </div>
                  )}
                </div>
                <h3 className="font-display font-700 text-slate-800 dark:text-white text-xs truncate group-hover:text-[#6c47ff] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{item.type} Scan</p>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
            <p className="text-slate-400 dark:text-slate-600 text-sm">No recent activity yet. Start scanning to see your history!</p>
            <button onClick={() => navigate('/scan-object')} className="btn-primary text-sm mt-4">
              Start Scanning
            </button>
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-r from-[#6c47ff] to-[#8b66ff] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
        role="complementary"
        aria-label="Feature promotion"
      >
        <div>
          <h3 className="font-display font-800 text-xl sm:text-2xl mb-1">Try the AI Tutor</h3>
          <p className="text-indigo-100 text-sm">Ask any study question and get instant, clear explanations.</p>
        </div>
        <button
          onClick={() => navigate('/ai-tutor')}
          className="px-6 py-3 bg-white text-[#6c47ff] rounded-2xl font-display font-700 text-sm hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20 shrink-0 whitespace-nowrap"
        >
          Start Chatting →
        </button>
      </motion.div>
    </div>
  );
};
