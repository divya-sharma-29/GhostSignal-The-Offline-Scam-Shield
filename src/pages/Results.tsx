import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ScanResult } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskScore } from '../components/RiskScore';
import { HighlightedMessage } from '../components/HighlightedMessage';
import { RedFlagCard } from '../components/RedFlagCard';
import { useScanHistory } from '../hooks/useScanHistory';
import { getFlagLabel, useLanguage, type TranslationKey } from '../i18n';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { analyzeUnicode, evaluateSmolLM3Reasoning } from '../utils/riskEngine';
import { 
  ArrowLeft, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Eye,
  ArrowRightLeft,
  PhoneCall,
  Cpu,
  Zap
} from 'lucide-react';

export const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { speak, stop, isSpeaking } = useVoiceSettings();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const { getScanById, isLoaded } = useScanHistory();

  const [copied, setCopied] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedNormalized, setCopiedNormalized] = useState(false);
  const [copiedAiVerdict, setCopiedAiVerdict] = useState(false);
  const [isUnicodeExpanded, setIsUnicodeExpanded] = useState(false);

  const stateResult = (location.state as { result?: ScanResult })?.result;
  const historyResult = queryId ? getScanById(queryId) : undefined;

  const [currentResult, setCurrentResult] = useState<ScanResult | null>(
    stateResult || historyResult || null
  );

  useEffect(() => {
    if (stateResult || historyResult) {
      const res = stateResult || historyResult;
      if (res && !res.unicodeShield) {
        res.unicodeShield = analyzeUnicode(res.messageText);
      }
      setCurrentResult(res || null);
      if (res?.unicodeShield?.hasAnomalies) {
        setIsUnicodeExpanded(true);
      }
    } else if (isLoaded) {
      setCurrentResult(null);
    }
  }, [stateResult, historyResult, isLoaded]);

  if (!currentResult) {
    return isLoaded ? (
      <Navigate to="/scanner" replace />
    ) : (
      <div className="p-8 text-(--app-text-muted)">{t('processing')}</div>
    );
  }

  const unicodeReport = currentResult.unicodeShield || analyzeUnicode(currentResult.messageText);
  const aiVerdict = currentResult.aiVerdict || evaluateSmolLM3Reasoning(currentResult.messageText, unicodeReport);

  const riskSummaryKey = currentResult.riskLevel === 'HIGH' 
    ? 'riskSummaryHigh' 
    : currentResult.riskLevel === 'MEDIUM' 
    ? 'riskSummaryMedium' 
    : 'riskSummaryLow';

  const safetyKeys: TranslationKey[] = Array.from(new Set(currentResult.redFlags.map((flag): TranslationKey => {
    if (flag.category === 'otp') return 'safetyOtp';
    if (flag.category === 'upi') return 'safetyUpi';
    if (flag.category === 'link') return 'safetyLink';
    if (flag.category === 'impersonation') return 'safetyBank';
    if (flag.category === 'urgency') return 'safetyUrgency';
    return 'safetyPayment';
  })));

  if (currentResult.riskLevel === 'HIGH') safetyKeys.push('safetyOtp', 'safetyLink', 'contactBank');
  if (!safetyKeys.length) safetyKeys.push('safetyOtp', 'safetyBank');
  const recommendations = Array.from(new Set(safetyKeys));

  const handleCopyReport = () => {
    const reportText = `[GhostSignal Scam Assessment]
Result: ${currentResult.riskLevel} (${currentResult.riskScore}/100)
Message: "${currentResult.messageText}"
Explanation: ${currentResult.plainLanguageExplanation}
Unicode Integrity: ${unicodeReport.summary}
Warning Signs (${currentResult.redFlags.length}):
${currentResult.redFlags.map(f => `- ${f.title}: "${f.phrase}"`).join('\n')}
Recommendations:
${currentResult.safetyRecommendations.map(r => `* ${r}`).join('\n')}
Notice: A low-risk assessment is not a guarantee of safety. Always verify messages independently.`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyAiVerdict = () => {
    const verdictText = `[SmolLM3-3B Local AI Verdict]
Model: ${aiVerdict.modelName}
Threat Vector: ${aiVerdict.scamType.replace(/_/g, ' ').toUpperCase()}
Risk Level: ${aiVerdict.riskLevel} (${aiVerdict.riskScore}/100)
Confidence: ${(aiVerdict.confidence * 100).toFixed(0)}% (Latency: ${aiVerdict.inferenceTimeMs.toFixed(1)}ms)
Obfuscation: ${aiVerdict.obfuscationType || 'none'}
AI Explanation: ${aiVerdict.explanation}
Recommended Action: ${aiVerdict.recommendedAction}`;

    navigator.clipboard.writeText(verdictText).then(() => {
      setCopiedAiVerdict(true);
      setTimeout(() => setCopiedAiVerdict(false), 2000);
    });
  };

  const readResult = () => {
    if (isSpeaking) {
      stop();
      return;
    }
    const spoken = `${t(riskSummaryKey)}. ${currentResult.plainLanguageExplanation}. ${currentResult.safetyRecommendations.join('. ')}`;
    speak(spoken, true);
  };

  const handleOpenAIGuide = () => {
    window.dispatchEvent(new CustomEvent('ghostsignal:open-ai-guide', { 
      detail: { 
        topic: unicodeReport.hasAnomalies ? 'unicode_warning' : 'suspicious_reason',
        scan: currentResult 
      } 
    }));
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 text-(--app-text)">
      {/* Top Navigation & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-(--app-border) pb-5">
        <Link
          to="/scanner"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-(--app-primary) hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scanner</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={readResult}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              isSpeaking
                ? 'border-(--app-danger)/60 bg-(--app-danger)/10 text-(--app-danger) animate-pulse'
                : 'border-(--app-border) bg-(--app-card) text-(--app-text) hover:bg-(--app-surface-secondary)'
            }`}
            title={isSpeaking ? 'Stop audio playback' : 'Read summary aloud'}
          >
            {isSpeaking ? (
              <VolumeX className="w-3.5 h-3.5 text-(--app-danger)" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-(--app-primary)" />
            )}
            <span>{isSpeaking ? 'Sound Off' : 'Read Aloud'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-(--app-border) bg-(--app-card) px-3 py-2 text-xs font-semibold text-(--app-text) transition hover:bg-(--app-surface-secondary) cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-(--app-success)" /> : <Copy className="w-3.5 h-3.5 text-(--app-text-muted)" />}
            <span>{copied ? 'Copied Report' : 'Copy Report'}</span>
          </button>

          <Link
            to="/scanner"
            className="inline-flex items-center gap-1.5 rounded-xl bg-(--app-primary) px-3.5 py-2 text-xs font-semibold text-(--app-on-primary) transition hover:opacity-90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Another</span>
          </Link>
        </div>
      </div>

      {/* Primary Result Overview: Risk Level & Score */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--app-primary)">
              Analysis Result
            </span>
            <div className="flex items-center gap-3">
              <RiskBadge level={currentResult.riskLevel} size="lg" />
              <span className="text-xs text-(--app-text-muted)">
                {new Date(currentResult.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <RiskScore score={currentResult.riskScore} level={currentResult.riskLevel} />
        </div>

        {/* Plain-Language Explanation */}
        <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-(--app-text)">
              Plain-Language Explanation
            </h2>
            <button
              type="button"
              onClick={handleOpenAIGuide}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--app-primary) hover:underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-(--app-secondary)" />
              <span>Ask AI Guide</span>
            </button>
          </div>
          <p className="text-sm text-(--app-text) leading-relaxed">
            {currentResult.plainLanguageExplanation}
          </p>

          {/* Strict Safety Disclaimer — A low-risk result never guarantees safety */}
          <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-(--app-warning) shrink-0 mt-0.5" />
            <p className="text-(--app-text-muted) leading-relaxed">
              <strong className="text-(--app-text)">Safety Note:</strong> A low-risk assessment indicates no known scam patterns were matched. It does not guarantee that a message is safe or authentic. Always verify unexpected requests through trusted official numbers.
            </p>
          </div>
        </div>
      </section>

      {/* SmolLM3-3B Local AI Engine Semantic Verdict Card */}
      <section className="rounded-2xl border border-(--app-primary)/35 bg-gradient-to-br from-(--app-card) via-(--app-card) to-(--app-surface-secondary) p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--app-border) pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--app-primary)/15 text-(--app-primary)">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-(--app-text)">SmolLM3-3B Local AI Verdict</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-(--app-success)/15 px-2.5 py-0.5 text-[11px] font-semibold text-(--app-success)">
                  <span className="h-1.5 w-1.5 rounded-full bg-(--app-success) animate-pulse" />
                  100% On-Device Offline
                </span>
              </div>
              <p className="text-xs text-(--app-text-muted) mt-0.5 font-mono">
                Model: {aiVerdict.modelName} &middot; Quantized Q4_K_M
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAiVerdict}
              className="inline-flex items-center gap-1.5 rounded-lg border border-(--app-border) bg-(--app-card) px-3 py-1.5 text-xs font-semibold text-(--app-text) transition hover:bg-(--app-surface-secondary) cursor-pointer"
            >
              {copiedAiVerdict ? <Check className="h-3.5 w-3.5 text-(--app-success)" /> : <Copy className="h-3.5 w-3.5 text-(--app-text-muted)" />}
              <span>{copiedAiVerdict ? 'Copied Verdict' : 'Copy AI Verdict'}</span>
            </button>
          </div>
        </div>

        {/* AI Metrics Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-(--app-border) bg-(--app-card) px-2.5 py-1 text-xs font-semibold text-(--app-text)">
            Threat Vector: <strong className="text-(--app-primary) uppercase">{aiVerdict.scamType.replace(/_/g, ' ')}</strong>
          </span>
          <span className="rounded-lg border border-(--app-border) bg-(--app-card) px-2.5 py-1 text-xs font-semibold text-(--app-text)">
            Confidence: <strong className="text-(--app-success)">{Math.round(aiVerdict.confidence * 100)}%</strong>
          </span>
          <span className="rounded-lg border border-(--app-border) bg-(--app-card) px-2.5 py-1 text-xs font-semibold text-(--app-text) flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-(--app-warning)" />
            Latency: <strong className="font-mono">{aiVerdict.inferenceTimeMs.toFixed(1)}ms</strong>
          </span>
          {aiVerdict.obfuscationType && aiVerdict.obfuscationType !== 'none' && (
            <span className="rounded-lg border border-(--app-danger)/30 bg-(--app-danger)/10 px-2.5 py-1 text-xs font-semibold text-(--app-danger)">
              Obfuscation: <strong>{aiVerdict.obfuscationType.toUpperCase()}</strong> unmasked
            </span>
          )}
        </div>

        {/* AI Semantic Reasoning & Recommended Protection */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          <div className="rounded-xl border border-(--app-border) bg-(--app-card) p-4 space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-(--app-primary) flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-(--app-secondary)" />
              AI Semantic Reasoning
            </span>
            <p className="text-xs sm:text-sm text-(--app-text) leading-relaxed">
              {aiVerdict.explanation}
            </p>
          </div>

          <div className="rounded-xl border border-(--app-primary)/30 bg-(--app-primary)/5 p-4 space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-(--app-primary) flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-(--app-primary)" />
                Recommended Cyber Protection Action
              </span>
              <p className="text-xs sm:text-sm text-(--app-text) leading-relaxed">
                {aiVerdict.recommendedAction}
              </p>
            </div>
            {aiVerdict.riskLevel === 'HIGH' && (
              <div className="mt-3 pt-2 border-t border-(--app-border) flex items-center justify-between text-[11px]">
                <span className="text-(--app-danger) font-semibold flex items-center gap-1">
                  <PhoneCall className="h-3 w-3" /> Cybercrime Helpline: 1930
                </span>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--app-primary) underline font-semibold"
                >
                  cybercrime.gov.in
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Message Review with Highlighted Signals */}
      <section className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-(--app-border) pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-(--app-text)">
              Message Review & Highlighted Signals
            </h3>
            <p className="text-xs text-(--app-text-muted) mt-0.5">
              Original message text with detected threats and Unicode anomalies highlighted.
            </p>
          </div>
          <span className="text-xs font-mono text-(--app-text-muted)">
            {currentResult.sourceType.toUpperCase()}
          </span>
        </div>

        <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-4">
          <HighlightedMessage 
            messageText={currentResult.messageText} 
            redFlags={currentResult.redFlags}
            unicodeReport={unicodeReport}
          />
        </div>

        {currentResult.screenshotUrl && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-(--app-text-muted) block mb-2">Screenshot Attached:</span>
            <div className="max-h-60 overflow-hidden rounded-xl border border-(--app-border) bg-black/5 flex items-center justify-center p-2">
              <img 
                src={currentResult.screenshotUrl} 
                alt="Scan screenshot" 
                className="max-h-56 object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </section>

      {/* UNICODE SHIELD VISUALIZATION */}
      <section className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-(--app-border) pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              unicodeReport.hasAnomalies 
                ? 'bg-(--app-danger)/15 text-(--app-danger)' 
                : 'bg-(--app-success)/15 text-(--app-success)'
            }`}>
              {unicodeReport.hasAnomalies ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-(--app-text)">Unicode Shield Findings</h3>
                {unicodeReport.isIndicSafe && (
                  <span className="rounded-full bg-(--app-surface-secondary) px-2.5 py-0.5 text-[10px] font-semibold text-(--app-primary)">
                    Indic Typography Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-(--app-text-muted) mt-0.5">{unicodeReport.summary}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('ghostsignal:open-ai-guide', { 
                detail: { topic: 'unicode_warning' } 
              }));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--app-border) bg-(--app-surface-secondary) px-3 py-1.5 text-xs font-semibold text-(--app-primary) transition hover:border-(--app-primary) cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-(--app-secondary)" />
            <span>Explain Unicode</span>
          </button>
        </div>

        {/* Comparison: Original vs Normalized Representation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-(--app-text)">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5 text-(--app-primary)" />
              Original vs. Normalized Analysis Representation
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-(--app-text-muted)">
                    Original Message (Unmodified)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unicodeReport.originalText);
                      setCopiedOriginal(true);
                      setTimeout(() => setCopiedOriginal(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-(--app-text-muted) hover:text-(--app-text) cursor-pointer"
                  >
                    {copiedOriginal ? <Check className="h-3 w-3 text-(--app-success)" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedOriginal ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-(--app-text) break-words whitespace-pre-wrap leading-relaxed select-all">
                  {unicodeReport.originalText}
                </p>
              </div>
              <span className="mt-2 text-[10px] text-(--app-text-muted)">
                Exact character stream as provided.
              </span>
            </div>

            <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-(--app-primary)">
                    Normalized Analysis Representation
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unicodeReport.normalizedText);
                      setCopiedNormalized(true);
                      setTimeout(() => setCopiedNormalized(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-(--app-text-muted) hover:text-(--app-text) cursor-pointer"
                  >
                    {copiedNormalized ? <Check className="h-3 w-3 text-(--app-success)" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedNormalized ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-(--app-text) break-words whitespace-pre-wrap leading-relaxed select-all">
                  {unicodeReport.normalizedText}
                </p>
              </div>
              <span className="mt-2 text-[10px] text-(--app-primary)">
                Homoglyphs decoded, invisible characters stripped, keywords unpacked.
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Section: Inspect suspicious characters */}
        <div className="border-t border-(--app-border) pt-4">
          <button
            type="button"
            onClick={() => setIsUnicodeExpanded(!isUnicodeExpanded)}
            className="flex w-full items-center justify-between py-1 text-sm font-semibold text-(--app-text) hover:text-(--app-primary) cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-(--app-primary)" />
              <span>Inspect suspicious characters</span>
              {unicodeReport.findings.length > 0 && (
                <span className="rounded-full bg-(--app-danger)/15 px-2 py-0.5 text-xs font-bold text-(--app-danger)">
                  {unicodeReport.findings.length}
                </span>
              )}
            </div>
            {isUnicodeExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isUnicodeExpanded && (
            <div className="mt-4 space-y-3">
              {unicodeReport.findings.length === 0 ? (
                <div className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-4 text-center">
                  <CheckCircle2 className="h-5 w-5 text-(--app-success) mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-(--app-text)">No suspicious characters detected.</p>
                  <p className="text-[11px] text-(--app-text-muted) mt-0.5">
                    Standard ASCII and genuine Indic script typography were verified.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {unicodeReport.findings.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-block rounded-md border border-(--app-border) bg-(--app-card) px-2 py-0.5 font-mono font-bold text-(--app-danger)">
                            {item.char === '\u200B' || item.char === '\u200C' || item.char === '\u200D' || item.char === '\uFEFF' ? '[Invisible Char]' : `"${item.char}"`}
                          </span>
                          <span className="font-mono text-[11px] text-(--app-text-muted)">
                            {item.codePoint}
                          </span>
                          <span className="rounded-md border border-(--app-danger)/30 bg-(--app-danger)/15 px-2 py-0.5 text-[10px] font-semibold text-(--app-danger)">
                            {item.category.replace('_', ' ').toUpperCase()}
                          </span>
                          {item.expectedChar && (
                            <span className="text-[11px] text-(--app-text-muted)">
                              Mimics: <strong className="font-mono text-(--app-text)">"{item.expectedChar}"</strong>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-(--app-text-muted) leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Detected Warning Signs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-(--app-text) flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-(--app-danger)" />
            <span>Detected Warning Signs ({currentResult.redFlags.length})</span>
          </h3>
          <span className="text-xs text-(--app-text-muted)">
            Transparent Rule Matches
          </span>
        </div>

        {currentResult.redFlags.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {currentResult.redFlags.map((flag, idx) => (
              <RedFlagCard key={flag.id} flag={flag} index={idx} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-(--app-border) bg-(--app-card) p-6 text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-(--app-success) mx-auto" />
            <h4 className="text-sm font-bold text-(--app-text)">No standard warning signs detected</h4>
            <p className="text-xs text-(--app-text-muted) max-w-md mx-auto">
              No artificial urgency keywords, OTP extraction requests, or suspicious payment lures were matched.
            </p>
          </div>
        )}
      </section>

      {/* Recommended Next Steps */}
      <section className="rounded-2xl border border-(--app-border) bg-(--app-card) p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-(--app-border) pb-3">
          <ShieldCheck className="w-5 h-5 text-(--app-primary)" />
          <h3 className="text-sm sm:text-base font-bold text-(--app-text)">
            Recommended Next Steps
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {currentResult.safetyRecommendations.map((rec, i) => (
            <div 
              key={i} 
              className="flex items-start gap-3 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) p-3.5 text-xs text-(--app-text) leading-relaxed"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--app-primary) text-(--app-on-primary) text-[11px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{rec}</span>
            </div>
          ))}
        </div>

        {/* Emergency Financial Cybercrime Notice */}
        <div className="mt-4 rounded-xl border border-(--app-danger)/30 bg-(--app-danger)/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <PhoneCall className="w-4 h-4 text-(--app-danger) shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-(--app-text)">Lost Money or Shared Credentials?</p>
              <p className="text-(--app-text-muted) mt-0.5">
                Dial Indian National Cybercrime Helpline <strong>1930</strong> or report at <strong>cybercrime.gov.in</strong>.
              </p>
            </div>
          </div>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-(--app-danger) text-white px-3 py-1.5 text-xs font-semibold shrink-0 hover:opacity-90 transition"
          >
            cybercrime.gov.in
          </a>
        </div>
      </section>
    </div>
  );
};
