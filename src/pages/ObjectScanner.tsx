import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CameraIcon, RefreshCw, Upload, Sparkles, CheckCircle2, Copy, Check, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { detectObject } from '../services/api';
import { DetectedObject } from '../types';
import { saveHistoryItem } from '../services/historyService';
import { getSettings } from '../services/settingsService';
import { playSpeech, stopSpeech } from '../services/ttsService';

export const ObjectScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const settings = getSettings();

  const startCamera = async () => {
    console.log("Attempting to start camera with facingMode:", facingMode);
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      console.log("Camera stream obtained:", s.id);
      setStream(s);
      setIsCameraOpen(true);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera access was denied. Please enable camera permissions in your browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Please check your connection and permissions.");
      }
    }
  };

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      console.log("Attaching stream to video element");
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    }
  }, [facingMode]);

  const captureImage = () => {
    console.log("Attempting to capture image...");
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error("Video dimensions are 0. Cannot capture.");
        setCameraError("Camera is not ready. Please wait a moment and try again.");
        return;
      }

      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          console.log("Image captured successfully, dataUrl length:", dataUrl.length);
          setCapturedImage(dataUrl);
          stopCamera();
        } catch (err) {
          console.error("Error creating data URL:", err);
          setCameraError("Failed to capture image. Please try again.");
        }
      }
    } else {
      console.error("Video or canvas ref is missing:", { video: !!videoRef.current, canvas: !!canvasRef.current });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Convert dataURL to File
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      
      const data = await detectObject(file, settings.language);
      if (!data || (!data.name && !data.explanation)) {
        throw new Error("AI could not identify the object. Please try a different angle.");
      }
      setResult(data);

      // Save to history with resized image to save space
      const historyImage = await resizeImageForHistory(capturedImage);
      saveHistoryItem({
        type: 'object',
        title: data.name || "Unknown Object",
        data: data,
        imageUrl: historyImage
      });

      // Auto-speak if enabled
      if (settings.autoSpeak && settings.voiceEnabled) {
        handleToggleSpeech(data.explanation);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(`${result.name}\n\n${result.explanation}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const reset = () => {
    stopSpeech();
    setIsSpeaking(false);
    setCapturedImage(null);
    setResult(null);
    startCamera();
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
    <div className="max-w-4xl mx-auto py-6 px-4 md:py-12 md:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Object Scanner</h2>
        <p className="text-slate-500">Point your camera at any object to learn more about it.</p>
      </div>

      <div className="rounded-[2.5rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative aspect-video flex items-center justify-center">
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 z-10">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
              <CameraIcon size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
            <p className="text-slate-400 mb-6 max-w-sm">{cameraError}</p>
            <button 
              onClick={startCamera}
              className="px-6 py-2 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!isCameraOpen && !capturedImage && !cameraError && (
          <button 
            onClick={startCamera}
            className="flex flex-col items-center gap-4 text-white group"
          >
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-300">
              <CameraIcon size={32} />
            </div>
            <span className="font-bold text-lg tracking-tight">Open Camera</span>
          </button>
        )}

        {isCameraOpen && (
          <div className="relative w-full h-full">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8">
              <button 
                onClick={toggleCamera}
                className="w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                title="Flip Camera"
              >
                <RotateCcw size={24} />
              </button>
              
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={captureImage}
                  className="w-16 h-16 bg-white rounded-full border-4 border-indigo-600 flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                />
                <span className="text-white font-bold text-xs bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                  Tap to Capture
                </span>
              </div>

              <div className="w-12 h-12" /> {/* Spacer for balance */}
            </div>
          </div>
        )}

        {capturedImage && !result && (
          <div className="relative w-full h-full">
            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <RefreshCw className="text-white animate-spin" size={48} />
                <p className="text-white font-bold text-lg">AI is analyzing object...</p>
                <p className="text-white/70 text-sm text-center px-4">This usually takes 3-5 seconds depending on connection</p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                <p className="text-slate-300 mb-6 max-w-sm">{error}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={handleAnalyze}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={reset}
                    className="px-6 py-2 bg-white/10 text-white border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors"
                  >
                    Retake
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="relative w-full h-full">
            <img src={capturedImage!} className="w-full h-full object-cover opacity-50" alt="Result" />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-lg shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{result.name}</h3>
                      <p className="text-sm text-slate-400">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.voiceEnabled && (
                      <button 
                        onClick={() => handleToggleSpeech(result.explanation)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-xs ${
                          isSpeaking 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <span>{isSpeaking ? 'Stop' : 'Play Voice'}</span>
                      </button>
                    )}
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <div className="text-slate-600 leading-relaxed mb-6 prose prose-slate text-sm">
                  <ReactMarkdown>{result.explanation}</ReactMarkdown>
                </div>
                <button 
                  onClick={reset}
                  className="w-full py-3 bg-slate-100 text-slate-800 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Scan Another Object
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Below Preview */}
      <AnimatePresence>
        {capturedImage && !result && !isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-10 flex flex-col items-center gap-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-1">Image Captured!</h3>
              <p className="text-slate-500">Ready to identify this object with AI</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button 
                onClick={handleAnalyze}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-500/25"
              >
                <Sparkles size={24} /> Analyze Object
              </button>
              <button 
                onClick={reset}
                className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Retake Photo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
