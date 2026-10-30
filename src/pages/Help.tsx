import { useState } from 'react';
import { ArrowUpRight, Check, Copy, ExternalLink, Phone, ShieldAlert, Volume2 } from 'lucide-react';
import { useLanguage } from '../i18n';
import { useVoiceSettings } from '../hooks/useVoiceSettings';

export const Help = () => {
  const { t } = useLanguage();
  const { speak } = useVoiceSettings();
  const [copied, setCopied] = useState(false);

  const copyHelpline = async () => {
    try {
      await navigator.clipboard.writeText('1930');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const readGuidance = () => speak(`${t('moneyLostAdvice')} ${t('contactBank')} ${t('neverShare')}`, true);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-7 lg:px-10">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <p className="flex items-center gap-2 text-xs font-medium uppercase text-rose-300"><ShieldAlert className="h-4 w-4" /> India · Official reporting</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t('helpTitle')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t('helpDescription')}</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-rose-400/30 bg-rose-950/20 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white"><Phone className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-rose-200">National Cyber Crime Helpline</p>
              <a href="tel:1930" className="mt-1 block text-4xl font-bold text-white underline decoration-rose-400/60 underline-offset-4">1930</a>
              <p className="mt-3 text-sm leading-6 text-slate-300">{t('moneyLostAdvice')}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="tel:1930" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-white hover:bg-rose-400"><Phone className="h-4 w-4" />{t('callHelpline')}</a>
            <button onClick={copyHelpline} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? t('copied') : t('copyNumber')}</button>
            <button onClick={readGuidance} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"><Volume2 className="h-4 w-4" />{t('speakResult')}</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase text-cyan-300">Government of India</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{t('reportingPortal')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{t('helpDescription')} {t('complaintNotFiled')}</p>
          <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300">{t('reportingPortal')} <ArrowUpRight className="h-4 w-4" /></a>
          <p className="mt-5 border-t border-slate-700 pt-4 text-sm leading-6 text-slate-300">{t('smsUnverified')}</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-amber-400/25 bg-amber-950/20 p-5">
        <h2 className="text-lg font-semibold text-amber-100">{t('moneyLostTitle')}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
          <li>{t('moneyLostAdvice')}</li>
          <li>{t('contactBank')}</li>
          <li>{t('neverShare')}</li>
        </ul>
      </section>
      <p className="mt-5 text-xs leading-5 text-slate-500">{t('complaintNotFiled')}</p>
    </div>
  );
};