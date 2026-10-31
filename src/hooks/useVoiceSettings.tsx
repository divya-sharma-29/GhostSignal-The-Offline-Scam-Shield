import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSpeechLanguage, useLanguage } from '../i18n';

const STORAGE_KEY = 'ghostsignal_voice_settings_v2';

// Keep module-level reference to prevent Chromium garbage collection of active speech
let activeUtterance: SpeechSynthesisUtterance | null = null;

interface SavedVoiceSettings {
  enabled: boolean;
  rate: number;
  voiceURI: string;
  muted: boolean;
}

interface VoiceSettingsContextValue extends SavedVoiceSettings {
  voices: SpeechSynthesisVoice[];
  matchingVoices: SpeechSynthesisVoice[];
  isSpeaking: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  setEnabled: (enabled: boolean) => void;
  setRate: (rate: number) => void;
  setVoiceURI: (voiceURI: string) => void;
  speak: (text: string, force?: boolean, onEnd?: () => void) => boolean;
  stop: () => void;
}

const VoiceSettingsContext = createContext<VoiceSettingsContextValue | null>(null);

function readSettings(): SavedVoiceSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { enabled: true, rate: 1, voiceURI: '', muted: false, ...JSON.parse(saved) };
  } catch {
    return { enabled: true, rate: 1, voiceURI: '', muted: false };
  }
  return { enabled: true, rate: 1, voiceURI: '', muted: false };
}

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<SavedVoiceSettings>(readSettings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechLocale = getSpeechLanguage(language);
  const matchingVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase()));

  // Populate browser voices reliably
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
        }
      } catch {
        // Fallback gracefully
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Sync settings and cancel ongoing audio on language change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore localStorage failure
    }
    stop();
  }, [settings, language]);

  const update = (patch: Partial<SavedVoiceSettings>) => setSettings((current) => ({ ...current, ...patch }));

  const stop = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore cancel error
    }
    activeUtterance = null;
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    if (!settings.muted) {
      stop();
    }
    update({ muted: !settings.muted });
  };

  const speak = (text: string, force = true, onEnd?: () => void): boolean => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    // If user has muted sound and force is not explicitly overriding, do not play
    if (settings.muted) {
      return false;
    }

    // Clean up any ongoing speech
    stop();

    try {
      // Resume if engine was paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Small async tick avoids Chrome race conditions where cancel() drops immediate speak()
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          activeUtterance = utterance;

          utterance.lang = speechLocale || 'en-IN';
          utterance.rate = Math.max(0.6, Math.min(1.8, settings.rate || 1));
          utterance.volume = 1;

          // Multi-tier voice selection to guarantee audio plays on any operating system
          const allVoices = window.speechSynthesis.getVoices() || [];
          if (allVoices.length > 0) {
            const preferredVoice = 
              allVoices.find((v) => v.voiceURI === settings.voiceURI)
              || allVoices.find((v) => v.lang.toLowerCase() === speechLocale.toLowerCase())
              || allVoices.find((v) => v.lang.toLowerCase().startsWith(language.toLowerCase()))
              || allVoices.find((v) => v.lang.toLowerCase().startsWith('en'))
              || allVoices.find((v) => v.default)
              || allVoices[0];

            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }
          }

          utterance.onstart = () => {
            setIsSpeaking(true);
          };

          utterance.onend = () => {
            activeUtterance = null;
            setIsSpeaking(false);
            onEnd?.();
          };

          utterance.onerror = (e) => {
            // If canceled, do not treat as fatal error
            activeUtterance = null;
            setIsSpeaking(false);
          };

          window.speechSynthesis.speak(utterance);

          // Workaround for Chrome speech synthesis freeze bug
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          setIsSpeaking(true);
        } catch {
          activeUtterance = null;
          setIsSpeaking(false);
        }
      }, 40);

      return true;
    } catch {
      setIsSpeaking(false);
      return false;
    }
  };

  const value: VoiceSettingsContextValue = {
    ...settings,
    voices,
    matchingVoices,
    isSpeaking,
    isMuted: settings.muted,
    toggleMute,
    setEnabled: (enabled) => update({ enabled }),
    setRate: (rate) => update({ rate }),
    setVoiceURI: (voiceURI) => update({ voiceURI }),
    speak,
    stop
  };

  return <VoiceSettingsContext.Provider value={value}>{children}</VoiceSettingsContext.Provider>;
}

export function useVoiceSettings() {
  const context = useContext(VoiceSettingsContext);
  if (!context) throw new Error('useVoiceSettings must be used within VoiceSettingsProvider');
  return context;
}
