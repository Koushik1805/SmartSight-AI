import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, FileText, MessageSquare, ArrowUpRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory } from '../services/historyService';
import { HistoryItem } from '../types';

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon: Icon, color, onClick }) => (
  <motion.div
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="glass-card p-8 rounded-3xl cursor-pointer group relative overflow-hidden"
  >
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <Icon size={28} className="text-white" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-800">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed mb-6">{description}</p>
    <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
      Get Started <ArrowUpRight size={16} />
    </div>
    
    {/* Decorative background element */}
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${color} opacity-5 rounded-full blur-2xl`} />
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Clear all recent activity?')) {
      clearHistory();
      setHistory([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <h2 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Welcome to<br />SmartSight AI
        </h2>
        <p className="text-slate-500 text-lg">
          Your AI-powered visual assistant is ready to help you learn and explore.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <FeatureCard
          title="Object Scanner"
          description="Use your camera to detect real-world objects and instantly learn about them with AI explanations."
          icon={Camera}
          color="bg-orange-500"
          onClick={() => navigate('/scan-object')}
        />
        <FeatureCard
          title="Notes Scanner"
          description="Upload handwritten or printed notes and extract text using AI OCR technology."
          icon={FileText}
          color="bg-emerald-500"
          onClick={() => navigate('/scan-notes')}
        />
        <FeatureCard
          title="AI Tutor"
          description="Ask questions and get intelligent explanations powered by AI. Your personal study companion."
          icon={MessageSquare}
          color="bg-indigo-500"
          onClick={() => navigate('/ai-tutor')}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-indigo-600" size={24} /> Recent Activity
          </h3>
          {history.length > 0 && (
            <button 
              onClick={handleClearHistory}
              className="text-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-4 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(item.type === 'object' ? '/scan-object' : '/scan-notes')}
              >
                <div className="aspect-square rounded-xl bg-slate-100 mb-3 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      {item.type === 'object' ? <Camera size={32} /> : <FileText size={32} />}
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-slate-800 truncate">{item.title}</h4>
                <p className="text-xs text-slate-400 capitalize">{item.type} Scan</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-3xl border-2 border-dashed border-slate-100">
            <p className="text-slate-400">No recent activity yet. Start scanning to see history!</p>
          </div>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-20 p-8 glass-card rounded-[2.5rem] flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
      >
        <div>
          <h3 className="text-2xl font-bold mb-2">Try the new AI Research mode</h3>
          <p className="text-indigo-100">Deep dive into any topic with our advanced reasoning engine.</p>
        </div>
        <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20">
          Explore Now
        </button>
      </motion.div>
    </div>
  );
};
