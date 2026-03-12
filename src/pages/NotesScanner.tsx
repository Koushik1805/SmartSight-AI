import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Sparkles, Copy, Check, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { scanNotes } from '../services/api';
import { ScanResult } from '../types';
import { saveHistoryItem } from '../services/historyService';
import { getSettings } from '../services/settingsService';
import { playSpeech, stopSpeech } from '../services/ttsService';

export const NotesScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const settings = getSettings();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setError(null);
    try {
      const data = await scanNotes(file, settings.language);
      if (!data || (!data.extractedText && !data.summary)) {
        throw new Error("AI could not extract text from these notes. Please ensure the image is clear.");
      }
      setResult(data);
      
      // Save to history with resized image
      let historyImage = undefined;
      if (preview) {
        historyImage = await resizeImageForHistory(preview);
      }

      saveHistoryItem({
        type: 'notes',
        title: file.name,
        data: data,
        imageUrl: historyImage
      });

      // Auto-speak if enabled
      if (settings.autoSpeak && settings.voiceEnabled) {
        handleToggleSpeech(data.summary);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during scanning.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleSpeech = async (text: string) => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const success = await playSpeech(text, settings.language);
      if (!success) setIsSpeaking(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resizeImageForHistory = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-8">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Notes Scanner</h2>
        <p className="text-slate-500">Upload handwritten or printed notes to extract and summarize text.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            className={`glass-card rounded-3xl p-8 border-2 border-dashed transition-colors ${
              file ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer py-12"
            >
              {preview ? (
                <img src={preview} className="max-h-64 rounded-xl shadow-lg mb-6" alt="Preview" />
              ) : (
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <Upload size={32} />
                </div>
              )}
              <p className="text-lg font-bold text-slate-700 mb-1">
                {file ? file.name : 'Click to upload notes'}
              </p>
              <p className="text-sm text-slate-400">Supports JPG, PNG, PDF</p>
            </label>
          </div>

          <button 
            disabled={!file || isScanning}
            onClick={handleScan}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20"
          >
            {isScanning ? (
              <>
                <RefreshCw size={20} className="animate-spin" /> Scanning Notes...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Start AI Scan
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="glass-card rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={20} className="text-indigo-600" /> Extracted Text
                    </h3>
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 text-slate-600 text-sm leading-relaxed max-h-60 overflow-y-auto border border-slate-100">
                    {result.extractedText}
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-8 bg-indigo-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles size={20} /> AI Summary
                    </h3>
                    {settings.voiceEnabled && (
                      <button 
                        onClick={() => handleToggleSpeech(result.summary)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-xs ${
                          isSpeaking 
                            ? 'bg-white text-indigo-600 shadow-lg' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <span>{isSpeaking ? 'Stop' : 'Play Voice'}</span>
                      </button>
                    )}
                  </div>
                  <div className="text-indigo-50 text-sm leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{result.summary}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-card rounded-3xl border-2 border-dashed border-red-100 bg-red-50/30">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw size={32} />
                </div>
                <h3 className="text-lg font-bold text-red-600">Scan Failed</h3>
                <p className="text-sm text-red-400 mb-6">{error}</p>
                <button 
                  onClick={handleScan}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-card rounded-3xl border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Scan results will appear here</h3>
                <p className="text-sm text-slate-300">Upload your study notes to get started</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
