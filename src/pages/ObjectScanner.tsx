import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera as CameraIcon, RefreshCw, Upload, Sparkles, CheckCircle2,
  Copy, Check, RotateCcw, Volume2, VolumeX, AlertCircle, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { detectObject } from '../services/api';
import { DetectedObject } from '../types';
import { saveHistoryItem } from '../services/historyService';
import { getSettings } from '../services/settingsService';
import { playSpeech, stopSpeech } from '../services/ttsService';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

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

export const ObjectScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectedObject | null>(null);
  const [copied, setCopied] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const settings = getSettings();

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOpen(false);
  }, [stream]);

  const startCamera = useCallback(async (mode?: 'environment' | 'user') => {
    const fm = mode ?? facingMode;
    setCameraError(null);
    try {
      stream?.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: fm, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(s);
      setIsCameraOpen(true);
    } catch (err: any) {
      const n = err?.name || '';
      if (n === 'NotAllowedError' || n === 'PermissionDeniedError')
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      else if (n === 'NotFoundError' || n === 'DevicesNotFoundError')
        setCameraError('No camera detected. You can upload an image instead.');
      else
        setCameraError('Could not start camera. Try uploading an image.');
    }
  }, [facingMode, stream]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current)
      videoRef.current.srcObject = stream;
  }, [isCameraOpen, stream]);

  useEffect(() => () => { stopCamera(); stopSpeech(); }, []);

  const toggleFacing = () => {
    const next: 'environment' | 'user' = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (isCameraOpen) startCamera(next);
  };

  const captureImage = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || v.videoWidth === 0) { setCameraError('Camera not ready. Wait a moment.'); return; }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    ctx.drawImage(v, 0, 0);
    setCapturedImage(c.toDataURL('image/jpeg', 0.85));
    stopCamera(); setResult(null); setError(null);
  };

  const handleFile = (file: File) => {
    if (!ACCEPTED.includes(file.type)) { setError('Please upload a JPEG, PNG, or WebP image.'); return; }
    if (file.size > MAX_SIZE) { setError('Image must be under 10 MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      setResult(null); setError(null); stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true); setError(null);
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      const data = await detectObject(file, settings.language);
      setResult(data);
      const thumb = await resizeForHistory(capturedImage);
      saveHistoryItem({ type: 'object', title: data.name, data, imageUrl: thumb });
      if (settings.autoSpeak && settings.voiceEnabled) toggleSpeech(data.explanation);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally { setIsAnalyzing(false); }
  };

  const toggleSpeech = async (text: string) => {
    if (isSpeaking) { stopSpeech(); setIsSpeaking(false); return; }
    setIsSpeaking(true);
    const ok = await playSpeech(text, settings.language);
    if (!ok) setIsSpeaking(false);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.name}\n\n${result.explanation}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    stopSpeech(); setIsSpeaking(false);
    setCapturedImage(null); setResult(null); setError(null);
    startCamera();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-800 text-slate-900 dark:text-white mb-1">Object Scanner</h1>
        <p className="text-slate-500 dark:text-slate-400">Point your camera or upload a photo to identify objects with AI.</p>
      </div>

      {/* Main viewfinder */}
      <div
        className={`rounded-[2rem] overflow-hidden bg-slate-900 shadow-2xl relative aspect-video flex items-center justify-center border-2 transition-colors ${
          dragOver ? 'border-[#6c47ff]' : 'border-slate-800'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        role="region"
        aria-label="Camera viewfinder"
      >
        {/* Idle */}
        {!isCameraOpen && !capturedImage && !cameraError && (
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="flex gap-6 sm:gap-10">
              <button onClick={() => startCamera()} className="flex flex-col items-center gap-3 group" aria-label="Open camera">
                <div className="w-16 h-16 bg-[#6c47ff] rounded-2xl flex items-center justify-center shadow-xl shadow-[#6c47ff]/40 group-hover:scale-110 transition-transform">
                  <CameraIcon size={28} className="text-white" />
                </div>
                <span className="text-white/70 text-sm font-semibold">Camera</span>
              </button>
              <div className="w-px bg-white/10" />
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 group" aria-label="Upload image">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Upload size={28} className="text-white/70" />
                </div>
                <span className="text-white/70 text-sm font-semibold">Upload</span>
              </button>
            </div>
            <p className="text-white/25 text-xs">or drag & drop an image</p>
          </div>
        )}

        {/* Camera error */}
        {cameraError && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 z-10">
            <AlertCircle className="text-red-400 mb-4" size={36} />
            <h3 className="font-display font-700 text-white mb-2">Camera Unavailable</h3>
            <p className="text-slate-400 text-sm mb-5 max-w-xs">{cameraError}</p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={() => startCamera()} className="btn-primary text-sm">Retry Camera</button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-sm">Upload Image</button>
            </div>
          </div>
        )}

        {/* Live video */}
        {isCameraOpen && (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" aria-label="Camera preview" />
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6">
              <button onClick={toggleFacing} className="w-11 h-11 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm" aria-label="Flip camera">
                <RotateCcw size={20} />
              </button>
              <button onClick={captureImage} className="w-16 h-16 bg-white rounded-full border-4 border-[#6c47ff] shadow-2xl hover:scale-105 active:scale-95 transition-transform" aria-label="Capture photo" />
              <button onClick={stopCamera} className="w-11 h-11 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm" aria-label="Close camera">
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Captured image + states */}
        {capturedImage && (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              className={`w-full h-full object-cover transition-opacity ${result ? 'opacity-30' : isAnalyzing ? 'opacity-50' : 'opacity-100'}`}
              alt="Photo for analysis"
            />

            {/* Analyzing */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
                <RefreshCw className="text-white animate-spin" size={36} />
                <p className="text-white font-display font-700">Analyzing with AI...</p>
                <p className="text-white/50 text-sm">Usually takes 3–5 seconds</p>
              </div>
            )}

            {/* Error */}
            {error && !isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center" role="alert">
                <AlertCircle className="text-red-400 mb-3" size={36} />
                <h3 className="font-display font-700 text-white mb-2">Analysis Failed</h3>
                <p className="text-slate-300 text-sm mb-5 max-w-sm">{error}</p>
                <div className="flex gap-3">
                  <button onClick={handleAnalyze} className="btn-primary text-sm">Retry</button>
                  <button onClick={reset} className="btn-secondary text-sm">Retake</button>
                </div>
              </div>
            )}

            {/* Result card */}
            {result && (
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-[#1a1a1f] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl max-h-[90%] overflow-y-auto"
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h2 className="font-display font-800 text-slate-900 dark:text-white text-xl">{result.name}</h2>
                        <p className="text-xs text-slate-400">{(result.confidence * 100).toFixed(1)}% confidence</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {settings.voiceEnabled && (
                        <button
                          onClick={() => toggleSpeech(result.explanation)}
                          className={`p-2 rounded-xl transition-all ${isSpeaking ? 'bg-[#6c47ff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#6c47ff]'}`}
                          aria-label={isSpeaking ? 'Stop voice' : 'Play voice'}
                          aria-pressed={isSpeaking}
                        >
                          {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        </button>
                      )}
                      <button onClick={copyResult} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#6c47ff] transition-colors" aria-label="Copy">
                        {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed prose dark:prose-invert max-w-none mb-5">
                    <ReactMarkdown>{result.explanation}</ReactMarkdown>
                  </div>
                  <button onClick={reset} className="btn-secondary w-full text-sm">Scan Another Object</button>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {dragOver && (
          <div className="absolute inset-0 bg-[#6c47ff]/20 border-2 border-[#6c47ff] rounded-[2rem] flex items-center justify-center pointer-events-none">
            <p className="text-white font-display font-700 text-lg">Drop image here</p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <AnimatePresence>
        {capturedImage && !result && !isAnalyzing && !error && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleAnalyze} className="btn-primary flex-1 sm:flex-none sm:min-w-[200px]">
              <Sparkles size={18} /> Analyze with AI
            </button>
            <button onClick={reset} className="btn-secondary">Retake / Change</button>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} aria-label="Upload image" />
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
};
