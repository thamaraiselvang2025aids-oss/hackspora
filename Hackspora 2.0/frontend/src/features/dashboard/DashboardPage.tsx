import React, { useEffect, useState } from 'react';
import { Eye, Ear, MessageSquare, AlertTriangle, Shield, Clock, Sparkles, Activity } from 'lucide-react';
import { AppMode, ActivityEvent } from '../../types';
import { api } from '../../services/api';

interface DashboardPageProps {
  onSelectMode: (mode: AppMode) => void;
  onTriggerSos: () => void;
  onQuickSearch: () => void;
  isDemoMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectMode,
  onTriggerSos,
  onQuickSearch,
  isDemoMode
}) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    api.getRecentActivity().then(data => setActivities(data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="relative text-center py-16 sm:py-24 space-y-6">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-xs font-mono font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          <span>OBSERVA OS 2.0</span>
        </div>

        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tighter text-white font-sans leading-[1.1]">
          See what matters. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-accent-light">
            Know where it is.
          </span>
        </h1>
        
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Next-generation multimodal accessibility. Spatial vision, acoustic hazard detection, and non-verbal ISL translation in one unified system.
        </p>

        {/* Subtle Background Glow */}
        <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* Core Assistive Modes (Heroic Layout) */}
      <section className="space-y-6">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 text-center mb-8">
          Select Primary Assistive Mode
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mode 1: Blind */}
          <button
            onClick={() => onSelectMode('blind')}
            className="group relative flex flex-col items-center text-center p-8 rounded-3xl bg-surface-card hover:bg-surface border border-surface-border hover:border-accent/50 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-950/40 text-accent-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Eye className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent-light transition-colors">
              Spatial Vision
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Live camera object detection, spatial path guidance, and voice search for physical items.
            </p>
          </button>

          {/* Mode 2: Deaf */}
          <button
            onClick={() => onSelectMode('deaf')}
            className="group relative flex flex-col items-center text-center p-8 rounded-3xl bg-surface-card hover:bg-surface border border-surface-border hover:border-accent/50 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-950/40 text-accent-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Ear className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent-light transition-colors">
              Sound Awareness
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Continuous acoustic monitoring for hazards like smoke alarms, sirens, and knocks.
            </p>
          </button>

          {/* Mode 3: Non-Verbal */}
          <button
            onClick={() => onSelectMode('nonverbal')}
            className="group relative flex flex-col items-center text-center p-8 rounded-3xl bg-surface-card hover:bg-surface border border-surface-border hover:border-accent/50 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-950/40 text-accent-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent-light transition-colors">
              ISL Translate
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Two-way communication using hand landmarks and an interactive 3D sign language avatar.
            </p>
          </button>
        </div>
      </section>

      {/* Bottom Grid: Emergency Access & Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-surface-border/50">
        {/* Emergency Trigger */}
        <div className="p-8 rounded-3xl bg-surface-card border border-surface-border flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-danger/10 text-danger-light flex items-center justify-center animate-pulse-subtle">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Emergency Protocol</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Instantly broadcast a silent SOS with GPS coordinates to your trusted contacts and dispatchers.
            </p>
          </div>
          
          <button
            onClick={onTriggerSos}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-danger hover:bg-danger-light text-white font-bold text-sm uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-danger/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            Trigger SOS Alert
          </button>

          <button
            onClick={() => onSelectMode('emergency-receiver')}
            className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            Open Dispatcher View →
          </button>
        </div>

        {/* Activity Feed */}
        <div className="p-8 rounded-3xl bg-surface-card border border-surface-border flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-light" />
              System Telemetry
            </h3>
            <span className="text-xs font-mono text-slate-500">LIVE FEED</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-surface/50 border border-surface-border/50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        act.mode === 'BLIND' ? 'bg-teal-400' :
                        act.mode === 'DEAF' ? 'bg-amber-400' :
                        act.mode === 'COMMUNICATE' ? 'bg-blue-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-sm text-slate-300 font-medium">{act.description}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{act.created_at}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Clock className="w-6 h-6 opacity-50" />
                <span className="text-sm">No recent activity.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

