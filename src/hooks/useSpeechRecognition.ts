import { useCallback, useEffect, useRef, useState } from 'react';
import { getSpeechLanguage, useLanguage } from '../i18n';

interface SpeechResultEntry {
  transcript: string;
  isFinal?: boolean;
}

interface SpeechResultEvent extends Event {
  results: ArrayLike<ArrayLike<SpeechResultEntry>>;
}

interface SpeechErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionController {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionController;
type TranscriptHandler = (transcript: string) => void;

function getRecognitionConstructor() {
  const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function useSpeechRecognition(onTranscript: TranscriptHandler) {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const transcriptHandlerRef = useRef(onTranscript);

  useEffect(() => {
    transcriptHandlerRef.current = onTranscript;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);
    setStatus('');
  }, []);

  const startListening = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setStatus(t('speechUnavailable'));
      return;
    }

    const recognition = new Recognition();
    recognition.lang = getSpeechLanguage(language);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const finalResults = Array.from(event.results).filter((result) => result[0]?.isFinal);
      const transcript = (finalResults.length ? finalResults : Array.from(event.results).slice(-1))
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (!transcript) return;
      setRecognizedText(transcript);
      if (finalResults.length) transcriptHandlerRef.current(transcript);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setStatus(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? t('micDenied') : t('speechUnavailable'));
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setRecognizedText('');
    setStatus(t('listening'));
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setStatus(t('speechUnavailable'));
    }
  }, [language, t]);

  useEffect(() => stopListening, [language, stopListening]);

  return { isListening, status, recognizedText, startListening, stopListening, setStatus };
}
