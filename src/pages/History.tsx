import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trash2, Camera, FileText, ChevronRight, Search } from 'lucide-react';
import { getHistory, clearHistory, deleteHistoryItem } from '../services/historyService';
import { HistoryItem } from '../types';
import { useNavigate } from 'react-router-dom';

export const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your entire history?')) {
      clearHistory();
      setHistory([]);
      setSearchTerm('');
    }
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this item?')) {
      const updated = deleteHistoryItem(id);
      setHistory(updated);
    }
  };

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Scan History</h2>
          <p className="text-slate-500">Review your past object scans and note extractions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64"
            />
          </div>
          
          {history.length > 0 && (
            <button 
              onClick={handleClear}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              title="Clear History"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4 rounded-3xl flex items-center gap-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(item.type === 'object' ? '/scan-object' : '/scan-notes')}
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    {item.type === 'object' ? <Camera size={24} /> : <FileText size={24} />}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.type === 'object' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {formatDate(item.timestamp)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => handleDeleteItem(e, item.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Item"
                >
                  <Trash2 size={18} />
                </button>
                <div className="p-2 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                  <ChevronRight size={24} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-card rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-400 mb-2">No history found</h3>
          <p className="text-slate-300 max-w-xs mx-auto">
            {searchTerm ? `No results matching "${searchTerm}"` : "Your scan history will appear here once you start using the tools."}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => navigate('/scan-object')}
              className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              Start Scanning
            </button>
          )}
        </div>
      )}
    </div>
  );
};
