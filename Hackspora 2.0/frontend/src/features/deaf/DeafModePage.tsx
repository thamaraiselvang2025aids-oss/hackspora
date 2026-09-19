import React, { useEffect, useState, useRef } from 'react';
import {
  Ear, AlertTriangle, Flame, Siren, Activity, Radio, Sparkles, XCircle, Vibrate
} from 'lucide-react';
import { useMicrophone } from '../../hooks/useMicrophone';
import { api } from '../../services/api';
import { soundEffects } from '../../services/audioPlayer';
import { SoundEvent, AudioClassifyResponse } from '../../types';

interface DeafModePageProps {
  isDemoMode: boolean;
}

export const DeafModePage: React.FC<DeafModePageProps> = ({ isDemoMode }) => {
  const { isListening, decibels, error: micError, startMicrophone, stopMicrophone } = useMicrophone();
  const [activeAlert, setActiveAlert] = useState<SoundEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<SoundEvent[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    startMicrophone();
    return () => {
      stopMicrophone();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [startMicrophone, stopMicrophone]);

  useEffect(() => {
    const checkAcousticEnvironment = async () => {
      try {
        const res: AudioClassifyResponse = await api.classifyAudio(undefined, decibels, isDemoMode, undefined);
        if (res.active_alert) {
          triggerSoundAlert(res.active_alert);
        }
      } catch (err) {
        console.warn('Acoustic polling error:', err);
        triggerSoundAlert({
          id: 'error-fallback',
          label: 'System Offline',
          confidence: 0,
          direction: 'OMNIDIRECTIONAL',
          priority: 'HIGH',
          timestamp: Date.now() / 1000,
          is_emergency: false,
          action_prompt: 'Acoustic detection API is unavailable.'
        });
      }
    };
    pollIntervalRef.current = setInterval(checkAcousticEnvironment, 2500);
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [decibels, isDemoMode]);

  const triggerSoundAlert = (alert: SoundEvent) => {
    setActiveAlert(alert);
    setRecentEvents((prev) => [alert, ...prev.filter((e) => e.id !== alert.id)].slice(0, 8));

    setIsFlashing(true);
    soundEffects.triggerHaptic([300, 150, 300, 150, 400]);
    if (alert.is_emergency) soundEffects.playEmergencySiren();

    setTimeout(() => setIsFlashing(false), 800);
  };

  const handleManualSimulate = async (soundType: string) => {
    try {
      const res = await api.classifyAudio(undefined, 85, true, soundType);
      if (res.active_alert) triggerSoundAlert(res.active_alert);
    } catch (e) {
      console.warn('Simulation error:', e);
    }
  };

  const handleAcknowledgeAlert = () => setActiveAlert(null);

  // Smooth Organic Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const height = canvas.height;
      const width = canvas.width;
      const centerY = height / 2;
      const amplitude = Math.min(height * 0.45, (decibels - 30) * 1.8);

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = decibels > 75 ? '#F43F5E' : '#14B8A6';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let x = 0; x < width; x += 5) {
        const y = centerY + Math.sin(x * 0.02 + phase) * amplitude * Math.sin((x / width) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += 0.1;
      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [decibels]);

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 space-y-8 transition-colors duration-300 ${isFlashing ? 'bg-danger/20' : ''}`}>
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Ear className="w-6 h-6 text-accent-light" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Sound Awareness</h1>
            <p className="text-sm text-slate-400 font-mono tracking-widest mt-1">CONTINUOUS MONITORING</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-full bg-surface-card border border-surface-border flex items-center space-x-2 shadow-inner">
            <Radio className={`w-4 h-4 ${decibels > 70 ? 'text-danger-light animate-pulse' : 'text-accent-light'}`} />
            <span className="text-sm font-mono font-bold text-white">{decibels} dB</span>
          </div>
        </div>
      </div>

      {/* Dominant Active Alert */}
      {activeAlert && (
        <div className="w-full p-8 sm:p-12 rounded-[2rem] bg-danger/20 border-2 border-danger shadow-[0_0_80px_rgba(244,63,94,0.3)] animate-pulse-subtle flex flex-col items-center text-center space-y-8 backdrop-blur-md">
          <div className="w-24 h-24 rounded-full bg-danger text-white flex items-center justify-center animate-bounce shadow-2xl shadow-danger/50">
            {activeAlert.label.includes('Smoke') ? <Flame className="w-12 h-12" /> :
             activeAlert.label.includes('Siren') ? <Siren className="w-12 h-12" /> :
             <AlertTriangle className="w-12 h-12" />}
          </div>
          
          <div>
            <div className="inline-flex items-center space-x-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold font-mono tracking-widest uppercase">
                CRITICAL ALERT
              </span>
              <span className="px-3 py-1 rounded-full border border-danger/50 text-danger-light text-xs font-bold font-mono tracking-widest uppercase">
                {activeAlert.direction}
              </span>
            </div>
            <h2 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tighter uppercase leading-none">
              {activeAlert.label}
            </h2>
            <p className="text-xl sm:text-2xl text-slate-200 mt-6 font-medium">
              {activeAlert.action_prompt}
            </p>
          </div>

          <button
            onClick={handleAcknowledgeAlert}
            className="mt-4 px-10 py-5 rounded-full bg-white text-background font-extrabold text-lg uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-2xl"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      )}

      {/* Analytics Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${activeAlert ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Waveform & Simulator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-[2rem] bg-surface-card border border-surface-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent-light" />
                Live Acoustic Oscilloscope
              </h3>
            </div>
            
            <div className="relative w-full h-56 rounded-2xl bg-[#070B14] border border-white/5 overflow-hidden flex items-center justify-center shadow-inner">
              <canvas ref={canvasRef} width={800} height={224} className="w-full h-full opacity-90" />
            </div>

            <div className="mt-8">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">Simulate Events</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'smoke_alarm', label: 'Smoke Alarm' },
                  { key: 'siren', label: 'Siren' },
                  { key: 'horn', label: 'Car Horn' },
                  { key: 'doorbell', label: 'Doorbell' },
                  { key: 'knock', label: 'Knock' },
                  { key: 'glass_break', label: 'Glass Break' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleManualSimulate(item.key)}
                    className="py-3 px-4 rounded-xl bg-surface border border-surface-border hover:border-accent hover:bg-accent/5 text-sm font-semibold text-slate-300 transition-all text-center"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* History Log */}
        <div className="p-8 rounded-[2rem] bg-surface-card border border-surface-border flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Event Log</h3>
            <span className="text-xs font-mono text-slate-500">HISTORY</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {recentEvents.length > 0 ? (
              recentEvents.map((ev) => (
                <div key={ev.id} className="p-4 rounded-xl bg-surface/50 border border-surface-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-white">{ev.label}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                      ev.priority === 'CRITICAL' ? 'bg-danger/20 text-danger-light' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {ev.priority}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">Dir: {ev.direction}</p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <span className="text-sm">Listening to environment...</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
