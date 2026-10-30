import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3, LockKeyhole, Mic, ScanLine, ShieldCheck, ImageUp, Phone } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { useScanHistory } from '../hooks/useScanHistory';
import { LanguageSelector } from '../components/LanguageSelector';
import { getDashboardCopy, useLanguage } from '../i18n';

export const Dashboard = () => {
  const { history } = useScanHistory();
  const { t, language } = useLanguage();
  const dashboardCopy = getDashboardCopy(language);
  const recentScans = history.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-7 lg:px-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--app-primary)">GhostSignal · The Offline Scam Shield</p>
          <h1 className="text-3xl font-semibold text-white">{dashboardCopy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{dashboardCopy.subtitle}</p>
          <p className="mt-2 text-sm font-medium text-(--app-primary)">{t('tagline')}</p>
        </div>
        <LanguageSelector />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link to="/scanner" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-(--app-border) bg-(--app-card) px-4 py-3 text-sm font-semibold text-(--app-text) shadow-sm transition hover:border-(--app-primary)"><ScanLine className="h-5 w-5 text-(--app-primary)" />{t('pastedText')}<ArrowRight className="h-4 w-4" /></Link>
        <Link to="/scanner?mode=screenshot" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-(--app-border) bg-(--app-card) px-4 py-3 text-sm font-semibold text-(--app-text) shadow-sm transition hover:border-(--app-primary)"><ImageUp className="h-5 w-5 text-(--app-primary)" />{t('uploadScreenshot')}</Link>
        <Link to="/scanner?mode=voice" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-(--app-border) bg-(--app-card) px-4 py-3 text-sm font-semibold text-(--app-text) shadow-sm transition hover:border-(--app-primary)"><Mic className="h-5 w-5 text-(--app-primary)" />{dashboardCopy.voiceAction}</Link>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <section aria-labelledby="recent-scans-heading">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">{t('history')}</p>
              <h2 id="recent-scans-heading" className="mt-1 text-lg font-semibold text-white">{t('recentScans')}</h2>
            </div>
            <Link to="/history" className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">{t('allHistory')} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {recentScans.length ? (
            <div className="divide-y divide-slate-800 border-y border-slate-800">
              {recentScans.map((scan) => (
                <div key={scan.id}>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="border-y border-slate-800 py-10 text-center">
              <p className="text-sm text-slate-300">{t('noScans')}</p>
              <p className="mt-1 text-xs text-slate-500">{t('noScans')}</p>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="border-t-2 border-cyan-500 py-4">
            <div className="flex items-center gap-2 text-white"><LockKeyhole className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold">{t('privacy')}</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-400">Message checks run locally in this browser. See privacy details for storage and network limitations.</p>
            <Link to="/privacy" className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">{t('privacy')} <ArrowRight className="h-4 w-4" /></Link>
          </section>
          <section className="border-t border-slate-800 py-4">
            <div className="flex items-center gap-2 text-white"><Phone className="h-4 w-4 text-rose-300" /><h2 className="text-sm font-semibold">{t('helpTitle')}</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t('moneyLostAdvice')}</p>
            <Link to="/help" className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">{t('openHelp')} <ArrowRight className="h-4 w-4" /></Link>
          </section>
          <section className="border-t border-slate-800 py-4">
            <div className="flex items-center gap-2 text-white"><BookOpen className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold">AI Guide</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-400">Understand warning signs from the latest scan. The guide uses existing local rules and explanations.</p>
            <Link to="/guide" className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">Open AI Guide <ArrowRight className="h-4 w-4" /></Link>
          </section>
          <section className="border-t border-slate-800 py-4">
            <div className="flex items-center gap-2 text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" /><h2 className="text-sm font-semibold">{t('scanner')}</h2></div>
            <ol className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex gap-3"><span className="font-mono text-cyan-300">01</span>{t('pasteMessage')} · {t('uploadScreenshot')}</li>
              <li className="flex gap-3"><span className="font-mono text-cyan-300">02</span>{t('localRules')}</li>
              <li className="flex gap-3"><span className="font-mono text-cyan-300">03</span>{t('explanation')} · {t('recommendations')}</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
};
