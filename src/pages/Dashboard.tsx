import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, LockKeyhole, Mic, ScanLine, ShieldCheck, WifiOff, ImageUp, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { RiskBadge } from '../components/RiskBadge';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { useScanHistory } from '../hooks/useScanHistory';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../i18n';

export const Dashboard = () => {
  const { history } = useScanHistory();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const recentScans = history.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-7 lg:px-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-cyan-300">The Offline Scam Shield</p>
          <h1 className="text-3xl font-semibold text-white">{t('tagline')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t('scannerDescription')}</p>
        </div>
        <LanguageSelector />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link to="/scanner" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"><ScanLine className="h-5 w-5" />{t('startScan')}<ArrowRight className="h-4 w-4" /></Link>
        <Link to="/scanner?mode=screenshot" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"><ImageUp className="h-5 w-5 text-cyan-300" />{t('uploadScreenshot')}</Link>
        <button onClick={() => window.dispatchEvent(new Event('ghostsignal:open-assistant'))} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-cyan-700/70 bg-cyan-950/40 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/60"><Mic className="h-5 w-5" />{t('assistantName')}</button>
      </div>

      <OfflineStatusBanner />

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <section aria-labelledby="recent-scans-heading">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Local records</p>
              <h2 id="recent-scans-heading" className="mt-1 text-lg font-semibold text-white">{t('recentScans')}</h2>
            </div>
            <Link to="/history" className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">{t('allHistory')} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {recentScans.length ? (
            <div className="divide-y divide-slate-800 border-y border-slate-800">
              {recentScans.map((scan, index) => (
                <motion.div key={scan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                  <Link to={`/results?id=${scan.id}`} state={{ result: scan }} className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-900/50">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <RiskBadge level={scan.riskLevel} size="sm" />
                        <span className="text-xs text-slate-500"><Clock3 className="mr-1 inline h-3 w-3" />{new Date(scan.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="line-clamp-1 text-sm text-slate-200">{scan.messageText}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="border-y border-slate-800 py-10 text-center">
              <p className="text-sm text-slate-300">{t('noScans')}</p>
              <p className="mt-1 text-xs text-slate-500">Start a scan to see your local results here.</p>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="border-t-2 border-cyan-500 py-4">
            <div className="flex items-center gap-2 text-white"><LockKeyhole className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold">Privacy by design</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t('offlineUnverified')}</p>
            <Link to="/privacy" className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">Privacy & offline details <ArrowRight className="h-4 w-4" /></Link>
          </section>
          <section className="border-t border-slate-800 py-4">
            <div className="flex items-center gap-2 text-white"><Phone className="h-4 w-4 text-rose-300" /><h2 className="text-sm font-semibold">{t('helpTitle')}</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t('moneyLostAdvice')}</p>
            <Link to="/help" className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">{t('openHelp')} <ArrowRight className="h-4 w-4" /></Link>
          </section>
          <section className="border-t border-slate-800 py-4">
            <div className="flex items-center gap-2 text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" /><h2 className="text-sm font-semibold">How GhostSignal works</h2></div>
            <ol className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex gap-3"><span className="font-mono text-cyan-300">01</span>Paste text or add a screenshot.</li>
              <li className="flex gap-3"><span className="font-mono text-cyan-300">02</span>Review the local rules-based risk assessment.</li>
              <li className="flex gap-3"><span className="font-mono text-cyan-300">03</span>See the phrases, reasons, and safety actions.</li>
            </ol>
          </section>
          <div className="flex items-start gap-3 border-t border-slate-800 py-4 text-xs leading-5 text-slate-500">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <p>Designed for offline use. Network isolation has not been technically verified.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};