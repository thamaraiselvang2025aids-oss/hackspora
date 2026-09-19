import React, { useEffect, useState, useRef } from 'react';
import {
  Camera, RefreshCw, Mic, Volume2, VolumeX, Compass,
  AlertTriangle, Search, Eye, Layers, ArrowUp, ArrowUpLeft, ArrowUpRight, Octagon
} from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { api } from '../../services/api';
import { speechManager } from '../../services/speech'; // Keep for some direct calls if needed, or use context speak
import { useVoiceAssistant } from '../../contexts/VoiceAssistantContext';
import { soundEffects } from '../../services/audioPlayer';
import { VisionProcessResponse } from '../../types';

interface BlindModePageProps {
  isDemoMode: boolean;
  initialSearchQuery?: string;
}

export const BlindModePage: React.FC<BlindModePageProps> = ({
  isDemoMode,
  initialSearchQuery
}) => {
  const {
    videoRef, isActive, error: cameraError, facingMode,
    startCamera, stopCamera, switchCamera, captureFrameBase64
  } = useCamera();

  const [isProcessing, setIsProcessing] = useState(false);
  const [visionData, setVisionData] = useState<VisionProcessResponse | null>(null);
  const [targetQuery, setTargetQuery] = useState(initialSearchQuery || '');
  const [searchInput, setSearchInput] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedDemoScene, setSelectedDemoScene] = useState<'default' | 'obstacle_center' | 'target_found_clear'>('default');
  const [panAngle, setPanAngle] = useState(0.0);

  const lastSpokenTextRef = useRef<string>('');
  const loopIntervalRef = useRef<any>(null);

  const { startListening, stopListening, speak, registerIntentHandler, voiceState } = useVoiceAssistant();

  // Voice Assistant Initialization and Handlers
  useEffect(() => {
    // Welcome message
    speak("Welcome to OBSERVA. Voice assistance is active. Say help to learn what you can do.", 2);
    startListening();

    const unregisterHelp = registerIntentHandler('HELP', () => {
      speak("You are in Spatial Vision mode. You can say 'What is on this page?', 'Find my keys', 'Turn audio off', or 'Go home'.");
    });

    const unregisterReadPage = registerIntentHandler('READ_PAGE', () => {
      const audioStatus = ttsEnabled ? "on" : "off";
      const targetStatus = targetQuery ? `currently searching for ${targetQuery}.` : "not searching for any specific object.";
      speak(`Spatial Vision page. Live scene analysis is running. Audio guidance is ${audioStatus}. You are ${targetStatus} You can toggle audio, switch camera, or search using your voice.`);
    });

    const unregisterSearch = registerIntentHandler('SEARCH_OBJECT', (payload) => {
      if (payload) {
        setTargetQuery(payload);
        setSearchInput(payload);
        speak(`Searching for ${payload}.`);
      }
    });

    const unregisterAudioOn = registerIntentHandler('AUDIO_ON', () => {
      setTtsEnabled(true);
      speak("Audio guidance enabled.");
    });

    const unregisterAudioOff = registerIntentHandler('AUDIO_OFF', () => {
      speak("Audio guidance disabled.");
      setTtsEnabled(false);
      speechManager.stop();
    });

    return () => {
      unregisterHelp();
      unregisterReadPage();
      unregisterSearch();
      unregisterAudioOn();
      unregisterAudioOff();
      stopListening();
    };
  }, [speak, startListening, stopListening, registerIntentHandler, ttsEnabled, targetQuery]);

  useEffect(() => {
    startCamera('environment');
    return () => {
      stopCamera();
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    const runProcessingCycle = async () => {
      if (isProcessing) return;

      const frameBase64 = captureFrameBase64();
      if (!frameBase64 && !isDemoMode) return;

      setIsProcessing(true);
      try {
        const response = await api.processVisionFrame(
          frameBase64, targetQuery || undefined, isDemoMode, selectedDemoScene, panAngle
        );
        setVisionData(response);

        if (response.path_guidance.beep_frequency_hz) {
          soundEffects.playObstacleBeep(response.path_guidance.beep_frequency_hz, 160);
        }

        if (ttsEnabled && response.concise_narration && response.concise_narration !== lastSpokenTextRef.current) {
          lastSpokenTextRef.current = response.concise_narration;
          // Use context speak so it handles states properly
          speak(response.concise_narration, response.priority_level);
        }
      } catch (err) {
        console.warn('Vision loop cycle error:', err);
        setVisionData({
          objects: [],
          target_result: undefined,
          path_guidance: { recommended_direction: "STOP", instruction: "System unavailable. Fallback active.", urgency: "CAUTION", lanes: [] },
          observation_coverage: { overall_percentage: 0, sectors: [] },
          concise_narration: "System unavailable. Fallback active.",
          priority_level: 1,
          timestamp: Date.now() / 1000
        });
      } finally {
        setIsProcessing(false);
      }
    };

    loopIntervalRef.current = setInterval(runProcessingCycle, 1200);
    runProcessingCycle();
    return () => { if (loopIntervalRef.current) clearInterval(loopIntervalRef.current); };
  }, [captureFrameBase64, targetQuery, isDemoMode, selectedDemoScene, panAngle, ttsEnabled, isProcessing]);

  const handleVoiceSearch = () => {
    // If they manually click the mic button, just ensure we are listening
    if (voiceState !== 'listening') {
       startListening();
       speak('Listening...', 4);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTargetQuery(searchInput.trim());
      speak(`Searching for ${searchInput.trim()}`, 3);
    }
  };

  const getDirectionIcon = (dir?: string) => {
    switch (dir) {
      case 'SLIGHTLY LEFT': return <ArrowUpLeft className="w-6 h-6 text-accent-light" />;
      case 'SLIGHTLY RIGHT': return <ArrowUpRight className="w-6 h-6 text-accent-light" />;
      case 'STOP': return <Octagon className="w-6 h-6 text-danger-light animate-pulse" />;
      default: return <ArrowUp className="w-6 h-6 text-emerald-400" />;
    }
  };

  const isObstacleImminent = visionData?.path_guidance?.lanes?.some(l => l.lane === 'CENTER' && l.status === 'BLOCKED');

  return (
    <main aria-label="Spatial Vision" className="max-w-7xl mx-auto px-4 py-6 space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Top HUD Bar */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3" aria-hidden="true">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
            <Eye className="w-5 h-5 text-accent-light" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Spatial Vision</h1>
            <p className="text-xs text-slate-400 font-mono">LIVE SCENE ANALYSIS</p>
          </div>
        </div>

        <nav aria-label="Spatial Vision Controls" className="flex items-center space-x-3 w-full sm:w-auto">
          {isDemoMode && (
             <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
               DEMO ACTIVE
             </span>
          )}
          <button
            onClick={() => { setTtsEnabled(!ttsEnabled); if (ttsEnabled) speechManager.stop(); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors ${
              ttsEnabled ? 'bg-accent/15 border-accent/40 text-accent-light' : 'bg-surface border-surface-border text-slate-500'
            }`}
            aria-label={ttsEnabled ? 'Mute Audio Guidance' : 'Enable Audio Guidance'}
            title={ttsEnabled ? 'Mute Audio Guidance' : 'Enable Audio Guidance'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{ttsEnabled ? 'Audio On' : 'Muted'}</span>
          </button>
          <button
            onClick={switchCamera}
            aria-label="Switch Camera"
            title="Switch Camera"
            className="p-2.5 rounded-full bg-surface-card border border-surface-border hover:border-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-300" />
          </button>
        </nav>
      </header>

      {/* Hero Camera View */}
      <div className={`relative flex-1 rounded-3xl overflow-hidden bg-black border-2 transition-colors duration-300 shadow-2xl ${
        isObstacleImminent ? 'border-danger shadow-danger/40 animate-pulse' : 'border-surface-border'
      }`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Scanning Line Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-accent/10 to-transparent animate-scan-line" />

        {/* Elegant Bounding Boxes */}
        {visionData?.objects && visionData.objects.map((obj) => {
          const { bbox, is_obstacle, class_name, distance_meters, confidence } = obj;
          const top = `${bbox.y_min * 100}%`;
          const left = `${bbox.x_min * 100}%`;
          const width = `${(bbox.x_max - bbox.x_min) * 100}%`;
          const height = `${(bbox.y_max - bbox.y_min) * 100}%`;

          const isTargetMatch = targetQuery && class_name.toLowerCase().includes(targetQuery.toLowerCase());
          const borderColor = is_obstacle ? 'border-danger bg-danger/10' : isTargetMatch ? 'border-accent-light bg-accent/20' : 'border-accent/40';

          return (
            <div
              key={obj.id}
              style={{ top, left, width, height }}
              className={`absolute border-[1.5px] ${borderColor} rounded-md transition-all duration-300 pointer-events-none`}
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center space-x-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono whitespace-nowrap shadow-xl">
                <span className={`font-bold uppercase ${is_obstacle ? 'text-danger-light' : 'text-accent-light'}`}>
                  {class_name}
                </span>
                <span className="text-white">~{distance_meters}m</span>
                <span className="text-slate-400">{(confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}

        {/* Obstacle Warning Dominant Overlay */}
        {isObstacleImminent && (
          <div className="absolute inset-0 border-4 border-danger pointer-events-none flex items-center justify-center bg-danger/10">
            <div className="bg-danger text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest flex items-center space-x-2 shadow-2xl animate-bounce">
              <Octagon className="w-5 h-5" />
              <span>Obstacle Imminent - Stop</span>
            </div>
          </div>
        )}

        {/* Live Audio Narration Overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-background/90 backdrop-blur-xl border border-surface-border rounded-2xl p-4 flex items-center space-x-4 shadow-2xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
              isProcessing ? 'bg-accent/20 border-accent/50 animate-pulse' : 'bg-surface border-surface-border'
            }`}>
              {ttsEnabled ? <Volume2 className="w-6 h-6 text-accent-light" /> : <VolumeX className="w-6 h-6 text-slate-500" />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Live Audio Guidance</p>
              <p className="text-base sm:text-lg font-medium text-white">
                {visionData?.concise_narration || 'Scanning environment...'}
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-center justify-center px-4 border-l border-surface-border">
              {getDirectionIcon(visionData?.path_guidance?.recommended_direction)}
              <span className="text-[10px] font-mono text-slate-300 mt-1 uppercase">
                {visionData?.path_guidance?.recommended_direction || 'FORWARD'}
              </span>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        <div className="absolute top-6 right-6 w-72">
          <form onSubmit={handleManualSearch} className="flex flex-col gap-2 bg-background/90 backdrop-blur-xl p-3 rounded-2xl border border-surface-border shadow-2xl">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleVoiceSearch}
                aria-label="Voice Search"
                className={`p-3 rounded-xl transition-colors ${
                  voiceState === 'listening' ? 'bg-danger text-white animate-pulse' : 'bg-surface hover:bg-surface-card text-accent-light'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Find object..."
                aria-label="Search for object by text"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder-slate-500 font-sans"
              />
            </div>
            {targetQuery && (
               <div className="px-2 py-1.5 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-between">
                 <span className="text-[10px] font-mono text-accent-light">TARGET: {targetQuery.toUpperCase()}</span>
                 {visionData?.target_result?.found && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
               </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
};
