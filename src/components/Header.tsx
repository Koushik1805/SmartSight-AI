import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, User, Settings as SettingsIcon, Moon, Sun, LogOut, Globe, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSettings, saveSettings } from '../services/settingsService';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi', 'Bengali', 'Telugu',
  'Marathi', 'Tamil', 'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Portuguese', 'Italian'
];

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isDark, setIsDark] = useState(() => {
    // Persist dark mode preference
    return localStorage.getItem('smartsight_theme') === 'dark' ||
      (!localStorage.getItem('smartsight_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const settings = getSettings();

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Apply dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartsight_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartsight_theme', 'light');
    }
  }, [isDark]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowLangMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLangChange = (lang: string) => {
    saveSettings({ ...settings, language: lang });
    setShowLangMenu(false);
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = (user?.name || 'U')[0].toUpperCase();

  return (
    <header
      className="h-14 md:h-16 px-4 md:px-8 flex items-center justify-between bg-white dark:bg-[#0f0f11] border-b border-slate-100 dark:border-white/5 relative z-40 shrink-0"
      role="banner"
    >
      {/* Left: Hamburger (mobile) + Brand */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="hidden md:flex flex-col">
          <span className="text-xs font-display font-700 text-[#6c47ff] uppercase tracking-widest">SmartSight AI</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5" role="toolbar" aria-label="Header actions">

        {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => { setShowLangMenu(!showLangMenu); setShowNotifications(false); setShowUserMenu(false); }}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#6c47ff] dark:hover:text-[#6c47ff] transition-colors flex items-center gap-1 rounded-lg min-w-[44px] min-h-[44px] justify-center"
            aria-label={`Change language, current: ${settings.language}`}
            aria-haspopup="listbox"
            aria-expanded={showLangMenu}
          >
            <Globe size={18} aria-hidden="true" />
            <span className="text-[9px] font-display font-700 uppercase tracking-wider hidden sm:inline">
              {settings.language.substring(0, 3)}
            </span>
          </button>

          {showLangMenu && (
            <div
              className="absolute top-full right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white dark:bg-[#1a1a1f] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/8 py-2 z-50"
              role="listbox"
              aria-label="Select language"
            >
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLangChange(lang)}
                  role="option"
                  aria-selected={settings.language === lang}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors min-h-[40px] ${
                    settings.language === lang
                      ? 'text-[#6c47ff] font-semibold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#6c47ff] dark:hover:text-[#6c47ff] transition-colors rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDark}
        >
          {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); setShowLangMenu(false); }}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#6c47ff] dark:hover:text-[#6c47ff] transition-colors relative rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications (1 unread)"
            aria-haspopup="true"
            aria-expanded={showNotifications}
          >
            <Bell size={18} aria-hidden="true" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
          </button>

          {showNotifications && (
            <div
              className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#1a1a1f] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/8 p-4 z-50"
              role="dialog"
              aria-label="Notifications panel"
            >
              <h4 className="font-display font-700 text-slate-900 dark:text-white mb-3 text-sm">Notifications</h4>
              <div className="space-y-2">
                <div className="p-3 bg-[#ede9ff] dark:bg-[#6c47ff]/10 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-[#6c47ff]/10">
                  👋 Welcome to SmartSight AI! Start by scanning an object.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings shortcut */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#6c47ff] dark:hover:text-[#6c47ff] transition-colors rounded-lg min-w-[44px] min-h-[44px] items-center justify-center hidden md:flex"
          aria-label="Go to settings"
        >
          <SettingsIcon size={18} aria-hidden="true" />
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-white/8 mx-1 hidden sm:block" aria-hidden="true" />

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowLangMenu(false); }}
            className="flex items-center gap-2 pl-1 group rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 px-2 py-1 transition-colors min-h-[44px]"
            aria-label={`User menu for ${user?.name || 'User'}`}
            aria-haspopup="true"
            aria-expanded={showUserMenu}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-display font-700 text-slate-800 dark:text-white leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-700 tracking-wider">Student</p>
            </div>
            <div className="w-8 h-8 bg-[#ede9ff] dark:bg-[#6c47ff]/20 rounded-full flex items-center justify-center text-[#6c47ff] font-display font-800 text-sm border border-white dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform">
              {userInitial}
            </div>
          </button>

          {showUserMenu && (
            <div
              className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-[#1a1a1f] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/8 py-2 overflow-hidden z-50"
              role="menu"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                <p className="text-sm font-display font-700 text-slate-800 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors min-h-[44px]"
                role="menuitem"
              >
                <SettingsIcon size={16} aria-hidden="true" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
                role="menuitem"
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
