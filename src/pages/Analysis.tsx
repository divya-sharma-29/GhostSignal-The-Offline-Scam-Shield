import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldLogo } from '../components/ShieldLogo';
import { analyzeMessageInput } from '../utils/riskEngine';
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
  sourceType?: 'text' | 'screenshot';
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
  const { t, language } = useLanguage();
  const state = (location.state || {}) as AnalysisState;
  const { saveScan } = useScanHistory();

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const completedRef = useRef(false);

  if (!location.state) return <Navigate to="/scanner" replace />;

  // If no text was passed, fallback to default sample or redirect
  const messageText = state.text?.trim() || '';
  const scanLanguage = state.language || 'English';
  const sourceType = state.sourceType || 'text';
  const sampleId = state.sampleId;
  const screenshotUrl = state.screenshotUrl;

  // Run simulated step progression
  useEffect(() => {
    let active = true;
    const totalDuration = STAGES.reduce((acc, s) => acc + s.durationMs, 0);
    const intervalTime = 50;
    const progressIncrement = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + progressIncrement, 100);
        return next;
      });
    }, intervalTime);

    // Stage progression runner
    let accumulated = 0;
    STAGES.forEach((stage, idx) => {
      accumulated += stage.durationMs;
      setTimeout(() => {
        if (active) {
          setCurrentStageIndex(idx);
          if (idx === STAGES.length - 1) {
            // Last stage done
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

  const completeAnalysis = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsCompleted(true);
    // Compute result
    const result = analyzeMessageInput(
      messageText,
      scanLanguage,
      sourceType,
      sampleId,
      screenshotUrl
    );

    // Save to persistent localStorage history
    saveScan({ ...result, screenshotUrl: undefined });

    // Navigate to results
    navigate('/results', {
      replace: true,
      state: { result }
    });
  };

  const handleSkip = () => {
    completeAnalysis();
  };

  return (
    <div className="min-h-screen bg-[#0B111E] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full space-y-8">
        {/* Animated Shield Header */}
        <div className="text-center space-y-4">
          <motion.div className="inline-flex relative" animate={{ scale: [1, 1.035, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <ShieldLogo size="xl" pulse className="animate-shield-glow" />
          </motion.div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              {t('localRules')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('analysisTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              {t('localRules')}. {t('aiUnavailable')}
            </p>
          </div>
        </div>

        {/* Central Progress Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-6">
          {/* Progress Bar & Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                {t(STAGES[currentStageIndex]?.title ?? 'stagePrepare')}...
              </span>
              <span className="text-cyan-400 font-bold tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-100 ease-out"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Sequential Stage Indicators (Strict order from instructions) */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Execution Sequence:
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
                        ? 'bg-slate-950/70 border-emerald-500/30 text-slate-200'
                        : isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-sm'
                        : 'bg-slate-950/30 border-slate-800/60 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isPassed ? 'text-emerald-400 bg-emerald-950/50' :
                        isCurrent ? 'text-cyan-400 bg-cyan-950/60' :
                        'text-slate-500 bg-slate-900'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium font-sans">
                        {idx + 1}. {t(stage.title)}
                      </span>
                    </div>

                    <div className="shrink-0 font-mono text-[11px]">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Scanning</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transparent Simulation Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-mono">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-200 font-semibold">{t('riskNote')} </span>
              {t('localRules')}. {t('aiUnavailable')} {t('ocrUnavailable')}
            </div>
          </div>

          {/* Presentation Convenience: Skip Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
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
