import React, { useEffect, useState } from 'react';
import {
  Shield, PhoneCall, MapPin, Clock, CheckCircle2, AlertTriangle, Flame, Activity, Car, VolumeX, UserCheck, Radio, Navigation
} from 'lucide-react';
import { api } from '../../services/api';
import { Emergency } from '../../types';

interface EmergencyReceiverPageProps {
  activeEmergency: Emergency | null;
  onEmergencyUpdate: () => void;
}

export const EmergencyReceiverPage: React.FC<EmergencyReceiverPageProps> = ({
  activeEmergency, onEmergencyUpdate
}) => {
  const [emergency, setEmergency] = useState<Emergency | null>(activeEmergency);
  const [isResponding, setIsResponding] = useState(false);
  const [responderName, setResponderName] = useState('Aisha Mohamed (Sister)');

  useEffect(() => {
    if (activeEmergency) {
      setEmergency(activeEmergency);
    } else {
      api.getActiveEmergency().then((data) => { if (data) setEmergency(data); });
    }
  }, [activeEmergency]);

  const handleRespond = async () => {
    if (!emergency) return;
    setIsResponding(true);
    try {
      const res = await api.acknowledgeEmergency(emergency.id, responderName);
      setEmergency(res);
      onEmergencyUpdate();
    } catch (e) { console.warn('Respond error:', e); } finally { setIsResponding(false); }
  };

  const handleResolve = async () => {
    if (!emergency) return;
    try {
      const res = await api.resolveEmergency(emergency.id);
      setEmergency(res);
      onEmergencyUpdate();
    } catch (e) { console.warn('Resolve error:', e); }
  };

  const getEmergencyIcon = (type?: string) => {
    switch (type) {
      case 'FIRE': return <Flame className="w-10 h-10 text-orange-400" />;
      case 'MEDICAL': return <Activity className="w-10 h-10 text-emerald-400" />;
      case 'ACCIDENT': return <Car className="w-10 h-10 text-cyan-400" />;
      case 'CANNOT SPEAK': return <VolumeX className="w-10 h-10 text-rose-400" />;
      default: return <AlertTriangle className="w-10 h-10 text-danger-light" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Receiver Portal Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-surface-border shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Emergency Responder Portal</h1>
            <p className="text-sm text-slate-400 font-mono mt-0.5">
              AUTHORIZED RECEIVER INTERFACE
            </p>
          </div>
        </div>

        <div className="text-xs font-mono px-4 py-2 rounded-xl bg-surface-card border border-surface-border text-slate-300">
          RESPONDER: <strong className="text-accent-light text-sm">{responderName}</strong>
        </div>
      </div>

      {/* Active Emergency Incident Card */}
      {emergency && emergency.status !== 'RESOLVED' ? (
        <div className="p-8 sm:p-12 rounded-[2rem] bg-danger/10 border border-danger/50 shadow-[0_0_80px_rgba(244,63,94,0.15)] space-y-10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-danger/20 to-transparent pointer-events-none opacity-50" />
          
          {/* Header */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-danger/20">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-[2rem] bg-danger flex items-center justify-center text-white shadow-2xl shadow-danger/40 animate-pulse-subtle">
                {getEmergencyIcon(emergency.type)}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-danger text-white">
                    🚨 {emergency.status}
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-danger-light border border-danger/30 px-3 py-1 rounded-full">
                    ESCALATION LVL {emergency.escalation_level}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  {emergency.user_name} Needs <br className="hidden sm:block" /> Immediate Assistance
                </h2>
              </div>
            </div>

            <span className="text-sm font-mono text-slate-400 font-bold bg-surface/50 px-4 py-2 rounded-xl border border-surface-border">
              {new Date(emergency.created_at).toLocaleTimeString()}
            </span>
          </div>

          {/* Details Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Context</span>
              <p className="text-2xl font-black text-white mt-2 uppercase">{emergency.type}</p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">User Message</span>
              <p className="text-lg font-semibold text-slate-200 mt-2 leading-snug">
                {emergency.message || 'Silent distress signal dispatched'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Telemetry</span>
              <div className="mt-2 text-sm font-mono font-bold text-accent-light leading-relaxed">
                <p>LAT: {emergency.latitude?.toFixed(5) || '13.08270'}° N</p>
                <p>LNG: {emergency.longitude?.toFixed(5) || '80.27070'}° E</p>
              </div>
            </div>
          </div>

          {/* Simulated Map View with Marker */}
          <div className="relative z-10 aspect-video sm:h-80 w-full rounded-[2rem] overflow-hidden bg-[#070B14] border border-surface-border flex items-center justify-center shadow-2xl">
            {/* Ambient Map background styling */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#14b8a6_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            <div className="absolute inset-0 border-[1px] border-accent/10 rounded-[2rem] m-8 pointer-events-none" />
            <div className="absolute inset-0 border-[1px] border-accent/5 rounded-[2rem] m-16 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute -inset-8 bg-danger/20 rounded-full animate-ping-slow pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-danger/40 border-4 border-danger flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.6)]">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-background/90 backdrop-blur-md border border-surface-border text-center shadow-xl">
                <p className="font-bold text-white text-lg tracking-wide">{emergency.user_name}'s Location</p>
                <p className="text-xs font-mono text-accent-light mt-1 uppercase tracking-widest">Est. 0.4 km away (~2 mins travel)</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center gap-6">
            {emergency.status === 'ACKNOWLEDGED' ? (
              <div className="flex-1 w-full p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between shadow-xl gap-4">
                <div className="flex items-center space-x-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-emerald-200 uppercase tracking-widest">
                      ✓ Responding to Incident
                    </p>
                    <p className="text-sm text-emerald-300/80 mt-1">
                      User notified that <strong>{emergency.acknowledged_by}</strong> is en route.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResolve}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase font-mono tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900"
                >
                  Resolve Incident
                </button>
              </div>
            ) : (
              <button
                onClick={handleRespond}
                disabled={isResponding}
                className="flex-1 w-full py-6 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-background font-black text-xl uppercase tracking-widest shadow-2xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3"
              >
                <Navigation className="w-8 h-8" />
                <span>{isResponding ? 'Acknowledging...' : "I'M RESPONDING NOW"}</span>
              </button>
            )}

            <a
              href="tel:+919840123456"
              className="w-full sm:w-auto py-6 px-10 rounded-2xl bg-surface-card border border-surface-border hover:border-slate-400 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PhoneCall className="w-6 h-6 text-accent-light" />
              <span>Call User</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="p-16 rounded-[2rem] glass-panel border border-surface-border text-center space-y-6 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.1)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">No Active Emergencies</h2>
            <p className="text-base text-slate-400 max-w-lg mx-auto mt-4 leading-relaxed">
              All trusted contacts are currently standing by. When an SOS alert is triggered, it will immediately broadcast here with real-time GPS telemetry.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
