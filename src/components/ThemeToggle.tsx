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
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-(--app-border) bg-(--app-card) text-(--app-text) transition-colors hover:bg-(--app-card-muted) ${compact ? 'h-10 w-10' : 'min-h-10 px-3 text-sm'}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && <span>{label}</span>}
    </button>
  );
};
