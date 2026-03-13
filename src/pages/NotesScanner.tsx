import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Sparkles, Copy, Check, RefreshCw, Volume2, VolumeX, AlertCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { scanNotes } from '../services/api';
import { ScanResult } from '../types';
import { saveHistoryItem } from '../services/historyService';
import { getSettings } from '../services/settingsService';
import { playSpeech, stopSpeech } from '../services/ttsService';

const ACCEPTED = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_SIZE = 20 * 1024 * 1024;

const resizeForHistory = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 400 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

export const NotesScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState<'text' | 'summary' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settings = getSettings();

  const handleFile = (f: File) => {
    const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!accepted.includes(f.type)) { setError('Please upload a JPEG, PNG, WebP, or PDF file.'); return; }
    if (f.size > MAX_SIZE) { setError('File must be under 20 MB.'); return; }
    setFile(f); setResult(null); setError(null);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null); // PDF: no preview
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true); setError(null);
    try {
      const data = await scanNotes(file, settings.language);
      setResult(data);
      const thumb = preview ? await resizeForHistory(preview) : undefined;
      saveHistoryItem({ type: 'notes', title: file.name, data, imageUrl: thumb });
      if (settings.autoSpeak && settings.voiceEnabled) toggleSpeech(data.summary);
    } catch (err: any) {
      setError(err.message || 'Scan failed. Please try again.');
    } finally { setIsScanning(false); }
  };

  const toggleSpeech = async (text: string) => {
    if (isSpeaking) { stopSpeech(); setIsSpeaking(false); return; }
    setIsSpeaking(true);
    const ok = await playSpeech(text, settings.language);
    if (!ok) setIsSpeaking(false);
  };

  const copyText = async (type: 'text' | 'summary') => {
    if (!result) return;
    await navigator.clipboard.writeText(type === 'text' ? result.extractedText : result.summary);
    setCopied(type); setTimeout(() => setCopied(null), 2000);
  };

  const clearFile = () => {
    setFile(null); setPreview(null); setResult(null); setError(null);
    stopSpeech(); setIsSpeaking(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-800 text-slate-900 dark:text-white mb-1">Notes Scanner</h1>
        <p className="text-slate-500 dark:text-slate-400">Upload handwritten or printed notes to extract and summarise text with AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`glass-card rounded-3xl border-2 border-dashed transition-all ${
              dragOver ? 'border-[#6c47ff] bg-[#ede9ff]/20' : file ? 'border-[#6c47ff]/30 bg-[#ede9ff]/10' : 'border-slate-200 dark:border-slate-700 hover:border-[#6c47ff]/40'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            role="region"
            aria-label="File upload area"
          >
            <input
              ref={fileInputRef}
              type="file"
              id="notes-upload"
              className="hidden"
              accept={ACCEPTED}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              aria-label="Upload notes file"
            />
            <label htmlFor="notes-upload" className="flex flex-col items-center justify-center cursor-pointer py-10 px-6 text-center relative">
              {/* Remove button */}
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); clearFile(); }}
                  className="absolute top-3 right-3 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              )}

              {preview ? (
                <img src={preview} className="max-h-48 rounded-xl shadow-lg mb-4 object-contain" alt="Notes preview" />
              ) : file ? (
                <div className="w-16 h-16 bg-[#ede9ff] dark:bg-[#6c47ff]/20 text-[#6c47ff] rounded-2xl flex items-center justify-center mb-4">
                  <FileText size={28} />
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                  <Upload size={28} />
                </div>
              )}

              <p className="font-display font-700 text-slate-700 dark:text-slate-200 mb-1 text-sm">
                {file ? file.name : 'Click to upload or drag & drop'}
              </p>
              {file ? (
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB · {file.type.split('/')[1].toUpperCase()}</p>
              ) : (
                <p className="text-xs text-slate-400">JPEG, PNG, WebP, PDF · up to 20 MB</p>
              )}
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box flex items-start gap-2" role="alert">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Scan button */}
          <button
            onClick={handleScan}
            disabled={!file || isScanning}
            className="btn-primary w-full"
            aria-busy={isScanning}
          >
            {isScanning ? (
              <><RefreshCw size={18} className="animate-spin" /> Scanning Notes...</>
            ) : (
              <><Sparkles size={18} /> Start AI Scan</>
            )}
          </button>
        </div>

        {/* Right: Results */}
        <div>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                {/* Extracted text */}
                <div className="glass-card rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-700 text-slate-800 dark:text-white text-sm flex items-center gap-2">
                      <FileText size={16} className="text-[#6c47ff]" /> Extracted Text
                    </h3>
                    <button
                      onClick={() => copyText('text')}
                      className="p-1.5 text-slate-400 hover:text-[#6c47ff] hover:bg-[#ede9ff] dark:hover:bg-[#6c47ff]/10 rounded-lg transition-colors"
                      aria-label={copied === 'text' ? 'Copied!' : 'Copy extracted text'}
                    >
                      {copied === 'text' ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-h-44 overflow-y-auto border border-slate-100 dark:border-slate-700/50">
                    {result.extractedText || <span className="text-slate-400 italic">No text extracted.</span>}
                  </div>
                </div>

                {/* AI Summary */}
                <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-[#6c47ff] to-[#8b66ff] text-white border-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-700 text-sm flex items-center gap-2">
                      <Sparkles size={16} /> AI Summary
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {settings.voiceEnabled && (
                        <button
                          onClick={() => toggleSpeech(result.summary)}
                          className={`p-1.5 rounded-lg transition-colors ${isSpeaking ? 'bg-white text-[#6c47ff]' : 'bg-white/15 text-white hover:bg-white/25'}`}
                          aria-label={isSpeaking ? 'Stop voice' : 'Play voice summary'}
                          aria-pressed={isSpeaking}
                        >
                          {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                      )}
                      <button
                        onClick={() => copyText('summary')}
                        className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
                        aria-label={copied === 'summary' ? 'Copied!' : 'Copy summary'}
                      >
                        {copied === 'summary' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="text-indigo-50 text-xs leading-relaxed prose prose-invert max-w-none max-h-52 overflow-y-auto">
                    <ReactMarkdown>{result.summary}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-10 glass-card rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800"
              >
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-full flex items-center justify-center mb-4">
                  <Sparkles size={28} />
                </div>
                <h3 className="font-display font-700 text-slate-400 mb-1 text-sm">Results appear here</h3>
                <p className="text-slate-300 dark:text-slate-600 text-xs">Upload your study notes to get started</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
