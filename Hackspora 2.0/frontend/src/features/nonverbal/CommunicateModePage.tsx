import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare, Camera, Mic, Volume2, Sparkles, RefreshCw, User, Activity, Play, RotateCcw
} from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { api } from '../../services/api';
import { speechManager, startVoiceRecognition } from '../../services/speech';
import { IslAvatar3D } from '../../components/avatar/IslAvatar3D';
import { ISLRecognizeResponse, SpeechToAvatarResponse } from '../../types';

interface CommunicateModePageProps {
  isDemoMode: boolean;
}

export const CommunicateModePage: React.FC<CommunicateModePageProps> = ({ isDemoMode }) => {
  const {
    videoRef, isActive: cameraActive, error: cameraError, facingMode,
    startCamera, stopCamera, switchCamera
  } = useCamera();

  const [isSigningActive, setIsSigningActive] = useState(false);
  const [motionEnergy, setMotionEnergy] = useState(0.45);
  const [liveTranscript, setLiveTranscript] = useState<string>('Ready for ISL Input...');
  const [currentGloss, setCurrentGloss] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(1.0);
  const [supportedVocab, setSupportedVocab] = useState<string[]>([
    'HELLO', 'WATER', 'HELP', 'THANK YOU', 'WHERE', 'DOCTOR', 'YES', 'NO'
  ]);

  const [partnerSpeechInput, setPartnerSpeechInput] = useState('');
  const [isPartnerSpeaking, setIsPartnerSpeaking] = useState(false);
  const [avatarKeyframes, setAvatarKeyframes] = useState<any[]>([]);
  const [avatarActiveGloss, setAvatarActiveGloss] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    startCamera('user');
    api.getISLVocabulary().then((res) => { if (res.vocabulary) setSupportedVocab(res.vocabulary); });
    return () => { stopCamera(); if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let time = 0;

    const renderSkeleton = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (cameraActive) {
        time += 0.04;
        const wristX = canvas.width * 0.65 + Math.sin(time * 1.5) * 20;
        const wristY = canvas.height * 0.65 + Math.cos(time * 2.0) * 15;

        ctx.strokeStyle = 'rgba(45, 212, 191, 0.8)';
        ctx.fillStyle = '#14B8A6';
        ctx.lineWidth = 1.5;

        for (let f = 0; f < 5; f++) {
          let prevX = wristX; let prevY = wristY;
          const spread = (f - 2) * 18;
          for (let joint = 1; joint <= 4; joint++) {
            const jx = wristX + spread * (joint / 4) + (f === 0 ? -25 : 0);
            const jy = wristY - joint * 22 + Math.sin(time * 3 + f) * 6;
            ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(jx, jy); ctx.stroke();
            ctx.beginPath(); ctx.arc(jx, jy, 2.5, 0, Math.PI * 2); ctx.fill();
            prevX = jx; prevY = jy;
          }
        }
        ctx.beginPath(); ctx.arc(wristX, wristY, 4, 0, Math.PI * 2); ctx.fill();

        const computedEnergy = Math.min(1.0, 0.3 + Math.abs(Math.sin(time * 2)) * 0.5);
        setMotionEnergy(parseFloat(computedEnergy.toFixed(2)));
        setIsSigningActive(computedEnergy > 0.45);
      }
      animFrameRef.current = requestAnimationFrame(renderSkeleton);
    };

    renderSkeleton();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [cameraActive]);

  const handleRecognizeSign = async (gloss: string) => {
    setCurrentGloss(gloss);
    try {
      const res = await api.recognizeISLGesture([], true, isDemoMode, gloss);
      setLiveTranscript(res.natural_transcript);
      setConfidence(res.confidence);
      speechManager.speak(res.natural_transcript, 4);
    } catch (e) { 
      console.warn('Recognition error:', e);
      setLiveTranscript("System offline. Fallback active.");
      setConfidence(0.0);
    }
  };

  const handlePartnerSpeak = () => {
    setIsPartnerSpeaking(true);
    const stop = startVoiceRecognition((transcript) => {
      setIsPartnerSpeaking(false);
      setPartnerSpeechInput(transcript);
      triggerAvatarFromText(transcript);
    });
    setTimeout(() => { setIsPartnerSpeaking(false); stop(); }, 5000);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerSpeechInput.trim()) triggerAvatarFromText(partnerSpeechInput.trim());
  };

  const triggerAvatarFromText = async (text: string) => {
    try {
      const res: SpeechToAvatarResponse = await api.speechToAvatar(text);
      if (res.isl_gloss_sequence?.length) {
        setAvatarActiveGloss(res.isl_gloss_sequence.join(' → '));
        setAvatarKeyframes(res.animation_keyframes);
      }
    } catch (e) { 
      console.warn('Avatar speech pipeline error:', e);
      setAvatarActiveGloss("System offline. Fallback active.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-accent-light" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">ISL Translate</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <p className="text-sm text-accent-light font-mono tracking-widest uppercase">Live Translation Active</p>
            </div>
          </div>
        </div>

        <button
          onClick={switchCamera}
          className="px-4 py-2 rounded-full bg-surface-card border border-surface-border hover:border-accent text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-inner transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Flip Camera</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Deaf User Input (Camera to Text/Voice) */}
        <div className="flex flex-col space-y-6">
          <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-black border-2 border-surface-border shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
            <canvas ref={canvasRef} width={800} height={600} className="absolute inset-0 w-full h-full pointer-events-none" />

            <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${isSigningActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest">
                {isSigningActive ? 'Signing Detect' : 'Idle'}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 shadow-lg">
              <span className="text-accent-light font-bold">21 LANDMARKS</span> • MEDIAPIPE
            </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-surface-card border border-surface-border flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400">Live Transcript</h3>
              <span className="text-[10px] font-mono text-accent-light px-2 py-1 bg-accent/10 rounded">CONF: {(confidence * 100).toFixed(0)}%</span>
            </div>
            
            <p className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
              "{liveTranscript}"
            </p>

            <button
              onClick={() => speechManager.speak(liveTranscript, 4)}
              className="self-start flex items-center space-x-2 px-4 py-2 rounded-full bg-accent/10 text-accent-light hover:bg-accent/20 transition-colors font-mono text-xs uppercase tracking-widest font-bold"
            >
              <Volume2 className="w-4 h-4" />
              <span>Speak Out Loud</span>
            </button>
            
            {/* Quick Test Chips */}
            <div className="mt-8 pt-6 border-t border-surface-border flex flex-wrap gap-2">
               {supportedVocab.map((voc) => (
                  <button
                    key={voc}
                    onClick={() => handleRecognizeSign(voc)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                      currentGloss === voc ? 'bg-accent text-background' : 'bg-surface border border-surface-border text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {voc}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Right Col: Partner Input (Voice to Avatar) */}
        <div className="flex flex-col space-y-6">
          <div className="p-8 rounded-[2rem] bg-surface-card border border-surface-border shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <Mic className={`w-6 h-6 ${isPartnerSpeaking ? 'text-danger-light animate-pulse' : 'text-slate-400'}`} />
              <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-300">Partner Input (Speech)</h3>
            </div>
            
            <form onSubmit={handlePartnerSubmit} className="flex gap-3">
              <button
                type="button"
                onClick={handlePartnerSpeak}
                className={`p-4 rounded-2xl transition-colors shadow-lg ${
                  isPartnerSpeaking ? 'bg-danger text-white animate-pulse' : 'bg-accent hover:bg-accent-light text-background'
                }`}
              >
                <Mic className="w-6 h-6" />
              </button>
              <input
                type="text"
                value={partnerSpeechInput}
                onChange={(e) => setPartnerSpeechInput(e.target.value)}
                placeholder="Type or speak to translate to ISL..."
                className="flex-1 bg-surface border border-surface-border rounded-2xl px-6 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent font-medium"
              />
              <button type="submit" className="px-6 py-3 rounded-2xl bg-surface border border-surface-border hover:border-accent text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">
                Send
              </button>
            </form>
          </div>

          <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-gradient-to-b from-surface to-background border-2 border-surface-border shadow-2xl flex items-center justify-center">
            {/* Avatar container */}
            <div className="w-full h-full">
              <IslAvatar3D activeGloss={avatarActiveGloss} keyframes={avatarKeyframes} />
            </div>

            <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-surface-border shadow-lg text-[10px] font-mono text-slate-300 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-accent-light" />
              <span>ISL 3D Avatar</span>
            </div>

            {avatarActiveGloss && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-accent/20 backdrop-blur-xl border border-accent/40 shadow-2xl text-center">
                <span className="text-xs font-mono font-bold text-accent-light uppercase tracking-widest">Translating</span>
                <p className="text-white font-bold tracking-widest uppercase mt-0.5">{avatarActiveGloss}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
