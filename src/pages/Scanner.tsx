import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { SAMPLE_MESSAGES } from '../data/sampleMessages';
import { LANGUAGES, useLanguage, getVoiceMessageLabel } from '../i18n';
import { analyzeMessageInput } from '../utils/riskEngine';
import { apiService } from '../services/api';
import { useScanHistory } from '../hooks/useScanHistory';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  MicOff,
  Trash2, 
  ShieldAlert, 
  Sparkles, 
  AlertCircle,
  Loader2,
  ScanLine,
  ArrowRight,
  Eye,
  FileSearch,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Volume2
} from 'lucide-react';

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const { saveScan } = useScanHistory();
  const initialSampleId = searchParams.get('sample');

  const [inputMode, setInputMode] = useState<'text' | 'screenshot' | 'voice'>(
    searchParams.get('mode') === 'screenshot' ? 'screenshot' : searchParams.get('mode') === 'voice' ? 'voice' : 'text'
  );
  const [messageText, setMessageText] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(undefined);
  
  // Screenshot upload & OCR states
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [ocrEngineUsed, setOcrEngineUsed] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & loading states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  // Voice Speech Recognition Hook
  const {
    isListening,
    status: speechStatus,
    recognizedText,
    startListening,
    stopListening
  } = useSpeechRecognition((transcript) => {
    setMessageText((prev) => {
      const cleanPrev = prev.trim();
      return cleanPrev ? `${cleanPrev} ${transcript}` : transcript;
    });
    setValidationError(null);
  });

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

  useEffect(() => {
    if (initialSampleId) {
      loadSample(initialSampleId);
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
    if (isListening) {
      stopListening();
    }
    setMessageText('');
    setScreenshotPreview(null);
    setScreenshotName('');
    setUploadedImageFile(null);
    setOcrEngineUsed(null);
    setOcrError(null);
    setSelectedSampleId(undefined);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageFile = async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setValidationError('Please choose a PNG, JPG, or WebP image.');
      return;
    }
    setUploadedImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setScreenshotPreview(dataUrl);
      setScreenshotName(file.name);
      setValidationError(null);
    };
    reader.readAsDataURL(file);

    // Run On-Device OCR text extraction automatically
    setIsExtractingOcr(true);
    setOcrError(null);
    setScanStep('Running on-device OCR on screenshot...');
    try {
      const ocrRes = await apiService.extractImageText(file);
      if (ocrRes.success && ocrRes.text) {
        setMessageText(ocrRes.text);
        setOcrEngineUsed(ocrRes.engine || 'winocr_windows_native');
      } else {
        setOcrEngineUsed(null);
        if (ocrRes.error) {
          setOcrError(ocrRes.error);
        }
      }
    } catch (err) {
      console.warn('Live OCR extraction error:', err);
    } finally {
      setIsExtractingOcr(false);
      setScanStep('');
    }
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

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      setValidationError(null);
      startListening();
    }
  };

  const handleStartScan = async () => {
    if (isListening) {
      stopListening();
    }

    if ((inputMode === 'text' || inputMode === 'voice') && !messageText.trim()) {
      setValidationError(inputMode === 'voice' ? t('startListening') : t('pasteMessage'));
      return;
    }

    if (inputMode === 'screenshot' && !screenshotPreview && !messageText.trim()) {
      setValidationError('Please upload a screenshot image or paste message text.');
      return;
    }

    setValidationError(null);
    setIsScanning(true);

    try {
      const langName = LANGUAGES.find((item) => item.code === language)?.name ?? 'English';
      let result;

      if (inputMode === 'screenshot' && uploadedImageFile) {
        setScanStep('Sending screenshot to OCR and Threat Detection Engine...');
        result = await apiService.scanImage(uploadedImageFile, langName);
      } else {
        setScanStep('Running Unicode Shield & character normalization...');
        result = await apiService.scanText(messageText.trim(), langName, inputMode === 'voice' ? 'voice' : 'text');
      }

      if (screenshotPreview && !result.screenshotUrl) {
        result.screenshotUrl = screenshotPreview;
      }
      if (selectedSampleId) {
        result.sampleName = selectedSampleId;
      }

      saveScan(result);

      navigate('/results', {
        state: { result }
      });
    } catch (err) {
      console.error('[Scanner] Scan execution error:', err);
      // Fallback
      const langName = LANGUAGES.find((item) => item.code === language)?.name ?? 'English';
      const fallbackResult = analyzeMessageInput(
        messageText.trim(),
        langName,
        inputMode,
        selectedSampleId,
        screenshotPreview || undefined
      );
      saveScan(fallbackResult);
      navigate('/results', { state: { result: fallbackResult } });
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const currentLangObj = LANGUAGES.find(l => l.code === language);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-7 text-(--app-text)">
      {/* Header */}
      <div className="border-b border-(--app-border) pb-5">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-(--app-primary) mb-1.5">
          <ShieldAlert className="w-4 h-4" />
          <span>Local Engine · Zero Network Exposure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--app-text)">
          {t('scannerTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-(--app-text-muted) mt-1">
          {t('scannerDescription')}
        </p>

        {/* Local AI Engine Status Pill & Model Window Link */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-(--app-border)/60">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--app-primary)/30 bg-(--app-primary)/10 px-3 py-1 text-xs font-semibold text-(--app-primary)">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--app-success) opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-(--app-success)"></span>
            </span>
            <Cpu className="w-3.5 h-3.5 text-(--app-primary)" />
            <span>AI Engine: <strong>SmolLM3-3B Quantized</strong> (Offline Local AI)</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/model-studio"
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Open Model Window</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-[11px] font-mono text-(--app-text-muted) hidden sm:inline">
              WinOCR · Mic Active
            </span>
          </div>
        </div>
      </div>

      {/* Input Method Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-1">
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              setInputMode('text');
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              inputMode === 'text'
                ? 'bg-(--app-card) text-(--app-primary) shadow-2xs'
                : 'text-(--app-text-muted) hover:text-(--app-text)'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pasted Text</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              setInputMode('screenshot');
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              inputMode === 'screenshot'
                ? 'bg-(--app-card) text-(--app-primary) shadow-2xs'
                : 'text-(--app-text-muted) hover:text-(--app-text)'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Screenshot OCR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('voice');
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              inputMode === 'voice'
                ? 'bg-(--app-card) text-(--app-primary) shadow-2xs'
                : 'text-(--app-text-muted) hover:text-(--app-text)'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-(--app-danger) animate-pulse' : ''}`} />
            <span>Voice / Mic</span>
          </button>
        </div>

        {/* Clear Option */}
        {(messageText || screenshotPreview) && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--app-danger) hover:opacity-80 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear / Reset</span>
          </button>
        )}
      </div>

      {/* Sample Message Quick Buttons */}
      <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--app-text) flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-(--app-secondary)" />
            <span>{t('examples')}:</span>
          </span>
          <span className="text-[11px] text-(--app-text-muted)">Click to load into scanner</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_MESSAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadSample(s.id)}
              disabled={isScanning}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedSampleId === s.id
                  ? 'border-(--app-primary) bg-(--app-surface-secondary) text-(--app-primary) font-semibold'
                  : 'border-(--app-border) bg-(--app-surface-secondary) text-(--app-text-muted) hover:text-(--app-text) hover:border-(--app-primary)'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        {/* TEXT INPUT MODE */}
        {inputMode === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="message-text" className="block text-xs font-bold uppercase tracking-wider text-(--app-text-muted)">
                Message Text to Scan
              </label>
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition cursor-pointer ${
                  isListening
                    ? 'border-(--app-danger) bg-(--app-danger)/15 text-(--app-danger) animate-pulse'
                    : 'border-(--app-border) bg-(--app-surface-secondary) text-(--app-primary) hover:border-(--app-primary)'
                }`}
                title={isListening ? 'Stop listening' : 'Dictate with microphone'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5 text-(--app-danger)" /> : <Mic className="w-3.5 h-3.5 text-(--app-primary)" />}
                <span>{isListening ? 'Stop Recording' : 'Dictate with Mic'}</span>
              </button>
            </div>
            <textarea
              id="message-text"
              rows={6}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                setSelectedSampleId(undefined);
                setValidationError(null);
              }}
              disabled={isScanning}
              placeholder="Paste suspicious SMS, WhatsApp message, email excerpt, or URL here..."
              className="w-full rounded-2xl border border-(--app-border) bg-(--app-surface-secondary) p-4 text-sm font-mono text-(--app-text) placeholder:text-(--app-text-muted)/60 focus:outline-none focus:ring-2 focus:ring-(--app-primary) transition resize-y"
            />
            {isListening && (
              <div className="rounded-xl border border-(--app-danger)/30 bg-(--app-danger)/10 p-2.5 flex items-center justify-between text-xs text-(--app-danger)">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-(--app-danger) animate-ping" />
                  <strong>Listening:</strong> {recognizedText || 'Speak now...'}
                </span>
                <span className="font-mono text-[10px]">{currentLangObj?.name || 'English'}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-(--app-text-muted)">
              <span>Supports multilingual input & Unicode characters</span>
              <span>{messageText.length} characters</span>
            </div>
          </div>
        )}

        {/* VOICE INPUT MODE */}
        {inputMode === 'voice' && (
          <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-6 sm:p-8 text-center space-y-6 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-(--app-text)">
                Voice Message Dictation
              </h3>
              <p className="text-xs text-(--app-text-muted) max-w-md mx-auto">
                Speak or play a suspicious audio message. GhostSignal transcribes it locally using on-device speech recognition without sending audio to third parties.
              </p>
            </div>

            {/* Big Interactive Mic Button */}
            <div className="flex flex-col items-center justify-center py-4">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full transition shadow-lg cursor-pointer ${
                  isListening
                    ? 'bg-(--app-danger) text-white scale-105 shadow-(--app-danger)/30 animate-pulse'
                    : 'bg-(--app-primary) text-(--app-on-primary) hover:scale-105 shadow-(--app-primary)/30'
                }`}
              >
                {isListening ? (
                  <>
                    <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-60"></span>
                    <MicOff className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </>
                ) : (
                  <Mic className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                )}
              </button>

              <div className="mt-4 space-y-1">
                <span className={`text-sm font-bold block ${isListening ? 'text-(--app-danger) animate-pulse' : 'text-(--app-text)'}`}>
                  {isListening ? 'Listening... Speak your message now' : 'Tap to Start Speaking'}
                </span>
                <span className="text-xs text-(--app-text-muted) block">
                  Language: <strong>{currentLangObj?.name || 'English'} ({currentLangObj?.native || 'Default'})</strong>
                </span>
              </div>
            </div>

            {/* Audio Waveform Animation when listening */}
            {isListening && (
              <div className="flex items-center justify-center gap-1.5 h-6">
                {[40, 70, 100, 60, 90, 45, 80, 55, 95, 30].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-(--app-danger) rounded-full animate-bounce"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: '0.6s'
                    }}
                  />
                ))}
              </div>
            )}

            {speechStatus && (
              <p className="text-xs font-medium text-(--app-primary)">
                {speechStatus}
              </p>
            )}

            {/* Transcribed text box */}
            <div className="space-y-2 text-left">
              <label htmlFor="voice-message-text" className="block text-xs font-bold uppercase tracking-wider text-(--app-text-muted)">
                Transcribed Message Text
              </label>
              <textarea
                id="voice-message-text"
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={isListening ? 'Listening... (Speak words like OTP, KYC, UPI, bank, urgency)' : 'Your spoken words will appear here...'}
                className="w-full rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5 text-xs font-mono text-(--app-text) placeholder:text-(--app-text-muted)/60 focus:outline-none focus:ring-2 focus:ring-(--app-primary)"
              />
            </div>
          </div>
        )}

        {/* SCREENSHOT OCR INPUT MODE */}
        {inputMode === 'screenshot' && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                isDragging 
                  ? 'border-(--app-primary) bg-(--app-surface-secondary)' 
                  : 'border-(--app-border) bg-(--app-surface-secondary) hover:border-(--app-primary)'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />
              <ImageIcon className="h-8 w-8 text-(--app-primary) mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-(--app-text)">
                {screenshotName ? screenshotName : 'Click to select or drag and drop a screenshot'}
              </p>
              <p className="text-xs text-(--app-text-muted) mt-1">
                PNG, JPG, or WebP screenshot images · Automated on-device OCR extraction
              </p>
            </div>

            {/* OCR Extracting Spinner */}
            {isExtractingOcr && (
              <div className="rounded-xl border border-(--app-primary)/40 bg-(--app-primary)/10 p-4 flex items-center justify-center gap-3 text-xs font-bold text-(--app-primary)">
                <Loader2 className="h-4 w-4 animate-spin text-(--app-primary)" />
                <span>Running on-device OCR on screenshot (Windows Native / Local)...</span>
              </div>
            )}

            {/* Screenshot Preview */}
            {screenshotPreview && (
              <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-(--app-text) flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-(--app-primary)" />
                    Screenshot Preview
                  </span>
                  <span className="text-[11px] text-(--app-text-muted)">{screenshotName}</span>
                </div>
                <div className="max-h-72 overflow-hidden rounded-xl border border-(--app-border) bg-black/5 flex items-center justify-center p-2">
                  <img
                    src={screenshotPreview}
                    alt="Uploaded screenshot preview"
                    className="max-h-72 w-auto object-contain rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* OCR Extraction Status Banner */}
            {ocrEngineUsed && messageText && (
              <div className="rounded-xl border border-(--app-success)/30 bg-(--app-success)/10 p-3.5 flex items-start gap-3 text-xs">
                <CheckCircle2 className="w-4 h-4 text-(--app-success) shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-(--app-text) flex items-center gap-2">
                    <span>Text Successfully Extracted via On-Device OCR</span>
                    <span className="rounded-md bg-(--app-success)/20 px-2 py-0.5 text-[10px] font-mono text-(--app-success)">
                      {ocrEngineUsed === 'winocr_windows_native' ? 'Windows Native OCR' : ocrEngineUsed}
                    </span>
                  </p>
                  <p className="text-(--app-text-muted) leading-relaxed">
                    Text extracted from the screenshot is loaded below. You can verify or edit the text before scanning.
                  </p>
                </div>
              </div>
            )}

            {screenshotPreview && !messageText && !isExtractingOcr && (
              <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5 flex items-start gap-3 text-xs">
                <FileSearch className="w-4 h-4 text-(--app-primary) shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-(--app-text)">No text detected automatically</p>
                  <p className="text-(--app-text-muted) leading-relaxed">
                    {ocrError || 'Ensure the image has clear contrast, or paste the message text manually below for threat analysis.'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="screenshot-notes" className="block text-xs font-bold uppercase tracking-wider text-(--app-text-muted)">
                  Extracted / Transcribed Message Text
                </label>
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition cursor-pointer ${
                    isListening
                      ? 'border-(--app-danger) bg-(--app-danger)/15 text-(--app-danger) animate-pulse'
                      : 'border-(--app-border) bg-(--app-surface-secondary) text-(--app-primary) hover:border-(--app-primary)'
                  }`}
                  title={isListening ? 'Stop listening' : 'Dictate with microphone'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5 text-(--app-danger)" /> : <Mic className="w-3.5 h-3.5 text-(--app-primary)" />}
                  <span>{isListening ? 'Stop Recording' : 'Add with Mic'}</span>
                </button>
              </div>
              <textarea
                id="screenshot-notes"
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Extracted text from your screenshot will appear here automatically..."
                className="w-full rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5 text-xs font-mono text-(--app-text) placeholder:text-(--app-text-muted)/60 focus:outline-none focus:ring-2 focus:ring-(--app-primary)"
              />
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div className="rounded-xl border border-(--app-danger)/30 bg-(--app-danger)/10 p-3.5 text-xs text-(--app-danger) flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartScan}
          disabled={isScanning || isExtractingOcr}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-(--app-primary) text-(--app-on-primary) py-4 px-6 text-sm font-bold shadow-sm transition hover:opacity-95 active:scale-[0.99] cursor-pointer disabled:opacity-70"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{scanStep || 'Scanning message...'}</span>
            </>
          ) : (
            <>
              <ScanLine className="w-5 h-5" />
              <span>Scan Message Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
