import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Volume2, Save, Check, Trash2, User, Moon, Sun, AlertTriangle } from 'lucide-react';
import { getSettings, saveSettings } from '../services/settingsService';
import { clearAllData } from '../services/historyService';
import { UserSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
  'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati',
  'Kannada', 'Malayalam', 'Punjabi', 'Arabic', 'Russian', 'Portuguese', 'Italian', 'Korean'
];

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c47ff] focus-visible:ring-offset-2 ${
      checked ? 'bg-[#6c47ff]' : 'bg-slate-300 dark:bg-slate-600'
    }`}
  >
    <span
      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${checked ? 'left-6' : 'left-0.5'}`}
    />
  </button>
);

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearAll = () => {
    if (!window.confirm('This will permanently delete all your scan history and chat history. This cannot be undone. Proceed?')) return;
    clearAllData();
    window.location.reload();
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="glass-card rounded-3xl p-6 sm:p-8">
      <h2 className="font-display font-700 text-slate-800 dark:text-white text-lg flex items-center gap-2 mb-5">
        {icon} {title}
      </h2>
      {children}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-800 text-slate-900 dark:text-white mb-1">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Customise your SmartSight AI experience.</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <Section icon={<User size={20} className="text-[#6c47ff]" />} title="Profile">
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="w-12 h-12 bg-[#ede9ff] dark:bg-[#6c47ff]/20 text-[#6c47ff] rounded-full flex items-center justify-center font-display font-800 text-lg shrink-0">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-display font-700 text-slate-800 dark:text-white">{user?.name || 'User'}</p>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-auto text-xs text-red-500 hover:underline font-semibold shrink-0"
            >
              Sign Out
            </button>
          </div>
        </Section>

        {/* Language */}
        <Section icon={<Globe size={20} className="text-[#6c47ff]" />} title="Language">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Select language">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setSettings({ ...settings, language: lang })}
                role="radio"
                aria-checked={settings.language === lang}
                className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-semibold ${
                  settings.language === lang
                    ? 'border-[#6c47ff] bg-[#ede9ff] dark:bg-[#6c47ff]/20 text-[#6c47ff]'
                    : 'border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </Section>

        {/* Voice & Audio */}
        <Section icon={<Volume2 size={20} className="text-[#6c47ff]" />} title="Voice & Audio">
          <div className="space-y-3">
            {[
              {
                key: 'voiceEnabled' as keyof UserSettings,
                label: 'Enable Voice Explanations',
                desc: 'Allow AI to read results aloud using text-to-speech'
              },
              {
                key: 'autoSpeak' as keyof UserSettings,
                label: 'Auto-Speak Results',
                desc: 'Automatically play voice after each analysis completes'
              }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <Toggle
                  checked={!!settings[key]}
                  onChange={() => setSettings({ ...settings, [key]: !settings[key] })}
                  label={label}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Appearance reminder */}
        <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
            <Sun size={18} className="dark:hidden" />
            <Moon size={18} className="hidden dark:block" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Appearance</p>
            <p className="text-xs text-slate-400 mt-0.5">Toggle dark/light mode from the header</p>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} className="btn-primary w-full" aria-live="polite">
          {saved ? <><Check size={18} /> Settings Saved!</> : <><Save size={18} /> Save Changes</>}
        </button>

        {/* Danger zone */}
        <div className={`glass-card rounded-3xl p-6 sm:p-8 border-2 transition-colors ${showDanger ? 'border-red-200 dark:border-red-800/40' : 'border-transparent'}`}>
          <button
            onClick={() => setShowDanger(!showDanger)}
            className="flex items-center gap-2 font-display font-700 text-red-500 text-lg w-full"
            aria-expanded={showDanger}
          >
            <AlertTriangle size={20} /> Danger Zone
          </button>

          {showDanger && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 space-y-4"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">
                These actions are permanent and cannot be undone. Please proceed with caution.
              </p>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1">Clear All App Data</p>
                <p className="text-xs text-red-500 dark:text-red-500/70 mb-3">Deletes all scan history and chat conversations from this device.</p>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Clear All Data
                </button>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1">Sign Out</p>
                <p className="text-xs text-red-500 dark:text-red-500/70 mb-3">Sign out of your SmartSight AI account on this device.</p>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
