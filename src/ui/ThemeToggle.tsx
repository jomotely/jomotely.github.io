import { Moon, Sun } from 'lucide-react';
import { usePrefs } from '../state/prefs';
import { useI18n } from '../i18n';
import { cx } from './cx';

/** Segmented Dark/Light control — lives in Settings. */
export function ThemeToggle() {
  const { t } = useI18n();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);

  const options = [
    { value: 'light' as const, label: t('theme.light'), icon: Sun },
    { value: 'dark' as const, label: t('theme.dark'), icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className="inline-flex rounded-full border border-line bg-page p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-13 font-medium transition-colors duration-150',
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink2 hover:text-ink',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
