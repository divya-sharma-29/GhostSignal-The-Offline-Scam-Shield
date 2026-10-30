import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SAMPLE_MESSAGES } from '../data/sampleMessages';
import { getSampleLabel, getVoiceMessageLabel, LANGUAGES, useLanguage } from '../i18n';
import { 
  FileText, 
  Image as ImageIcon, 
  Mic,
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  Info, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const initialSampleId = searchParams.get('sample');

  const [inputMode, setInputMode] = useState<'text' | 'screenshot' | 'voice'>(
    searchParams.get('mode') === 'screenshot' ? 'screenshot' : searchParams.get('mode') === 'voice' ? 'voice' : 'text'
  );
  const [messageText, setMessageText] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(undefined);
  
  // Screenshot upload states
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation error state
  const [validationError, setValidationError] = useState<string | null>(null);
  useEffect(() => {
    const handleVoiceTranscript = (event: Event) => {
      const transcript = (event as CustomEvent<string>).detail;
      if (!transcript) return;
      setMessageText(transcript);
      setSelectedSampleId(undefined);
      setValidationError(null);
    };
    window.addEventListener('ghostsignal:voice-message-transcript', handleVoiceTranscript);
    return () => window.removeEventListener('ghostsignal:voice-message-transcript', handleVoiceTranscript);
  }, []);

  // If navigated with sample query param, load that sample automatically
  useEffect(() => {
    if (initialSampleId) {
      const found = SAMPLE_MESSAGES.find(s => s.id === initialSampleId);
      if (found) {
        loadSample(found.id);
      }
    }
  }, [initialSampleId]);

  const loadSample = (sampleId: string) => {
    const sample = SAMPLE_MESSAGES.find(s => s.id === sampleId);
    if (sample) {
      setMessageText(sample.text);
      setSelectedSampleId(sample.id);
      setValidationError(null);
    }
  };

  const handleClear = () => {
    setMessageText('');
    setScreenshotPreview(null);
    setScreenshotName('');
    setSelectedSampleId(undefined);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageFile = (file: File) => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setValidationError(t('chooseImage'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setScreenshotPreview(dataUrl);
      setScreenshotName(file.name);
      setValidationError(null);

    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartScan = () => {
    if ((inputMode === 'text' || inputMode === 'voice') && !messageText.trim()) {
      setValidationError(inputMode === 'voice' ? t('startListening') : t('pasteMessage'));
      return;
    }

    if (inputMode === 'screenshot' && !screenshotPreview && !messageText.trim()) {
      setValidationError(t('chooseImage'));
      return;
    }

    setValidationError(null);

    // Navigate to /analysis with payload
    navigate('/analysis', {
      state: {
        text: messageText.trim(),
        language: LANGUAGES.find((item) => item.code === language)?.name ?? 'English',
              sourceType: inputMode,
        sampleId: selectedSampleId,
        screenshotUrl: screenshotPreview
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0B111E] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>{t('localRules')}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t('scannerTitle')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('scannerDescription')}
          </p>
        </div>

        {/* Input Method Switcher */}
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-full grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 sm:flex sm:w-auto sm:items-center sm:gap-2">
            <button
              onClick={() => setInputMode('text')}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-xs font-semibold leading-tight transition-all cursor-pointer sm:gap-2 sm:px-4 ${
                inputMode === 'text'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('pastedText')}</span>
            </button>
            <button
              onClick={() => setInputMode('screenshot')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'screenshot'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t('screenshot')}</span>
            </button>
            <button
              onClick={() => setInputMode('voice')}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-xs font-semibold leading-tight transition-all cursor-pointer sm:gap-2 sm:px-4 ${inputMode === 'voice' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{getVoiceMessageLabel(language)}</span>
            </button>
          </div>

          <div className="self-end text-xs text-slate-400 sm:self-auto">{t('language')}: {LANGUAGES.find((item) => item.code === language)?.native}</div>
        </div>

        {/* Sample Message Quick Buttons */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {t('examples')}:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              <button onClick={() => loadSample(SAMPLE_MESSAGES[0].id)} className="text-cyan-300 hover:text-cyan-200">{t('trySample')}</button>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {SAMPLE_MESSAGES.slice(0, 3).map((sample, index) => (
              <button
                key={sample.id}
                onClick={() => loadSample(sample.id)}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                  selectedSampleId === sample.id
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold truncate">{getSampleLabel(language, index)}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    sample.riskLevel === 'HIGH' ? 'text-red-400 bg-red-950/60' :
                    sample.riskLevel === 'MEDIUM' ? 'text-amber-300 bg-amber-950/60' :
                    'text-emerald-400 bg-emerald-950/60'
                  }`}>
                    {sample.riskLevel === 'HIGH' ? t('riskHigh') : sample.riskLevel === 'MEDIUM' ? t('riskMedium') : t('riskLow')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                  "{sample.text}"
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Input Area: Method A (Textarea) */}
        {inputMode === 'text' && (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  setSelectedSampleId(undefined);
                  if (validationError) setValidationError(null);
                }}
                rows={7}
                maxLength={2000}
                placeholder={t('pasteMessage')}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans leading-relaxed resize-y"
              />
              
              {/* Character Counter */}
              <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono tabular-nums">
                {messageText.length} / 2,000 characters
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{t('localRules')}. {t('aiUnavailable')}</span>
              </div>
              {messageText && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('clearInput')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {inputMode === 'voice' && (
          <section className="rounded-xl border border-(--app-border) bg-(--app-card) p-5 sm:p-7" aria-label={getVoiceMessageLabel(language)}>
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--app-tint) text-(--app-primary)"><Mic className="h-7 w-7" /></div>
              <h2 className="text-lg font-semibold text-white">{getVoiceMessageLabel(language)}</h2>
              <p className="text-sm text-slate-400">{t('assistantDisclosure')}</p>
              <button onClick={() => window.dispatchEvent(new Event('ghostsignal:listen-message'))} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-(--app-primary) px-6 py-3 text-sm font-semibold text-(--app-on-primary)">
                <Mic className="h-5 w-5" />{t('startListening')}
              </button>
              {messageText && <p className="w-full rounded-lg border border-(--app-border) bg-(--app-card-muted) p-4 text-left text-sm text-slate-200">{messageText}</p>}
              {!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window) && <p role="status" className="text-sm text-amber-600">{t('speechUnavailable')}</p>}
            </div>
          </section>
        )}

        {/* Input Method B (Screenshot Upload) */}
        {inputMode === 'screenshot' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
              accept="image/png,image/jpeg"
              className="hidden"
            />

            {!screenshotPreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/50'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{t('uploadScreenshot')}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  {t('chooseImage')}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t('chooseImage')}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-slate-200 truncate max-w-xs sm:max-w-md">
                      {screenshotName || 'uploaded_message_screenshot.png'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setScreenshotPreview(null);
                      setScreenshotName('');
                    }}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clearInput')}</span>
                  </button>
                </div>

                {/* Image Preview Box */}
                <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-72 bg-slate-900 flex items-center justify-center">
                  <img
                    src={screenshotPreview}
                    alt="Suspicious message screenshot preview"
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                </div>

                {/* Screenshot text-recognition availability */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">{t('ocrUnavailable')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{t('localRules')} · {t('aiUnavailable')}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleClear}
              className="w-1/2 sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {t('clearInput')}
            </button>

            <button
              onClick={handleStartScan}
              className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer font-sans"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t('scanMessage')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
