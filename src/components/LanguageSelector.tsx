import { Languages } from 'lucide-react';
import { LANGUAGES, useLanguage } from '../i18n';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector = ({ compact = false }: LanguageSelectorProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <Languages className="h-4 w-4 shrink-0 text-cyan-300" />
      <span className={compact ? 'sr-only' : 'text-slate-400'}>{t('language')}</span>
      <select
        aria-label={t('chooseLanguage')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
        className="min-w-0 rounded-md border border-slate-600/70 bg-slate-950/80 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300"
      >
        {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
      </select>
    </label>
  );
};