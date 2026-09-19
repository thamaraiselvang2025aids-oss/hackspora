/**
 * Priority-Aware Audio & Speech Queue.
 * Priority 1: Critical Danger (Interrupts everything)
 * Priority 2: Caution / Obstacle
 * Priority 3: Target Discovered
 * Priority 4: Search guidance
 * Priority 5: General ambient info
 */
class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentPriority: number = 99;
  private isSpeaking: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      this.voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                   voices.find(v => v.lang.startsWith('en')) || null;
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  speak(text: string, priority: number = 4) {
    if (!this.synth || !text.trim()) return;

    // Interrupt if higher priority (lower number is higher priority)
    if (this.isSpeaking && priority < this.currentPriority) {
      this.synth.cancel();
      this.isSpeaking = false;
    } else if (this.isSpeaking && priority >= this.currentPriority) {
      // Don't interrupt higher priority with lower priority
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.currentPriority = priority;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentPriority = 99;
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentPriority = 99;
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentPriority = 99;
    }
  }
}

export const speechManager = new SpeechManager();

/**
 * Web Speech Recognition helper for Voice Search ("Find my water bottle")
 */
export function startVoiceRecognition(
  onResult: (transcript: string) => void,
  onError?: (err: any) => void
): () => void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Web Speech Recognition not supported in this browser.');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event.error);
  };

  try {
    recognition.start();
  } catch (e) {
    console.error('Recognition start error:', e);
  }

  return () => {
    try {
      recognition.stop();
    } catch (e) {}
  };
}
