import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldLogo } from '../components/ShieldLogo';
import { analyzeMessageInput } from '../utils/riskEngine';
import { apiService } from '../services/api';
import { useScanHistory } from '../hooks/useScanHistory';
import { useLanguage, type TranslationKey } from '../i18n';
import { 
  CheckCircle2, 
  Loader2, 
  Clock, 
  Cpu, 
  Link as LinkIcon, 
  KeyRound, 
  FileCheck,
  FastForward,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface AnalysisState {
  text?: string;
  language?: string;
  sourceType?: 'text' | 'screenshot' | 'voice';
  sampleId?: string;
  screenshotUrl?: string;
}

const STAGES: Array<{ id: number; title: TranslationKey; icon: React.ElementType; durationMs: number }> = [
  { id: 1, title: 'stageRead', icon: FileCheck, durationMs: 450 },
  { id: 2, title: 'stageSignals', icon: Cpu, durationMs: 500 },
  { id: 3, title: 'stageUrgency', icon: Clock, durationMs: 450 },
  { id: 4, title: 'stageSignals', icon: LinkIcon, durationMs: 450 },
  { id: 5, title: 'stageCredentials', icon: KeyRound, durationMs: 500 },
  { id: 6, title: 'stagePrepare', icon: ShieldCheck, durationMs: 450 }
];

export const Analysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const state = (location.state || {}) as AnalysisState;
  const { saveScan } = useScanHistory();

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const completedRef = useRef(false);
  const scanPromiseRef = useRef<Promise<any> | null>(null);

  if (!location.state) return <Navigate to="/scanner" replace />;

  const messageText = state.text?.trim() || '';
  const scanLanguage = state.language || 'English';
  const sourceType = state.sourceType || 'text';
  const sampleId = state.sampleId;
  const screenshotUrl = state.screenshotUrl;

  // Initiate scan in the background concurrently
  useEffect(() => {
    if (messageText) {
      scanPromiseRef.current = apiService.scanText(messageText, scanLanguage, sourceType);
    }
  }, [messageText, scanLanguage, sourceType]);

  // Progress animation runner
  useEffect(() => {
    let active = true;
    const totalDuration = STAGES.reduce((acc, s) => acc + s.durationMs, 0);
    const intervalTime = 50;
    const progressIncrement = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + progressIncrement, 100));
    }, intervalTime);

    let accumulated = 0;
    STAGES.forEach((stage, idx) => {
      accumulated += stage.durationMs;
      setTimeout(() => {
        if (active) {
          setCurrentStageIndex(idx);
          if (idx === STAGES.length - 1) {
            setTimeout(() => {
              if (active) {
                completeAnalysis();
              }
            }, stage.durationMs);
          }
        }
      }, accumulated - stage.durationMs);
    });

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const completeAnalysis = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsCompleted(true);

    let result;
    try {
      if (scanPromiseRef.current) {
        result = await scanPromiseRef.current;
      } else if (messageText) {
        result = await apiService.scanText(messageText, scanLanguage, sourceType);
      }
    } catch (e) {
      console.warn('[Analysis] Falling back to local offline engine:', e);
      result = analyzeMessageInput(messageText, scanLanguage, sourceType, sampleId, screenshotUrl);
    }

    if (!result) {
      result = analyzeMessageInput(messageText, scanLanguage, sourceType, sampleId, screenshotUrl);
    }

    if (screenshotUrl && !result.screenshotUrl) {
      result.screenshotUrl = screenshotUrl;
    }
    if (sampleId) {
      result.sampleName = sampleId;
    }

    saveScan({ ...result });

    navigate('/results', {
      replace: true,
      state: { result }
    });
  };

  const handleSkip = () => {
    completeAnalysis();
  };

  return (
    <div className="min-h-screen bg-(--app-bg) text-(--app-text) py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center transition-colors duration-200">
      <div className="max-w-2xl w-full space-y-8">
        {/* Animated Shield Header */}
        <div className="text-center space-y-4">
          <motion.div className="inline-flex relative" animate={{ scale: [1, 1.035, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <ShieldLogo size="xl" pulse className="animate-shield-glow" />
          </motion.div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-(--app-primary)">
              {t('localRules')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-(--app-text)">
              {t('analysisTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-(--app-text-muted) max-w-md mx-auto">
              {t('localRules')}. {t('aiUnavailable')}
            </p>
          </div>
        </div>

        {/* Central Progress Card */}
        <div className="p-6 rounded-2xl bg-(--app-surface) border border-(--app-border) shadow-xl space-y-6">
          {/* Progress Bar & Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--app-text) font-semibold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-(--app-primary)" />
                {t(STAGES[currentStageIndex]?.title ?? 'stagePrepare')}...
              </span>
              <span className="text-(--app-primary) font-bold tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-(--app-surface-secondary) overflow-hidden">
              <motion.div 
                className="h-full bg-(--app-primary) rounded-full transition-all duration-100 ease-out"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Sequential Stage Indicators */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-mono text-(--app-text-muted) uppercase tracking-wider block">
              {t('analysisTitle')}:
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {STAGES.map((stage, idx) => {
                const isPassed = currentStageIndex > idx || isCompleted || progress >= 100;
                const isCurrent = currentStageIndex === idx && !isPassed;
                const Icon = stage.icon;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all duration-300 ${
                      isPassed
                        ? 'bg-(--app-surface-secondary)/80 border-(--app-primary)/30 text-(--app-text)'
                        : isCurrent
                        ? 'bg-(--app-surface) border-(--app-primary) text-(--app-primary) shadow-sm'
                        : 'bg-(--app-surface)/40 border-(--app-border)/60 text-(--app-text-muted) opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isPassed ? 'text-(--app-primary) bg-(--app-surface-secondary)' :
                        isCurrent ? 'text-(--app-primary) bg-(--app-surface-secondary)' :
                        'text-(--app-text-muted) bg-(--app-surface-secondary)'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium font-sans">
                        {idx + 1}. {t(stage.title)}
                      </span>
                    </div>

                    <div className="shrink-0 font-mono text-[11px]">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1 text-(--app-primary) font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="sr-only">{t('result')}</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-(--app-primary) font-semibold">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{t('processing')}</span>
                        </span>
                      ) : (
                        <span className="text-(--app-text-muted)" aria-label={t('startScan')}>•••</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Capability notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-(--app-surface-secondary) border border-(--app-border) text-[11px] text-(--app-text-muted) leading-relaxed font-mono">
            <AlertCircle className="w-4 h-4 text-(--app-primary) shrink-0 mt-0.5" />
            <div>
              <span className="text-(--app-text) font-semibold">{t('riskNote')} </span>
              {t('localRules')}. {t('aiUnavailable')} {t('ocrUnavailable')}
            </div>
          </div>

          {/* Continue to the completed check */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 text-xs text-(--app-text-muted) hover:text-(--app-primary) font-mono transition-colors cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{t('result')} &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
