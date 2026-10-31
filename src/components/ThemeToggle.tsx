import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { getThemeSwitchLabel, useLanguage } from '../i18n';

export const ThemeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const label = getThemeSwitchLabel(language, theme === 'dark' ? 'light' : 'dark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-(--app-border) bg-(--app-surface-secondary) text-(--app-text) transition hover:border-(--app-primary) cursor-pointer ${
        compact ? 'h-9 w-9' : 'min-h-9 px-3 text-xs font-semibold'
      }`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4 text-(--app-secondary)" /> : <Moon className="h-4 w-4 text-(--app-primary)" />}
      {!compact && <span>{label}</span>}
    </button>
  );
};
