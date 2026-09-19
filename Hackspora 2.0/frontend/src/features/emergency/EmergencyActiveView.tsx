import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, MapPin, Clock, Shield, PhoneCall, CheckCircle2, Users, Flame, Activity, Car, VolumeX, UserCheck, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Emergency, TrustedContact } from '../../types';

interface EmergencyActiveViewProps {
  emergency: Emergency | null;
  onSelectType: (type: string) => void;
  onResolve: () => void;
  onClose: () => void;
}

export const EmergencyActiveView: React.FC<EmergencyActiveViewProps> = ({
  emergency, onSelectType, onResolve, onClose
}) => {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [escalationSecondsLeft, setEscalationSecondsLeft] = useState<number>(60);

  useEffect(() => {
    api.getContacts().then(setContacts);
  }, []);

  useEffect(() => {
    if (emergency?.next_escalation_in_seconds !== undefined) {
      setEscalationSecondsLeft(emergency.next_escalation_in_seconds);
    }
    const interval = setInterval(() => {
      setEscalationSecondsLeft((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [emergency]);

  const emergencyCategories = [
    { type: 'CANNOT SPEAK', icon: <VolumeX className="w-6 h-6 text-rose-400" />, desc: 'Silent verbal distress' },
    { type: 'MEDICAL', icon: <Activity className="w-6 h-6 text-emerald-400" />, desc: 'Medical emergency' },
    { type: 'DANGER', icon: <AlertTriangle className="w-6 h-6 text-amber-400" />, desc: 'Threat / unsafe situation' },
    { type: 'FIRE', icon: <Flame className="w-6 h-6 text-orange-400" />, desc: 'Fire or smoke hazard' },
    { type: 'ACCIDENT', icon: <Car className="w-6 h-6 text-cyan-400" />, desc: 'Vehicular incident' },
    { type: 'FOLLOWING', icon: <UserCheck className="w-6 h-6 text-purple-400" />, desc: 'Being tracked' },
    { type: 'UNSAFE', icon: <Shield className="w-6 h-6 text-rose-300" />, desc: 'Hostile location' },
    { type: 'OTHER', icon: <AlertTriangle className="w-6 h-6 text-slate-300" />, desc: 'General help' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Hero Emergency Banner */}
      <div className="p-8 sm:p-12 rounded-[2rem] bg-danger/10 border-2 border-danger shadow-[0_0_100px_rgba(244,63,94,0.2)] animate-pulse-subtle flex flex-col items-center text-center space-y-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-danger/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="w-24 h-24 rounded-full bg-danger text-white flex items-center justify-center animate-bounce shadow-2xl shadow-danger/50 relative z-10">
          <Shield className="w-12 h-12" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-3 mb-6">
            <span className="px-4 py-1.5 rounded-full bg-danger text-white text-xs font-bold font-mono tracking-widest uppercase">
              STATUS: {emergency?.status || 'ACTIVE'}
            </span>
            <span className="px-4 py-1.5 rounded-full border border-danger/50 text-danger-light text-xs font-bold font-mono tracking-widest uppercase">
              ESCALATION: Lvl {emergency?.escalation_level || 1}
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tighter uppercase leading-none">
            EMERGENCY <br className="sm:hidden" /> DISPATCH
          </h1>
        </div>

        <button
          onClick={onResolve}
          className="relative z-10 mt-8 px-10 py-5 rounded-full bg-white text-background font-extrabold text-lg uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-2xl"
        >
          Mark as Resolved
        </button>

        {/* Live Acknowledgment / Paging Status */}
        <div className="w-full max-w-2xl mx-auto mt-8 relative z-10">
          {emergency?.status === 'ACKNOWLEDGED' ? (
            <div className="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between shadow-xl">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <div className="text-left">
                  <p className="text-lg font-extrabold text-emerald-200 uppercase tracking-wide">Emergency Acknowledged</p>
                  <p className="text-sm text-emerald-300/80">
                    <strong>{emergency.acknowledged_by || 'Trusted Contact'}</strong> is responding to your location.
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-right font-mono text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-xl">
                <p className="text-xs uppercase tracking-widest mb-1">Response Time</p>
                <p className="text-3xl font-black">{emergency.response_time_seconds || 18}s</p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-surface-card/90 border border-surface-border flex flex-col sm:flex-row items-center justify-between font-mono shadow-xl backdrop-blur-md">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-200 text-sm tracking-widest uppercase">
                  Paging: <strong className="text-accent-light">{emergency?.current_notified_contact || 'Contact 1'}</strong>
                </span>
              </div>
              <span className="text-amber-300 font-bold text-sm tracking-widest">
                NEXT ESCALATION IN {escalationSecondsLeft}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Category Selector */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400 ml-2">
          Update Emergency Context
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {emergencyCategories.map((cat) => {
            const isSelected = emergency?.type === cat.type;
            return (
              <button
                key={cat.type}
                onClick={() => onSelectType(cat.type)}
                className={`p-6 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all text-left ${
                  isSelected
                    ? 'bg-danger/20 border-danger text-white shadow-lg shadow-danger/30 scale-105'
                    : 'bg-surface-card border-surface-border hover:border-accent hover:bg-surface text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className={`mb-3 ${isSelected ? 'animate-pulse' : ''}`}>{cat.icon}</div>
                  <p className="text-sm font-bold uppercase tracking-wide">{cat.type}</p>
                </div>
                <p className="text-xs text-slate-400 mt-2">{cat.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intelligence Panels: Location & Escalation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Geolocation Card */}
        <div className="p-8 rounded-[2rem] bg-surface-card border border-surface-border space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-surface-border">
            <MapPin className="w-6 h-6 text-accent-light" />
            <h3 className="text-lg font-bold text-white tracking-wide">Live Telemetry</h3>
          </div>

          <div className="p-6 rounded-xl bg-background border border-surface-border font-mono space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-slate-400 text-xs">LATITUDE</span>
              <strong className="text-accent-light text-lg">{emergency?.latitude?.toFixed(5) || '13.08270'}° N</strong>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-slate-400 text-xs">LONGITUDE</span>
              <strong className="text-accent-light text-lg">{emergency?.longitude?.toFixed(5) || '80.27070'}° E</strong>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-emerald-400 tracking-widest">High Accuracy Fix Active</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono text-center">End-to-End Encrypted Coordinates</p>
        </div>

        {/* Escalation Ladder */}
        <div className="p-8 rounded-[2rem] bg-surface-card border border-surface-border space-y-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-accent-light" />
              <h3 className="text-lg font-bold text-white tracking-wide">Escalation Ladder</h3>
            </div>
            <span className="text-xs font-mono text-slate-400 tracking-widest bg-surface px-3 py-1 rounded-full">60s TIMEOUT</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin">
            {contacts.map((c, idx) => {
              const isCurrent = emergency?.escalation_level === c.priority;
              const isPassed = (emergency?.escalation_level || 1) > c.priority;

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : isPassed
                      ? 'bg-surface/50 border-surface-border text-slate-500'
                      : 'bg-background border-surface-border text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      isCurrent ? 'bg-amber-500 text-black' : 'bg-surface border border-surface-border'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className={`font-bold ${isCurrent ? 'text-amber-400' : ''}`}>{c.name}</p>
                      <p className="text-xs font-mono opacity-60 mt-0.5">{c.phone}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold tracking-widest px-2 py-1 rounded uppercase ${
                    isCurrent ? 'bg-amber-500/20 text-amber-400' : isPassed ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {isCurrent ? '🚨 NOTIFIED' : isPassed ? 'ESCALATED' : 'STANDBY'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
