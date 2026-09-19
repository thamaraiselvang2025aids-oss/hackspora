import React from 'react';
import { Eye, Ear, MessageSquare, AlertTriangle, Activity, Sparkles, Radio } from 'lucide-react';
import { AppMode } from '../../types';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenStatusDrawer: () => void;
  onTriggerSos: () => void;
  hasActiveEmergency: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenStatusDrawer,
  onTriggerSos,
  hasActiveEmergency
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-background/80 backdrop-blur-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => onSelectMode('dashboard')}
          className="flex items-center space-x-3 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg p-1"
          aria-label="OBSERVA Home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-teal-900/40 border border-accent/40 flex items-center justify-center shadow-lg shadow-accent/10 group-hover:border-accent transition-colors">
            <Eye className="w-5 h-5 text-accent-light" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-slate-900 font-sans">
                OBSERVA
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multimodal Accessibility OS
            </p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 p-1 rounded-xl bg-surface/80 border border-surface-border" aria-label="Mode selector">
          <button
            onClick={() => onSelectMode('blind')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentMode === 'blind'
                ? 'bg-accent text-background shadow-md shadow-accent/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Blind Mode</span>
          </button>

          <button
            onClick={() => onSelectMode('deaf')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentMode === 'deaf'
                ? 'bg-accent text-background shadow-md shadow-accent/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Ear className="w-4 h-4" />
            <span>Deaf Mode</span>
          </button>

          <button
            onClick={() => onSelectMode('nonverbal')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentMode === 'nonverbal'
                ? 'bg-accent text-background shadow-md shadow-accent/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Communicate</span>
          </button>

          <button
            onClick={() => onSelectMode('emergency-receiver')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentMode === 'emergency-receiver'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Receiver View</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* System Telemetry Drawer Button */}
          <button
            onClick={onOpenStatusDrawer}
            className="p-2 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="System Telemetry & Health"
            aria-label="Open System Status"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* SOS Floating Action */}
          <button
            onClick={onTriggerSos}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
              hasActiveEmergency
                ? 'bg-danger animate-pulse-subtle text-white shadow-danger/40 border border-red-400'
                : 'bg-danger/90 hover:bg-danger text-white shadow-danger/20 border border-danger-light/30'
            }`}
            aria-label="Trigger Silent SOS Emergency"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
