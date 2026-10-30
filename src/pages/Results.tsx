import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ScanResult } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskScore } from '../components/RiskScore';
import { HighlightedMessage } from '../components/HighlightedMessage';
import { RedFlagCard } from '../components/RedFlagCard';
import { useScanHistory } from '../hooks/useScanHistory';
import { getFlagLabel, LANGUAGES, useLanguage, type TranslationKey } from '../i18n';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { 
  ArrowLeft, 
  RotateCcw, 
  History, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Copy,
  Check,
  Share2,
  FileText,
  Lightbulb,
  Volume2
} from 'lucide-react';

export const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { speak, enabled } = useVoiceSettings();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const { getScanById, isLoaded } = useScanHistory();

  const [copied, setCopied] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  // Results must come from an actual local rule check or saved scan.
  const stateResult = (location.state as { result?: ScanResult })?.result;
  const historyResult = queryId ? getScanById(queryId) : undefined;

  const [currentResult, setCurrentResult] = useState<ScanResult | null>(
    stateResult || historyResult || null
  );

  useEffect(() => {
    if (stateResult || historyResult) setCurrentResult(stateResult || historyResult || null);
    else if (isLoaded) setCurrentResult(null);
  }, [stateResult, historyResult, isLoaded]);

  const handleCopyReport = () => {
    if (!currentResult) return;
    const reportText = `[GhostSignal]
${t('result')}: ${t(currentResult.riskLevel === 'HIGH' ? 'riskHigh' : currentResult.riskLevel === 'MEDIUM' ? 'riskMedium' : currentResult.riskLevel === 'LOW' ? 'riskLow' : 'unassessed')} (${currentResult.riskScore}/100)
${t('pastedText')}: "${currentResult.messageText}"
${t('explanation')}: ${t(riskSummaryKey)}
${t('redFlags')}: ${currentResult.redFlags.length}
${currentResult.redFlags.map((flag) => `- ${getFlagLabel(language, flag.category)}: "${flag.phrase}"`).join('\n')}
${t('recommendations')}:
${recommendations.map((key) => `* ${t(key)}`).join('\n')}
${t('riskNote')}`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!currentResult) {
    return isLoaded ? <Navigate to="/scanner" replace /> : <div className="p-8 text-slate-300">{t('processing')}</div>;
  }

  const riskSummaryKey = currentResult.riskLevel === 'HIGH' ? 'riskSummaryHigh' : currentResult.riskLevel === 'MEDIUM' ? 'riskSummaryMedium' : 'riskSummaryLow';
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

  const readResult = () => {
    const spoken = `${t(riskSummaryKey)} ${recommendations.map((key) => t(key)).join(' ')}`;
    setVoiceFeedback(speak(spoken, true) ? '' : t('voiceUnavailable'));
  };

  useEffect(() => {
    if (enabled && currentResult) readResult();
  }, [enabled, currentResult?.id, language]);

  return (
    <div className="min-h-screen bg-[#0B111E] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/scanner')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('back')} · {t('scanner')}</span>
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              {t('result')}
            </span>
          </div>

          {/* Action Buttons: F. ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              title={t('copySummary')}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('copiedSummary') : t('copySummary')}</span>
            </button>

            <button
              onClick={() => navigate('/history')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('history')}</span>
            </button>

            <button
              onClick={() => navigate('/scanner')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('scanAnother')}</span>
            </button>
          </div>
        </div>

        {/* SECTION A: RISK LEVEL & GAUGE */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                {t('result')}
              </span>
              <div className="flex items-center gap-3">
                <RiskBadge level={currentResult.riskLevel} size="lg" />
                {currentResult.sampleName && (
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {currentResult.sampleName}
                  </span>
                )}
              </div>
            </div>

            {/* Rules-based risk score */}
            <RiskScore
              score={currentResult.riskScore}
              level={currentResult.riskLevel}
            />
          </div>

          {/* Result accuracy note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              {t('riskNote')}
            </div>
          </div>
        </div>

        {/* SECTION B: MESSAGE ANALYSIS & HIGHLIGHTING */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-sans">
                {t('pastedText')}
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {LANGUAGES.find((item) => item.name === currentResult.language)?.native ?? currentResult.language} · {currentResult.sourceType === 'screenshot' ? t('sourceScreenshot') : t('sourceText')}
            </span>
          </div>

          {/* Screenshot preview if available */}
          {currentResult.screenshotUrl && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              <img
                src={currentResult.screenshotUrl}
                alt="Analyzed Screenshot"
                className="w-16 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">{t('sourceScreenshot')}</span>
                <span className="text-slate-400">{t('ocrUnavailable')}</span>
              </div>
            </div>
          )}

          {/* Inline Highlighted Message Component */}
          <HighlightedMessage
            messageText={currentResult.riskLevel === 'UNASSESSED' ? t('screenshotNotAssessed') : currentResult.messageText}
            redFlags={currentResult.redFlags}
          />
        </div>

        <details className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
          <summary className="cursor-pointer text-base font-semibold text-white">Inspect suspicious characters</summary>
          <p className="mt-3 text-sm leading-6 text-slate-400">The original message below is unchanged. Unicode findings appear only when supplied by the analysis service.</p>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Original message</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">{currentResult.messageText}</p>
          </div>
          {currentResult.unicodeSecurity?.findings?.length ? (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Server-reported findings</h3>
              {currentResult.unicodeSecurity.findings.map((finding, index) => (
                <article key={`${finding.kind}-${index}`} className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
                  <p className="font-mono text-sm text-amber-200">{finding.text || 'Character range reported'}</p>
                  <p className="mt-1 text-sm text-slate-300">{finding.explanation}</p>
                  <p className="mt-2 text-xs text-slate-400">{finding.kind.replaceAll('-', ' ')}{finding.codePoints?.length ? ` · ${finding.codePoints.join(', ')}` : ''}{finding.scripts?.length ? ` · Scripts: ${finding.scripts.join(', ')}` : ''}</p>
                </article>
              ))}
            </div>
          ) : <p className="mt-4 rounded-lg bg-slate-950/60 p-3 text-sm text-slate-400">No Unicode inspection data was provided for this scan. This does not mean the text is free of unusual characters.</p>}
          {currentResult.unicodeSecurity?.normalizedForAnalysis && <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Normalized analysis representation</h3><p className="mt-2 whitespace-pre-wrap break-words font-mono text-sm text-slate-300">{currentResult.unicodeSecurity.normalizedForAnalysis}</p></div>}
        </details>

        {/* SECTION D: PLAIN-LANGUAGE EXPLANATION */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white font-sans">
              {t('explanation')}
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            {t(riskSummaryKey)}
          </p>
        </div>

        {/* SECTION C: RED FLAGS BREAKDOWN */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-base font-bold text-white font-sans">
                {t('redFlags')} ({currentResult.redFlags.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
                {t('localRules')}
            </span>
          </div>

          {currentResult.riskLevel === 'UNASSESSED' ? (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-200">No text was assessed</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">OCR is not available. Paste the screenshot's message text for a local rules-based assessment.</p>
            </div>
          ) : currentResult.redFlags.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-200">{t('noFlags')}</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{t('noFlags')} {t('riskSummaryLow')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentResult.redFlags.map((flag, idx) => (
                <RedFlagCard key={flag.id || idx} flag={flag} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* SECTION E: SAFETY RECOMMENDATIONS */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-sans">
              {t('recommendations')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((key, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed"
              >
                <div className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{t('localRules')}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/history')}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {t('history')}
            </button>
            <button
              onClick={() => navigate('/scanner')}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              {t('scanAnother')}
            </button>
            <button onClick={readResult} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"><Volume2 className="h-4 w-4" />{t('speakResult')}</button>
            <Link to="/help" className="inline-flex items-center gap-2 rounded-lg border border-rose-700/70 px-4 py-2 text-xs font-semibold text-rose-200"><ShieldAlert className="h-4 w-4" />{t('openHelp')}</Link>
          </div>
          {voiceFeedback && <p role="status" className="mt-3 text-xs text-amber-200">{voiceFeedback}</p>}
        </div>
      </div>
    </div>
  );
};
