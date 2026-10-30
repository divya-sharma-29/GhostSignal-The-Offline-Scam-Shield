import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScanHistory } from '../hooks/useScanHistory';
import { RiskBadge } from '../components/RiskBadge';
import { RiskLevel, ScanResult } from '../types';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { useLanguage } from '../i18n';
import { 
  History as HistoryIcon, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  WifiOff, 
  Cpu, 
  ServerOff, 
  Database,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { history, clearHistory, deleteScan } = useScanHistory();

  const [activeTab, setActiveTab] = useState<'history' | 'privacy'>('history');
  const [filterLevel, setFilterLevel] = useState<'ALL' | RiskLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered scan items
  const filteredHistory = history.filter(item => {
    const matchesLevel = filterLevel === 'ALL' || item.riskLevel === filterLevel;
    const matchesSearch = searchQuery === '' || 
      item.messageText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.plainLanguageExplanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sampleName && item.sampleName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const handleOpenResult = (item: ScanResult) => {
    navigate('/results', {
      state: { result: item }
    });
  };

  const handleConfirmClear = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#0B111E] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
              <HistoryIcon className="w-4 h-4" />
              <span>{t('history')}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {t('history')}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {t('allHistory')}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('history')} ({history.length})
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              Privacy & Architecture
            </button>
          </div>
        </div>

        {/* Live offline simulator banner */}
        <OfflineStatusBanner />

        {/* SECTION A: SCAN HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('history')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              {/* Risk Level Segmented Buttons */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW', 'UNASSESSED'] as const).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      filterLevel === lvl
                        ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
                    }`}
                  >
                    {lvl === 'ALL' ? t('allHistory') : lvl === 'HIGH' ? t('riskHigh') : lvl === 'MEDIUM' ? t('riskMedium') : lvl === 'LOW' ? t('riskLow') : t('unassessed')}
                  </button>
                ))}
              </div>

              {/* History Management Actions */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                {history.length > 0 ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clearHistory')}</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{t('confirmClear')}?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmClear}
                    className="px-3 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500"
                  >
                    {t('confirmClear')}
                  </button>
                </div>
              </div>
            )}

            {/* History Records List */}
            {filteredHistory.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                <HistoryIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">{t('noScans')}</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery || filterLevel !== 'ALL'
                      ? t('noScans')
                      : t('noScans')}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/scanner')}
                    className="px-4 py-2 rounded-lg bg-cyan-400 text-xs font-bold text-slate-950 hover:bg-cyan-300 cursor-pointer"
                  >
                    {t('startScan')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item) => {
                  const dateFormatted = new Date(item.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Header metadata row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <RiskBadge level={item.riskLevel} size="sm" />
                          <span className="text-slate-400 font-mono text-[11px]">
                            {dateFormatted}
                          </span>
                          <span className="text-slate-600 font-mono">·</span>
                          <span className="text-slate-400 text-[11px] font-mono uppercase">
                            {item.language}
                          </span>
                          {item.redFlags.length > 0 && (
                            <>
                              <span className="text-slate-600 font-mono">·</span>
                              <span className="text-slate-400 text-[11px] font-mono">
                                {item.redFlags.length} {t('redFlags')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Message Preview */}
                        <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed">
                          "{item.messageText}"
                        </p>

                        {/* Plain language summary excerpt */}
                        <p className="text-xs text-slate-400 line-clamp-1 italic">
                          {item.plainLanguageExplanation}
                        </p>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => deleteScan(item.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title={t('clearHistory')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenResult(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-500/20 text-xs font-semibold text-slate-200 group-hover:text-cyan-300 border border-slate-700 group-hover:border-cyan-500/40 transition-all cursor-pointer"
                        >
                          <span>{t('result')}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION B: PRIVACY & ARCHITECTURE SECTION */}
        {activeTab === 'privacy' && (
          <div className="space-y-8">
            {/* Core Privacy Directives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Private by Design</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The intended design keeps message processing on-device. Network isolation has not been independently verified.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <ServerOff className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Local Storage</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The mock login and scan history use this browser's local storage. This page does not claim that all network traffic or browser behavior has been audited.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <WifiOff className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Offline-First Goal</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The intended product is designed to work without internet. This checkpoint has no offline cache and has not verified network isolation.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <EyeOff className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">No Unnecessary Collection</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  History is saved strictly inside your local browser instance via HTML5 Local Storage. You can clear all history with a single click at any time.
                </p>
              </div>
            </div>

            {/* Technical Integration Roadmap for Judges (Checkpoint 1 vs Checkpoint 2) */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Technical Architecture Roadmap (Hackathon Checkpoint Status)
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                This build delivers the interactive workflows, responsive interface, sample messages, and explainable local keyword rules.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CHECKPOINT 1 (COMPLETED)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                    <li>✓ Complete 5-screen cyber UI architecture</li>
                    <li>✓ Dual input methods (Text + Screenshot preview)</li>
                    <li>✓ Sample messages and Indian language options</li>
                    <li>✓ Explainable red flag decomposition engine</li>
                    <li>✓ Inline categorized text highlight system</li>
                    <li>✓ Persistent localStorage scan history</li>
                    <li>✓ Browser online/offline status indicator</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
                    <Cpu className="w-4 h-4" />
                    <span>CHECKPOINT 2 (TARGET ROADMAP)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                    <li>→ Quantized SLM integration (ONNX Runtime Web)</li>
                    <li>→ On-device OCR engine (Tesseract.js WebAssembly)</li>
                    <li>→ Zero-cloud multi-lingual NLP weights</li>
                    <li>→ Native PWA caching for offline hardware boot</li>
                    <li>→ SMS broadcast listener hook (Android Kotlin bridge)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return to Scanner CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">
            GhostSignal · Team The Vanguard
          </span>
          <button
            onClick={() => navigate('/scanner')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer"
          >
            <span>Return to Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
