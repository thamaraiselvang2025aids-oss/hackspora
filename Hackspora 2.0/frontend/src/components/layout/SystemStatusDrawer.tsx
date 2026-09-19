import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Cpu, Wifi, MapPin, Eye, Mic, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

interface SystemStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cameraActive: boolean;
  micActive: boolean;
  wsConnected: boolean;
  isDemoMode: boolean;
}

export const SystemStatusDrawer: React.FC<SystemStatusDrawerProps> = ({
  isOpen,
  onClose,
  cameraActive,
  micActive,
  wsConnected,
  isDemoMode
}) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSystemHealth();
      setHealthData(data);
    } catch (e) {
      console.warn('Health fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md h-full bg-surface border-l border-surface-border shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-accent-light" />
              <h2 className="text-lg font-bold text-slate-100">System Telemetry</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close status drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Operational Environment Indicator */}
          <div className="my-4 p-3 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-mono">EXECUTION MODE</p>
              <p className="text-sm font-bold text-slate-100">
                {isDemoMode ? 'Deterministic Demo Mode' : 'Live Physical Sensors'}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold ${
                isDemoMode ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {isDemoMode ? 'SIMULATED' : 'LIVE'}
            </span>
          </div>

          {/* Sensors & Telemetry Grid */}
          <div className="space-y-3 mt-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Perception Health</h3>

            {/* Camera */}
            <div className="p-3 rounded-lg bg-surface-card/60 border border-surface-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Camera Feed (Webcam)</p>
                  <p className="text-[11px] text-slate-400">getUserMedia 640x480</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-mono">
                {cameraActive ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Streaming
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Standby
                  </span>
                )}
              </div>
            </div>

            {/* Microphone */}
            <div className="p-3 rounded-lg bg-surface-card/60 border border-surface-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mic className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Microphone / VAD</p>
                  <p className="text-[11px] text-slate-400">Web Audio Analyser FFT</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-mono">
                {micActive ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Listening
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Standby
                  </span>
                )}
              </div>
            </div>

            {/* WebSocket */}
            <div className="p-3 rounded-lg bg-surface-card/60 border border-surface-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Real-time WebSocket Hub</p>
                  <p className="text-[11px] text-slate-400">/ws/emergency & /ws/world-state</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-mono">
                {wsConnected ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Connecting
                  </span>
                )}
              </div>
            </div>

            {/* Backend AI Engines */}
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider pt-3">AI Engine Status</h3>
            {healthData?.services ? (
              Object.entries(healthData.services).map(([key, val]) => (
                <div key={key} className="p-2.5 rounded-lg bg-surface-card/40 border border-surface-border text-xs flex justify-between items-center">
                  <span className="font-mono text-slate-300 capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-mono text-accent-light text-[11px]">{String(val)}</span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-surface-card/30 text-xs text-slate-400 text-center">
                Fetching backend services...
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-between">
          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center space-x-2 text-xs text-accent-light hover:underline font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono">v2.0.0-PROTOTYPE</span>
        </div>
      </div>
    </div>
  );
};
