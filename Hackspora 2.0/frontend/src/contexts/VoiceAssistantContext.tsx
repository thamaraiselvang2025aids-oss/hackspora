import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { speechManager } from '../services/speech';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export type Intent = 
  | 'HELP'
  | 'READ_PAGE'
  | 'NAVIGATE'
  | 'BACK'
  | 'HOME'
  | 'AUDIO_ON'
  | 'AUDIO_OFF'
  | 'START_ANALYSIS'
  | 'SEARCH_OBJECT'
  | 'STOP'
  | 'REPEAT'
  | 'UNKNOWN';

export interface ParsedIntent {
  intent: Intent;
  payload?: string;
}

interface VoiceAssistantContextType {
  voiceState: VoiceState;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, priority?: number) => void;
  registerIntentHandler: (intent: Intent, handler: (payload?: string) => void) => () => void;
  forceState: (state: VoiceState) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | null>(null);

export const useVoiceAssistant = () => {
  const ctx = useContext(VoiceAssistantContext);
  if (!ctx) throw new Error('useVoiceAssistant must be used within VoiceAssistantProvider');
  return ctx;
};

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voiceState, _setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  
  const voiceStateRef = useRef<VoiceState>('idle');
  const setVoiceState = useCallback((state: VoiceState | ((prev: VoiceState) => VoiceState)) => {
    _setVoiceState(prev => {
      const newState = typeof state === 'function' ? state(prev) : state;
      voiceStateRef.current = newState;
      return newState;
    });
  }, []);
  
  const recognitionRef = useRef<any>(null);
  const handlersRef = useRef<Map<Intent, Set<(payload?: string) => void>>>(new Map());
  const lastSpokenRef = useRef<string>('');
  const stopRequested = useRef<boolean>(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript.trim();
        console.log('[VoiceAssistant] Heard:', result);
        setTranscript(result);
        processTranscript(result);
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceAssistant] Error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        console.log('[VoiceAssistant] Recognition ended. Stop requested:', stopRequested.current, 'State:', voiceStateRef.current);
        if (!stopRequested.current && voiceStateRef.current === 'listening') {
          try {
            recognition.start();
          } catch (e) {
            console.error('[VoiceAssistant] Failed to restart recognition', e);
          }
        } else if (voiceStateRef.current === 'listening') {
           setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        stopRequested.current = true;
        recognitionRef.current.stop();
      }
    };
  }, []); // Run only once on mount

  // We need processTranscript to always have access to the latest handlers.
  // Using a ref to hold the function or just trusting handlersRef is enough since it's a ref.
  const processTranscript = useCallback((text: string) => {
    const lower = text.toLowerCase();
    let parsed: ParsedIntent = { intent: 'UNKNOWN' };
    
    console.log('[VoiceAssistant] Processing intent for:', lower);

    if (lower.includes('stop') || lower.includes('shut up') || lower.includes('cancel')) {
      parsed.intent = 'STOP';
    } else if (lower.includes('help') || lower.includes('what can i do')) {
      parsed.intent = 'HELP';
    } else if (lower.includes('read') || lower.includes('what is on this page') || lower.includes('explain') || lower.includes('what is present') || lower.includes('what is here')) {
      parsed.intent = 'READ_PAGE';
    } else if (lower.includes('go to') || lower.includes('open') || lower.includes('navigate to')) {
      parsed.intent = 'NAVIGATE';
      // Extract target
      const target = lower.replace(/^(go to|open|navigate to)\s+/, '').trim();
      parsed.payload = target;
    } else if (lower.includes('go back') || lower.includes('back')) {
      parsed.intent = 'BACK';
    } else if (lower.includes('go home') || lower.includes('home')) {
      parsed.intent = 'HOME';
    } else if (lower.includes('turn audio on') || lower.includes('audio on') || lower.includes('unmute')) {
      parsed.intent = 'AUDIO_ON';
    } else if (lower.includes('turn audio off') || lower.includes('audio off') || lower.includes('mute') || lower.includes('turn off audio')) {
      parsed.intent = 'AUDIO_OFF';
    } else if (lower.includes('start scene analysis') || lower.includes('spatial vision') || lower.includes('start vision')) {
      parsed.intent = 'START_ANALYSIS';
    } else if (lower.includes('find my') || lower.includes('search for') || lower.includes('look for') || lower.startsWith('find ')) {
      parsed.intent = 'SEARCH_OBJECT';
      const obj = lower.replace(/^(find my|search for|look for|find)\s+/, '').trim();
      parsed.payload = obj;
    } else if (lower.includes('repeat') || lower.includes('say that again')) {
      parsed.intent = 'REPEAT';
    }

    setVoiceState('processing');

    // Default global actions
    if (parsed.intent === 'STOP') {
      speechManager.stop();
      setVoiceState('idle'); // or keep listening
    } else if (parsed.intent === 'REPEAT') {
      if (lastSpokenRef.current) {
        speak(lastSpokenRef.current);
      }
    } else {
      // Dispatch to registered handlers
      const handlers = handlersRef.current.get(parsed.intent);
      if (handlers && handlers.size > 0) {
        handlers.forEach(h => h(parsed.payload));
      } else {
        if (parsed.intent !== 'UNKNOWN') {
           speak("I cannot do that on this page.", 5);
        }
      }
    }

    // Go back to listening if we were just processing
    setTimeout(() => {
       setVoiceState(prev => (prev === 'processing' ? 'listening' : prev));
    }, 500);
  }, [setVoiceState]); // Dependency on setVoiceState which is stable

  const startListening = useCallback(() => {
    console.log('[VoiceAssistant] startListening called');
    stopRequested.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setVoiceState('listening');
      } catch (e) {
        console.warn('[VoiceAssistant] Recognition already started');
        setVoiceState('listening');
      }
    }
  }, [setVoiceState]);

  const stopListening = useCallback(() => {
    console.log('[VoiceAssistant] stopListening called');
    stopRequested.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState('idle');
  }, [setVoiceState]);

  const speak = useCallback((text: string, priority: number = 4) => {
    console.log('[VoiceAssistant] Speaking:', text);
    lastSpokenRef.current = text;
    setVoiceState('speaking');
    
    // Pause recognition while speaking to prevent self-triggering
    if (recognitionRef.current && !stopRequested.current && voiceStateRef.current === 'listening') {
       recognitionRef.current.stop();
    }

    speechManager.speak(text, priority);

    // Wait roughly based on text length to revert to listening (or idle if stop was requested)
    // Actually speechManager should have an onEnd callback, but we wrapped it in speech.ts
    // For now we estimate or just keep it simple. The ideal way is modifying speechManager to take callbacks.
    // Let's modify speech.ts slightly or just estimate. 
    // Estimation: ~150 words per minute => 2.5 words per second => 400ms per word.
    // Wait roughly based on text length to revert to listening (or idle if stop was requested)
    const duration = text.split(' ').length * 400 + 1000;
    setTimeout(() => {
      setVoiceState(prev => {
         if (prev === 'speaking') {
            if (!stopRequested.current) {
               try { recognitionRef.current?.start(); } catch(e){}
               return 'listening';
            }
            return 'idle';
         }
         return prev;
      });
    }, duration);

  }, [setVoiceState]);

  const registerIntentHandler = useCallback((intent: Intent, handler: (payload?: string) => void) => {
    if (!handlersRef.current.has(intent)) {
      handlersRef.current.set(intent, new Set());
    }
    handlersRef.current.get(intent)!.add(handler);
    return () => {
      handlersRef.current.get(intent)?.delete(handler);
    };
  }, []);

  const forceState = useCallback((state: VoiceState) => {
    setVoiceState(state);
  }, []);

  return (
    <VoiceAssistantContext.Provider value={{
      voiceState, transcript, startListening, stopListening, speak, registerIntentHandler, forceState
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};
