import { ArrowRight, Check, Cpu, EyeOff, LockKeyhole, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n';

export const Privacy = () => {
  const { t } = useLanguage();
  const principles = [
    { title: t('privacy'), description: t('scannerDescription'), icon: LockKeyhole },
    { title: t('stagePrepare'), description: `${t('localRules')}. ${t('aiUnavailable')}`, icon: Cpu },
    { title: t('offlineStatus'), description: t('offlineUnverified'), icon: WifiOff }
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

      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="border-t-2 border-emerald-500 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Check className="h-4 w-4 text-emerald-300" />{t('localRules')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400"><li>{t('scannerDescription')}</li><li>{t('history')}</li><li>{t('phonePrivacy')}</li></ul>
        </div>
        <div className="border-t-2 border-amber-400 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><EyeOff className="h-4 w-4 text-amber-300" />{t('aiUnavailable')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400"><li>{t('aiUnavailable')}</li><li>{t('ocrUnavailable')}</li><li>{t('offlineUnverified')}</li></ul>
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