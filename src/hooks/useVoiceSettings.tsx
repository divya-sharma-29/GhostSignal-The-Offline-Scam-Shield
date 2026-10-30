import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSpeechLanguage, useLanguage } from '../i18n';

const STORAGE_KEY = 'ghostsignal_voice_settings_v1';

interface SavedVoiceSettings {
  enabled: boolean;
  rate: number;
  voiceURI: string;
}

interface VoiceSettingsContextValue extends SavedVoiceSettings {
  voices: SpeechSynthesisVoice[];
  matchingVoices: SpeechSynthesisVoice[];
  setEnabled: (enabled: boolean) => void;
  setRate: (rate: number) => void;
  setVoiceURI: (voiceURI: string) => void;
  speak: (text: string, force?: boolean) => boolean;
  stop: () => void;
}

const VoiceSettingsContext = createContext<VoiceSettingsContextValue | null>(null);

function readSettings(): SavedVoiceSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { enabled: false, rate: 1, voiceURI: '', ...JSON.parse(saved) };
  } catch {
    return { enabled: false, rate: 1, voiceURI: '' };
  }
  return { enabled: false, rate: 1, voiceURI: '' };
}

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<SavedVoiceSettings>(readSettings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechLocale = getSpeechLanguage(language);
  const matchingVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(language));

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.speechSynthesis?.cancel();
  }, [settings, language]);

  const update = (patch: Partial<SavedVoiceSettings>) => setSettings((current) => ({ ...current, ...patch }));

  const speak = (text: string, force = false) => {
    if (!('speechSynthesis' in window) || (!force && !settings.enabled)) return false;
    const availableVoices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith(language));
    if (!availableVoices.length) return false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale;
    utterance.rate = settings.rate;
    utterance.voice = availableVoices.find((voice) => voice.voiceURI === settings.voiceURI)
      ?? availableVoices.find((voice) => voice.lang.toLowerCase() === speechLocale.toLowerCase())
      ?? availableVoices[0];
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const value: VoiceSettingsContextValue = {
    ...settings,
    voices,
    matchingVoices,
    setEnabled: (enabled) => update({ enabled }),
    setRate: (rate) => update({ rate }),
    setVoiceURI: (voiceURI) => update({ voiceURI }),
    speak,
    stop: () => window.speechSynthesis?.cancel()
  };

  return <VoiceSettingsContext.Provider value={value}>{children}</VoiceSettingsContext.Provider>;
}

export function useVoiceSettings() {
  const context = useContext(VoiceSettingsContext);
  if (!context) throw new Error('useVoiceSettings must be used within VoiceSettingsProvider');
  return context;
}