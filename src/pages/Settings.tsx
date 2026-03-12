import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe, Volume2, Mic, Save, Check, Trash2 } from 'lucide-react';
import { getSettings, saveSettings } from '../services/settingsService';
import { clearAllData } from '../services/historyService';
import { UserSettings } from '../types';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 
  'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 
  'Kannada', 'Malayalam', 'Punjabi'
];

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearAll = () => {
    if (window.confirm('CRITICAL: This will permanently delete ALL your scan history and chat conversations. Are you sure?')) {
      clearAllData();
      alert('All data has been cleared.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-8">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Settings</h2>
        <p className="text-slate-500">Customize your SmartSight AI experience.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card rounded-3xl p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Globe className="text-indigo-600" size={24} /> Language Preference
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setSettings({ ...settings, language: lang })}
                className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  settings.language === lang 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                    : 'border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Volume2 className="text-indigo-600" size={24} /> Voice & Audio
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-800">Enable Voice Explanations</p>
                <p className="text-sm text-slate-500">Allow AI to speak the results</p>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
                className={`w-14 h-8 rounded-full transition-colors relative ${settings.voiceEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.voiceEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-800">Auto-Speak Results</p>
                <p className="text-sm text-slate-500">Automatically play voice after analysis</p>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, autoSpeak: !settings.autoSpeak })}
                className={`w-14 h-8 rounded-full transition-colors relative ${settings.autoSpeak ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.autoSpeak ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 border-2 border-red-50 dark:border-red-900/20">
          <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
            <Trash2 size={24} /> Danger Zone
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Permanently delete all your data from this device. This action cannot be undone.
          </p>
          <button 
            onClick={handleClearAll}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100"
          >
            Clear All App Data
          </button>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
        >
          {isSaved ? <><Check size={20} /> Settings Saved</> : <><Save size={20} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
};
