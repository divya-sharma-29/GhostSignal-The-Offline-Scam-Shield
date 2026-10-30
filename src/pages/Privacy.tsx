import { useEffect, useState } from 'react';
import { ArrowRight, Check, Cpu, EyeOff, LockKeyhole, RefreshCw, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { api, type SecurityEngineStatus } from '../services/api';

export const Privacy = () => {
  const { t } = useLanguage();
  const [securityStatus, setSecurityStatus] = useState<SecurityEngineStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Verification unavailable');
  const checkSecurityStatus = async () => {
    setChecking(true);
    try {
      const payload = await api.getSecurityStatus();
      if (!payload || typeof payload.verificationStatus !== 'string') throw new Error('invalid status response');
      setSecurityStatus(payload);
      setStatusMessage(payload.verificationStatus);
    } catch {
      setSecurityStatus(null);
      setStatusMessage(navigator.onLine ? 'Verification unavailable' : 'Offline — using installed rules');
    } finally { setChecking(false); }
  };
  useEffect(() => { void checkSecurityStatus(); }, []);
  const principles = [
    { title: t('privacy'), description: t('scannerDescription'), icon: LockKeyhole },
    { title: t('stagePrepare'), description: `${t('localRules')}. ${t('aiUnavailable')}`, icon: Cpu },
    { title: t('privacy'), description: 'Initial page loading and browser speech may need an internet connection.', icon: Wifi }
  ];
  const flow = [t('pastedText'), t('localRules'), t('result'), t('explanation')];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-7 lg:px-10">
      <header className="mb-9 border-b border-slate-800 pb-6">
        <p className="text-xs font-medium uppercase text-cyan-300">GhostSignal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t('privacy')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t('riskNote')}</p>
      </header>

      <div className="divide-y divide-slate-800 border-y border-slate-800">
        {principles.map(({ title, description, icon: Icon }, index) => (
          <section key={title} className="grid gap-3 py-5 sm:grid-cols-[42px_180px_1fr] sm:items-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-cyan-300"><Icon className="h-4 w-4" /></div>
            <h2 className="pt-1 text-sm font-semibold text-white">0{index + 1} · {title}</h2>
            <p className="text-sm leading-6 text-slate-400">{description}</p>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">{t('analysisTitle')}</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {flow.map((step, index) => (
            <div key={step} className="flex min-h-20 items-center gap-3 border-l-2 border-cyan-500 bg-slate-900/60 px-4 py-3">
              <span className="font-mono text-xs text-cyan-300">0{index + 1}</span>
              <span className="text-sm font-medium text-slate-200">{step}</span>
              {index < 3 && <ArrowRight className="ml-auto hidden h-4 w-4 text-slate-600 sm:block" />}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-(--app-border) bg-(--app-card) p-5" aria-labelledby="security-engine-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-(--app-primary)">Security Engine</p><h2 id="security-engine-heading" className="mt-1 text-lg font-semibold">Installed protection rules</h2></div>
          <button type="button" disabled={checking} onClick={() => void checkSecurityStatus()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-(--app-border) px-3 text-sm font-medium disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />{checking ? 'Checking…' : 'Check for updates'}</button>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-(--app-card-muted) p-3"><dt className="text-(--app-text-muted)">Installed rules version</dt><dd className="mt-1 font-medium">{securityStatus?.rulesVersion ?? 'Unavailable'}</dd></div>
          <div className="rounded-lg bg-(--app-card-muted) p-3"><dt className="text-(--app-text-muted)">Last successful update</dt><dd className="mt-1 font-medium">{securityStatus?.lastSuccessfulUpdate ? new Date(securityStatus.lastSuccessfulUpdate).toLocaleString() : 'Unavailable'}</dd></div>
          <div className="rounded-lg bg-(--app-card-muted) p-3"><dt className="text-(--app-text-muted)">Verification status</dt><dd role="status" className="mt-1 font-medium">{statusMessage}{securityStatus?.updateAvailable ? ' · Update available' : ''}</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-(--app-text-muted)">Update packages are not activated from this screen. Only the server can report package verification.</p>
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="border-t-2 border-emerald-500 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Check className="h-4 w-4 text-emerald-300" />{t('localRules')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400"><li>{t('scannerDescription')}</li><li>{t('history')}</li><li>{t('riskNote')}</li></ul>
        </div>
        <div className="border-t-2 border-amber-400 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><EyeOff className="h-4 w-4 text-amber-300" />{t('aiUnavailable')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400"><li>{t('aiUnavailable')}</li><li>{t('ocrUnavailable')}</li><li>Initial page loading and browser speech may need an internet connection.</li></ul>
        </div>
      </section>

      <p className="mt-8 border-l-2 border-slate-600 bg-slate-900/50 px-4 py-3 text-sm leading-6 text-slate-300">{t('riskNote')}</p>
      <div className="mt-8 flex flex-wrap gap-5">
        <Link to="/scanner" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200">{t('scanner')} <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/help" className="inline-flex items-center gap-2 text-sm font-medium text-rose-200 hover:text-rose-100">{t('helpTitle')} <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
};
