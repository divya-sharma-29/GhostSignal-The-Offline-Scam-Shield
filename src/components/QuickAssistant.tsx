import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Bot, Clock3, Languages, LockKeyhole, Mic, Phone, ScanLine, Square, Volume2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES, catalogs, useLanguage, type LanguageCode, type TranslationKey } from '../i18n';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { useScanHistory } from '../hooks/useScanHistory';

type Intent = 'scan' | 'screenshot' | 'explain' | 'read' | 'language' | 'help' | 'history' | 'home';

interface RecognitionResultEvent extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface RecognitionErrorEvent extends Event {
  error: string;
}

interface RecognitionController {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => RecognitionController;

const intentPhrases: Record<LanguageCode, Record<Intent, string[]>> = {
  en: { scan: ['scan this message', 'check this message', 'check whether this message is fake', 'scan message'], screenshot: ['scan this screenshot', 'check this screenshot', 'upload screenshot'], explain: ['explain this result', 'explain this message', 'why is this dangerous'], read: ['read the warning', 'read this result', 'tell me what i should do'], language: ['change language', 'change my language'], help: ['contact cybercrime', 'open cybercrime help', 'open the cybercrime helpline', 'open helpline', 'report cybercrime'], history: ['show my previous scans', 'show scan history', 'open scan history'], home: ['go home', 'open dashboard', 'go to dashboard'] },
  hi: { scan: ['संदेश जांचें', 'यह संदेश जांचें', 'संदेश की जांच'], screenshot: ['स्क्रीनशॉट जांचें', 'स्क्रीनशॉट की जांच'], explain: ['नतीजा समझाएं', 'यह खतरनाक क्यों है'], read: ['चेतावनी सुनाएं', 'नतीजा पढ़ें', 'मुझे क्या करना चाहिए'], language: ['भाषा बदलें', 'भाषा हिंदी'], help: ['साइबर अपराध सहायता', 'हेल्पलाइन खोलें'], history: ['जांच इतिहास दिखाएं', 'पुरानी जांच दिखाएं'], home: ['डैशबोर्ड पर जाएं', 'घर जाएं'] },
  bn: { scan: ['বার্তা পরীক্ষা করুন', 'এই বার্তা পরীক্ষা'], screenshot: ['স্ক্রিনশট পরীক্ষা করুন'], explain: ['ফলাফল ব্যাখ্যা করুন', 'কেন বিপজ্জনক'], read: ['সতর্কতা পড়ুন', 'আমার কী করা উচিত'], language: ['ভাষা বদলান'], help: ['সাইবার অপরাধ সহায়তা', 'হেল্পলাইন খুলুন'], history: ['পরীক্ষার ইতিহাস দেখান'], home: ['ড্যাশবোর্ডে যান'] },
  mr: { scan: ['संदेश तपासा', 'हा संदेश तपासा'], screenshot: ['स्क्रीनशॉट तपासा'], explain: ['निकाल समजावून सांगा', 'हे धोकादायक का आहे'], read: ['सूचना वाचा', 'मी काय करू'], language: ['भाषा बदला'], help: ['सायबर गुन्हा मदत', 'हेल्पलाइन उघडा'], history: ['तपासणी इतिहास दाखवा'], home: ['डॅशबोर्डवर जा'] },
  ta: { scan: ['செய்தியைச் சரிபார்க்கவும்', 'இந்தச் செய்தியைச் சரிபார்க்கவும்'], screenshot: ['திரைப்பிடிப்பைச் சரிபார்க்கவும்'], explain: ['முடிவை விளக்கவும்', 'இது ஏன் ஆபத்தானது'], read: ['எச்சரிக்கையைப் படிக்கவும்', 'நான் என்ன செய்ய வேண்டும்'], language: ['மொழியை மாற்றவும்'], help: ['சைபர் குற்ற உதவி', 'உதவி எண்ணைத் திறக்கவும்'], history: ['சரிபார்ப்பு வரலாற்றைக் காட்டு'], home: ['முகப்புக்குச் செல்'] },
  te: { scan: ['సందేశాన్ని తనిఖీ చేయండి', 'ఈ సందేశాన్ని తనిఖీ చేయండి'], screenshot: ['స్క్రీన్‌షాట్‌ను తనిఖీ చేయండి'], explain: ['ఫలితాన్ని వివరించు', 'ఇది ఎందుకు ప్రమాదకరం'], read: ['హెచ్చరికను చదువు', 'నేను ఏమి చేయాలి'], language: ['భాష మార్చు'], help: ['సైబర్ నేర సహాయం', 'హెల్ప్‌లైన్ తెరువు'], history: ['తనిఖీ చరిత్ర చూపు'], home: ['డాష్‌బోర్డ్‌కు వెళ్లు'] },
  kn: { scan: ['ಸಂದೇಶ ಪರಿಶೀಲಿಸಿ', 'ಈ ಸಂದೇಶ ಪರಿಶೀಲಿಸಿ'], screenshot: ['ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಪರಿಶೀಲಿಸಿ'], explain: ['ಫಲಿತಾಂಶ ವಿವರಿಸಿ', 'ಇದು ಏಕೆ ಅಪಾಯಕಾರಿ'], read: ['ಎಚ್ಚರಿಕೆ ಓದಿ', 'ನಾನು ಏನು ಮಾಡಬೇಕು'], language: ['ಭಾಷೆ ಬದಲಿಸಿ'], help: ['ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯ', 'ಸಹಾಯವಾಣಿ ತೆರೆಯಿರಿ'], history: ['ಪರಿಶೀಲನೆ ಇತಿಹಾಸ ತೋರಿಸಿ'], home: ['ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ'] },
  ml: { scan: ['സന്ദേശം പരിശോധിക്കുക', 'ഈ സന്ദേശം പരിശോധിക്കുക'], screenshot: ['സ്ക്രീൻഷോട്ട് പരിശോധിക്കുക'], explain: ['ഫലം വിശദീകരിക്കുക', 'ഇത് അപകടകരമാകുന്നത് എന്തുകൊണ്ട്'], read: ['മുന്നറിയിപ്പ് വായിക്കുക', 'ഞാൻ എന്ത് ചെയ്യണം'], language: ['ഭാഷ മാറ്റുക'], help: ['സൈബർ കുറ്റ സഹായം', 'ഹെൽപ്‌ലൈൻ തുറക്കുക'], history: ['പരിശോധന ചരിത്രം കാണിക്കുക'], home: ['ഡാഷ്ബോർഡിലേക്ക് പോകുക'] },
  gu: { scan: ['સંદેશ તપાસો', 'આ સંદેશ તપાસો'], screenshot: ['સ્ક્રીનશૉટ તપાસો'], explain: ['પરિણામ સમજાવો', 'આ જોખમી કેમ છે'], read: ['ચેતવણી વાંચો', 'મારે શું કરવું'], language: ['ભાષા બદલો'], help: ['સાયબર ગુના સહાય', 'હેલ્પલાઇન ખોલો'], history: ['તપાસનો ઇતિહાસ બતાવો'], home: ['ડેશબોર્ડ પર જાઓ'] },
  pa: { scan: ['ਸੁਨੇਹਾ ਜਾਂਚੋ', 'ਇਹ ਸੁਨੇਹਾ ਜਾਂਚੋ'], screenshot: ['ਸਕ੍ਰੀਨਸ਼ਾਟ ਜਾਂਚੋ'], explain: ['ਨਤੀਜਾ ਸਮਝਾਓ', 'ਇਹ ਖ਼ਤਰਨਾਕ ਕਿਉਂ ਹੈ'], read: ['ਚੇਤਾਵਨੀ ਪੜ੍ਹੋ', 'ਮੈਨੂੰ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ'], language: ['ਭਾਸ਼ਾ ਬਦਲੋ'], help: ['ਸਾਈਬਰ ਅਪਰਾਧ ਮਦਦ', 'ਹੈਲਪਲਾਈਨ ਖੋਲ੍ਹੋ'], history: ['ਜਾਂਚ ਦਾ ਇਤਿਹਾਸ ਦਿਖਾਓ'], home: ['ਡੈਸ਼ਬੋਰਡ ’ਤੇ ਜਾਓ'] }
};

const intentLabels: Record<Intent, TranslationKey> = {
  scan: 'scanIntent', screenshot: 'screenshotIntent', explain: 'explainIntent', read: 'readIntent',
  language: 'languageIntent', help: 'helpIntent', history: 'historyIntent', home: 'homeIntent'
};

function parseIntent(text: string, language: LanguageCode): Intent | undefined {
  const command = text.toLocaleLowerCase(language);
  const priority: Intent[] = ['screenshot', 'read', 'explain', 'help', 'history', 'language', 'home', 'scan'];
  return priority.find((intent) => intentPhrases[language][intent].some((phrase) => command.includes(phrase.toLocaleLowerCase(language))));
}

function getRecognitionConstructor() {
  const speechWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export const QuickAssistant = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { history } = useScanHistory();
  const { enabled, setEnabled, rate, setRate, voiceURI, setVoiceURI, matchingVoices, speak, stop } = useVoiceSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [recognized, setRecognized] = useState('');
  const [response, setResponse] = useState('');
  const [showLanguages, setShowLanguages] = useState(false);
  const recognitionRef = useRef<RecognitionController | null>(null);

  useEffect(() => {
    const openAssistant = () => setIsOpen(true);
    window.addEventListener('ghostsignal:open-assistant', openAssistant);
    return () => window.removeEventListener('ghostsignal:open-assistant', openAssistant);
  }, []);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
    stop();
  }, [language]);

  const goTo = (path: string) => {
    recognitionRef.current?.abort();
    setIsListening(false);
    setIsOpen(false);
    navigate(path);
  };

  const speakLatest = () => {
    const latest = history[0];
    if (!latest) {
      setResponse(t('noScans'));
      return;
    }
    const riskKey = latest.riskLevel === 'HIGH' ? 'riskSummaryHigh' : latest.riskLevel === 'MEDIUM' ? 'riskSummaryMedium' : 'riskSummaryLow';
    const spoken = `${t(riskKey)} ${t('safetyOtp')} ${t('safetyUpi')}`;
    const didSpeak = speak(spoken, true);
    setResponse(didSpeak ? t('assistantResponse') : t('voiceUnavailable'));
  };

  const executeIntent = (intent: Intent, command?: string) => {
    const phrase = t(intentLabels[intent]);
    setResponse(phrase);

    if (intent === 'language') {
      const target = LANGUAGES.find((item) => command?.toLowerCase().includes(item.name.toLowerCase()) || command?.includes(item.native));
      if (target) {
        setLanguage(target.code);
        setResponse(catalogs[target.code].languageChanged);
      } else {
        setShowLanguages(true);
      }
      return;
    }

    if (intent === 'screenshot') return goTo('/scanner?mode=screenshot');
    if (intent === 'scan') return goTo('/scanner');
    if (intent === 'help') return goTo('/help');
    if (intent === 'history') return goTo('/history');
    if (intent === 'home') return goTo('/');
    if (intent === 'explain') {
      const latest = history[0];
      return latest ? goTo(`/results?id=${latest.id}`) : setResponse(t('noScans'));
    }
    if (intent === 'read') {
      speakLatest();
    }
  };

  const startListening = () => {
    const SpeechRecognition = getRecognitionConstructor();
    if (!SpeechRecognition) {
      setStatus(t('speechUnavailable'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES.find((item) => item.code === language)?.speech ?? 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? '').join(' ').trim();
      if (!transcript) return;
      setRecognized(transcript);
      const intent = parseIntent(transcript, language);
      if (intent) {
        setStatus(t('processing'));
        executeIntent(intent, transcript);
      } else if (event.results[event.results.length - 1]?.[0]?.transcript) {
        setResponse(t('intentUnknown'));
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setStatus(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? t('micDenied') : t('speechUnavailable'));
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setRecognized('');
    setResponse('');
    setStatus(t('listening'));
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setStatus(t('speechUnavailable'));
    }
  };

  const runTouchIntent = (intent: Intent) => {
    setResponse(t(intentLabels[intent]));
    executeIntent(intent);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            id="ghostsignal-assistant-panel"
            aria-label="GhostSignal assistant actions"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="assistant-window mb-3 max-h-[calc(100dvh-6rem)] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain p-4 shadow-2xl shadow-black/50"
          >
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-white">{t('assistantName')}</h2>
                <p className="mt-1 text-xs text-slate-400">{t('assistantIntro')}</p>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close assistant" className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mb-3 rounded-xl border border-cyan-900/80 bg-slate-950/60 p-3">
              <button onClick={isListening ? () => { recognitionRef.current?.abort(); setIsListening(false); setStatus(''); } : startListening} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span>{isListening ? t('stopListening') : t('startListening')}</span>
              </button>
              <div aria-live="polite" className="mt-2 space-y-1 text-xs text-slate-300">
                {status && <p>{status}</p>}
                {recognized && <p><span className="text-slate-500">{t('recognizedSpeech')}: </span>{recognized}</p>}
                {response && <p><span className="text-slate-500">{t('assistantResponse')}: </span>{response}</p>}
              </div>
              {response && <button onClick={() => speak(response, true)} className="mt-2 inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200"><Volume2 className="h-4 w-4" />{t('replay')}</button>}
            </div>
            <div className="mb-3 space-y-2 border-b border-slate-800 pb-3">
              {(['scan', 'screenshot', 'explain', 'read', 'language', 'help', 'history', 'home'] as Intent[]).map((intent) => (
                <button key={intent} onClick={() => runTouchIntent(intent)} className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">
                  {intent === 'scan' || intent === 'screenshot' ? <ScanLine className="h-4 w-4 text-cyan-300" /> : intent === 'history' ? <Clock3 className="h-4 w-4 text-cyan-300" /> : intent === 'language' ? <Languages className="h-4 w-4 text-cyan-300" /> : intent === 'help' ? <Phone className="h-4 w-4 text-rose-300" /> : <LockKeyhole className="h-4 w-4 text-cyan-300" />}
                  <span>{t(intentLabels[intent])}</span>
                </button>
              ))}
              {showLanguages && (
                <div className="rounded-md border border-slate-700 p-2">
                  <label className="mb-1 block text-xs text-slate-400" htmlFor="assistant-language">{t('chooseLanguage')}</label>
                  <select id="assistant-language" value={language} onChange={(event) => { setLanguage(event.target.value as LanguageCode); setShowLanguages(false); }} className="w-full rounded bg-slate-950 px-2 py-2 text-sm text-white">
                    {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-2 border-b border-slate-800 pb-3">
              <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2"><Volume2 className="h-4 w-4 text-cyan-300" />{t('voiceAlerts')}</span>
                <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
              </label>
              <label className="block text-xs text-slate-400">{t('speechRate')}
                <input type="range" min="0.75" max="1.25" step="0.05" value={rate} onChange={(event) => setRate(Number(event.target.value))} className="mt-1 w-full accent-cyan-400" />
              </label>
              <label className="block text-xs text-slate-400">{t('voice')}
                <select value={voiceURI} onChange={(event) => setVoiceURI(event.target.value)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white">
                  <option value="">{t('voiceDefault')}</option>
                  {matchingVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>)}
                </select>
              </label>
              {!matchingVoices.length && <p className="text-xs text-amber-200">{t('voiceUnavailable')}</p>}
            </div>
            <a href="tel:1930" className="mt-3 flex items-center gap-3 rounded-md px-2 py-2.5 text-sm text-slate-200 hover:bg-slate-800">
              <Phone className="h-4 w-4 text-rose-300" /><span>{t('callHelpline')} · 1930</span>
            </a>
            <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm text-slate-200 hover:bg-slate-800">
              <span>{t('reportingPortal')}</span><ArrowUpRight className="h-4 w-4 text-slate-400" />
            </a>
            <p className="mt-3 border-t border-slate-800 pt-3 text-[11px] leading-4 text-slate-500">{t('assistantDisclosure')}</p>
          </motion.section>
        )}
      </AnimatePresence>
      <button
        aria-expanded={isOpen}
        aria-controls="ghostsignal-assistant-panel"
        onClick={() => {
          if (isOpen) {
            recognitionRef.current?.abort();
            setIsListening(false);
            stop();
          }
          setIsOpen((open) => !open);
        }}
        className="ml-auto flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-300"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        <span>{isOpen ? t('cancel') : t('assistant')}</span>
      </button>
    </div>
  );
};