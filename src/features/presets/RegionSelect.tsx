import { REGION_PRESETS } from '../../core/presets';
import { useSearchStore } from '../../state/searchStore';
import { useI18n } from '../../i18n';
import { Select } from '../../ui/Select';

/** Region preset picker — label pairs each region with its language hint. */
export function RegionSelect({ id }: { id: string }) {
  const { t } = useI18n();
  const presetId = useSearchStore((s) => s.presetId);
  const setPreset = useSearchStore((s) => s.setPreset);
  return (
    <Select
      id={id}
      value={presetId}
      options={REGION_PRESETS.map((p) => ({ value: p.id, label: `${p.label} · ${p.languageHint}` }))}
      onChange={setPreset}
      ariaLabel={t('search.region')}
    />
  );
}
