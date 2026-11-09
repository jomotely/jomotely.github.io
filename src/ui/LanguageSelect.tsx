import { usePrefs } from '../state/prefs';
import { LANGUAGES, useI18n } from '../i18n';
import { Select } from './Select';

export function LanguageSelect({ className }: { className?: string }) {
  const { t } = useI18n();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);

  return (
    <Select
      id="ui-language"
      className={className}
      value={lang}
      options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
      onChange={(value) => setLang(value as typeof lang)}
      ariaLabel={t('lang.label')}
    />
  );
}
