import { ChevronDown, Languages } from 'lucide-react';
import { LANGUAGES, useLanguage } from '../i18n';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector = ({ compact = false }: LanguageSelectorProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`inline-flex items-center ${compact ? '' : 'gap-1.5'}`}>
      {!compact && (
        <span className="hidden sm:inline-block text-xs font-semibold text-(--app-text-secondary) whitespace-nowrap">
          {t('language')}:
        </span>
      )}
      <div className="relative inline-flex items-center">
        <Languages className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-(--app-primary) shrink-0 z-10" />
        <select
          aria-label={t('chooseLanguage')}
          value={language}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
          className="h-9 appearance-none rounded-xl border border-(--app-border) bg-(--app-surface-secondary) pl-7 pr-6 text-xs font-bold uppercase tracking-wider text-(--app-text) outline-none transition hover:border-(--app-primary) focus:border-(--app-primary) focus:ring-1 focus:ring-(--app-primary) cursor-pointer"
        >
          {LANGUAGES.map((item) => (
            <option
              key={item.code}
              value={item.code}
              title={`${item.name} (${item.native})`}
              className="bg-(--app-surface) text-(--app-text) font-semibold py-1"
            >
              {item.code.toUpperCase()}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-(--app-text-secondary) shrink-0" />
      </div>
    </div>
  );
};
