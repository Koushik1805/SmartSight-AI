import React, { useState, useEffect } from 'react';
import { Bell, User, Settings as SettingsIcon, Moon, Sun, LogOut, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSettings, saveSettings } from '../services/settingsService';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi', 'Bengali', 'Telugu', 
  'Marathi', 'Tamil', 'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Portuguese', 'Italian'
];

export const Header: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const settings = getSettings();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLangChange = (lang: string) => {
    saveSettings({ ...settings, language: lang });
    setShowLangMenu(false);
    window.location.reload(); 
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 relative z-40">
      <div className="flex flex-col">
        <h1 className="text-sm font-bold text-slate-900 dark:text-white">SmartSight AI</h1>
      </div>

      <div className="flex items-center gap-1">
        {/* Language Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
            title="Change Language"
          >
            <Globe size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{settings.language.substring(0, 3)}</span>
          </button>
          
          {showLangMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLangChange(lang)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 z-50">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Notifications</h4>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  Welcome to SmartSight AI! Start by scanning an object.
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/settings')}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <SettingsIcon size={20} />
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-2 group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold dark:text-white leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">User</p>
            </div>
            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-white dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform">
              <User size={18} />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 overflow-hidden z-50">
              <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
