import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Maximize2, 
  Minimize2, 
  Play, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Terminal, 
  AlertTriangle,
  ExternalLink,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/api';
import { RiskBadge } from './RiskBadge';

interface ModelWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

const PRESET_QUICK_TESTS = [
  { id: 'kyc', label: 'Dotted KYC Trap', text: 'URGENT: Your Northstar b.a.n.k account is suspended. Verify k.y.c at https://parcel-fee.example.test/pay' },
  { id: 'upi', label: 'UPI Collect Scam', text: 'Approve Rs 799 collect request in your UPI app to receive your refund immediately.' },
  { id: 'otp', label: 'OTP Harvesting', text: 'Security Notice: Share your OTP 482109 with officer to stop unauthorized fund transfer.' },
  { id: 'homo', label: 'Cyrillic Homoglyph', text: 'Your b\u0430nk account will be locked. Login now at https://secure-bank.test' }
];

export const ModelWindowModal: React.FC<ModelWindowModalProps> = ({
  isOpen,
  onClose,
  initialText = ''
}) => {
  const [inputText, setInputText] = useState(initialText || PRESET_QUICK_TESTS[0].text);
  const [isInferring, setIsInferring] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialText) {
        setInputText(initialText);
        runInference(initialText);
      } else {
        runInference(inputText);
      }
    }
  }, [isOpen, initialText]);

  const runInference = async (textToRun = inputText) => {
    if (!textToRun.trim()) return;
    setIsInferring(true);
    try {
      const res = await apiService.inferModel(textToRun);
      setInferenceResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInferring(false);
    }
  };

  const handleCopyJson = () => {
    if (!inferenceResult?.verdict) return;
    navigator.clipboard.writeText(JSON.stringify(inferenceResult.verdict, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const verdict = inferenceResult?.verdict;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full ${isMaximized ? 'h-[95vh] max-w-7xl' : 'max-h-[90vh] max-w-4xl'} flex flex-col rounded-2xl border border-(--app-border) bg-(--app-card) shadow-2xl overflow-hidden text-(--app-text) transition-all duration-300`}
      >
        {/* Window Title Bar */}
        <div className="flex items-center justify-between border-b border-(--app-border) bg-(--app-surface-secondary) px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={onClose}
                className="h-3 w-3 rounded-full bg-red-500/80 hover:opacity-80 transition cursor-pointer"
                title="Close Window"
              />
              <button 
                onClick={() => setIsMaximized(!isMaximized)}
                className="h-3 w-3 rounded-full bg-amber-500/80 hover:opacity-80 transition cursor-pointer"
                title="Resize Window"
              />
              <button 
                onClick={() => runInference()}
                className="h-3 w-3 rounded-full bg-emerald-500/80 hover:opacity-80 transition cursor-pointer"
                title="Re-run Inference"
              />
            </div>
            <div className="h-4 w-px bg-(--app-border)" />
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-(--app-primary)" />
              <span className="text-xs font-mono font-bold text-(--app-text)">
                SmolLM3-3B Model Studio &middot; Application Window
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Offline Multi-Threaded CPU
            </span>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 rounded-md text-(--app-text-muted) hover:text-(--app-text) transition"
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-(--app-text-muted) hover:text-(--app-text) transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-(--app-text-muted) mr-1">Presets:</span>
            {PRESET_QUICK_TESTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setInputText(p.text);
                  runInference(p.text);
                }}
                className="rounded-lg border border-(--app-border) bg-(--app-surface-secondary) px-2.5 py-1 text-[11px] font-medium text-(--app-text) hover:border-(--app-primary) transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Prompt input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-(--app-text)">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-(--app-primary)" />
                Input Scam Payload / Prompt
              </span>
              <span className="text-[10px] font-mono text-(--app-text-muted)">
                {inputText.length} chars
              </span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste message text to analyze with SmolLM3-3B local weights..."
              rows={3}
              className="w-full rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3 text-xs sm:text-sm font-mono text-(--app-text) focus:border-(--app-primary) focus:ring-1 focus:ring-(--app-primary) focus:outline-hidden transition"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => runInference()}
              disabled={isInferring || !inputText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-(--app-primary) px-4 py-2 text-xs font-bold text-(--app-on-primary) hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isInferring ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Evaluating Tokens...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run Working Model</span>
                </>
              )}
            </button>

            {verdict && (
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 text-xs font-semibold text-(--app-primary) hover:underline cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          {/* Live Verdict Display */}
          {verdict && (
            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--app-border) pb-2.5">
                <div className="flex items-center gap-2">
                  <RiskBadge level={verdict.risk_level || 'LOW'} size="sm" />
                  <span className="text-xs font-mono font-bold text-(--app-text)">
                    Risk Score: {verdict.risk_score ?? 0}/100
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="rounded-md bg-(--app-card) px-2 py-0.5 border border-(--app-border) text-[11px] text-(--app-primary) font-bold">
                    {(verdict.scam_type || 'Benign').replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                    <Zap className="h-3 w-3" />
                    {verdict.inference_time_ms ? `${verdict.inference_time_ms.toFixed(1)}ms` : '<15ms'}
                  </span>
                </div>
              </div>

              {verdict.obfuscation_type && verdict.obfuscation_type !== 'none' && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Unmasked Obfuscation: <strong>{verdict.obfuscation_type.toUpperCase()}</strong></span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-(--app-text-muted)">
                  SmolLM3-3B Contextual Reasoner Output:
                </span>
                <p className="text-xs text-(--app-text) leading-relaxed">
                  {verdict.explanation}
                </p>
              </div>

              <div className="space-y-1 pt-1 border-t border-(--app-border)">
                <span className="text-[10px] font-bold uppercase tracking-wider text-(--app-primary)">
                  Recommended Safety Action:
                </span>
                <p className="text-xs text-(--app-text) leading-relaxed">
                  {verdict.recommended_action}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-(--app-border) bg-(--app-surface-secondary) px-4 py-3 flex items-center justify-between text-xs text-(--app-text-muted)">
          <span className="font-mono text-[11px]">Weights: GGUF Q4_K_M (1.82 GB) &middot; 508 Dataset Samples</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--app-border) bg-(--app-card) px-3 py-1.5 text-xs font-semibold text-(--app-text) hover:bg-(--app-surface-secondary)"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
