import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { en } from './en';
import { fr } from './fr';
import { ar } from './ar';
import { usePrefs, type Lang } from '../state/prefs';

export type Dict = typeof en;
export type TKey = keyof Dict;
export type Vars = Record<string, string | number>;

export const LANGUAGES: { id: Lang; label: string; dir: 'ltr' | 'rtl' }[] = [
  { id: 'en', label: 'English', dir: 'ltr' },
  { id: 'fr', label: 'Français', dir: 'ltr' },
  { id: 'ar', label: 'العربية', dir: 'rtl' },
];

const DICTS: Record<Lang, Dict> = { en, fr, ar };

function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

interface I18nContextValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  t: (key: TKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = usePrefs((s) => s.lang);
  const dir = LANGUAGES.find((l) => l.id === lang)?.dir ?? 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = useCallback(
    (key: TKey, vars?: Vars) => {
      const dict = DICTS[lang] ?? en;
      const template = dict[key] ?? en[key];
      return format(template, vars);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, dir, t }), [lang, dir, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
