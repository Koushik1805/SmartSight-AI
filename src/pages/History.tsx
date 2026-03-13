import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Camera, FileText, ChevronRight, Search, Filter, X } from 'lucide-react';
import { getHistory, clearHistory, deleteHistoryItem } from '../services/historyService';
import { HistoryItem } from '../types';
import { useNavigate } from 'react-router-dom';

type FilterType = 'all' | 'object' | 'notes';

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));

export const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const navigate = useNavigate();

  useEffect(() => { setHistory(getHistory()); }, []);

  const filtered = useMemo(() => {
    return history.filter(item => {
      const matchesType = filter === 'all' || item.type === filter;
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [history, searchTerm, filter]);

  const handleClear = () => {
    if (!window.confirm('Clear all scan history? This cannot be undone.')) return;
    clearHistory();
    setHistory([]);
    setSearchTerm('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this item?')) return;
    setHistory(deleteHistoryItem(id));
  };

  const goToItem = (item: HistoryItem) =>
    navigate(item.type === 'object' ? '/scan-object' : '/scan-notes');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-800 text-slate-900 dark:text-white mb-1">Scan History</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {history.length} item{history.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-10 py-2.5 text-sm w-full sm:w-52"
              aria-label="Search history"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" role="group" aria-label="Filter by type">
            {(['all', 'object', 'notes'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-display font-700 capitalize transition-colors ${
                  filter === f
                    ? 'bg-[#6c47ff] text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Clear all */}
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              aria-label="Clear all history"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <ul className="space-y-3" aria-label="History items">
          <AnimatePresence initial={false}>
            {filtered.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div
                  className="glass-card p-4 rounded-3xl flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => goToItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && goToItem(item)}
                  aria-label={`${item.type} scan: ${item.title}, ${formatDate(item.timestamp)}`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" aria-hidden="true" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600" aria-hidden="true">
                        {item.type === 'object' ? <Camera size={22} /> : <FileText size={22} />}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-display font-700 uppercase tracking-wider ${
                        item.type === 'object'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} aria-hidden="true" /> {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <h3 className="font-display font-700 text-slate-800 dark:text-white truncate text-sm group-hover:text-[#6c47ff] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="p-2 text-slate-300 group-hover:text-[#6c47ff] group-hover:translate-x-0.5 transition-all" aria-hidden="true">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="text-center py-24 glass-card rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <Clock size={32} />
          </div>
          <h3 className="font-display font-700 text-slate-400 mb-2">
            {searchTerm || filter !== 'all' ? 'No matching items' : 'No history yet'}
          </h3>
          <p className="text-slate-300 dark:text-slate-600 text-sm max-w-xs mx-auto mb-6">
            {searchTerm
              ? `No results for "${searchTerm}"`
              : filter !== 'all'
              ? `No ${filter} scans found`
              : 'Your scan history will appear here once you start using the tools.'}
          </p>
          {!searchTerm && filter === 'all' && (
            <button onClick={() => navigate('/scan-object')} className="btn-primary text-sm">
              Start Scanning
            </button>
          )}
          {(searchTerm || filter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setFilter('all'); }} className="btn-secondary text-sm">
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
