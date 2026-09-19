import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { soundEffects } from '../../services/audioPlayer';

interface SosCountdownModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SosCountdownModal: React.FC<SosCountdownModalProps> = ({
  isOpen,
  onCancel,
  onConfirm
}) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setCount(3);
      return;
    }

    soundEffects.playObstacleBeep(600, 200);
    soundEffects.triggerHaptic(200);

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm();
          return 0;
        }
        soundEffects.playObstacleBeep(600 + (4 - prev) * 150, 200);
        soundEffects.triggerHaptic(150);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-sm p-8 rounded-3xl glass-danger-glow border-2 border-danger text-center space-y-6 shadow-2xl animate-pulse-subtle">
        <div className="w-20 h-20 mx-auto rounded-full bg-danger/20 border-2 border-danger flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-danger-light animate-bounce" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-wider text-white">
            Triggering Silent SOS
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Dispatching silent alert with GPS coordinates to trusted contacts in:
          </p>
        </div>

        <div className="text-6xl font-black text-danger-light font-mono animate-ping-slow">
          {count}
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3.5 px-6 rounded-2xl bg-surface-card border-2 border-slate-600 hover:border-slate-400 text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 transition-all"
        >
          <X className="w-5 h-5" />
          <span>Cancel SOS</span>
        </button>
      </div>
    </div>
  );
};
