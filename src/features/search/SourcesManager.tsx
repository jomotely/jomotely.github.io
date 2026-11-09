import { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { ALL_SOURCES } from '../../core/sources';
import { REGION_PRESETS } from '../../core/presets';
import { useSearchStore } from '../../state/searchStore';
import { useUiStore } from '../../state/uiStore';
import { useI18n } from '../../i18n';
import { toast } from '../../state/toastStore';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { cx } from '../../ui/cx';

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const CATEGORY_KEYS = {
  ats: 'cat.ats',
  jobboard: 'cat.jobboard',
  general: 'cat.general',
} as const;

function categoryKey(category: keyof typeof CATEGORY_KEYS) {
  return CATEGORY_KEYS[category];
}

/** All sources ever known: builtin + preset extras + user-added. */
function sourcePool(custom: ReturnType<typeof useSearchStore.getState>['customSources']) {
  const presetExtras = REGION_PRESETS.flatMap((p) => p.extraSources ?? []);
  return [...ALL_SOURCES, ...presetExtras, ...custom];
}

/**
 * The Sources manager modal. Opened from the search form's Manage button and
 * from the sidebar's Setup group — one modal, two entries.
 */
export function SourcesManager() {
  const { t } = useI18n();
  const open = useUiStore((s) => s.sourcesOpen);
  const setOpen = (next: boolean) => (next ? useUiStore.getState().openSources() : useUiStore.getState().closeSources());
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [domainError, setDomainError] = useState(false);

  const sourceOrder = useSearchStore((s) => s.sourceOrder);
  const sourceDisabled = useSearchStore((s) => s.sourceDisabled);
  const customSources = useSearchStore((s) => s.customSources);
  const toggleSource = useSearchStore((s) => s.toggleSource);
  const moveSource = useSearchStore((s) => s.moveSource);
  const addCustomSource = useSearchStore((s) => s.addCustomSource);
  const removeCustomSource = useSearchStore((s) => s.removeCustomSource);

  const pool = sourcePool(customSources);
  const ordered = sourceOrder
    .map((id) => pool.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const submit = () => {
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!DOMAIN_PATTERN.test(clean)) {
      setDomainError(true);
      return;
    }
    setDomainError(false);
    addCustomSource(name, clean);
    setName('');
    setDomain('');
    toast.success(t('sources.add'));
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={t('sources.title')} wide>
      <div className="space-y-2">
        {ordered.map((source, index) => {
          const enabled = !sourceDisabled[source.id];
          const isCustom = source.id.startsWith('custom-');
          return (
            <div
              key={source.id}
              className={cx(
                'flex items-center gap-3 rounded-card border px-3 py-2.5 transition-colors duration-150',
                enabled
                  ? 'border-accent/25 bg-accent-tint/60'
                  : 'border-line bg-page',
              )}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-ink3" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{source.label}</span>
                  <Badge tone={source.category}>{t(categoryKey(source.category))}</Badge>
                  {isCustom && (
                    <span className="text-[11px] text-accent">{t('sources.customLabel')}</span>
                  )}
                </div>
                <div className="truncate font-mono text-[11px] text-ink3">
                  {source.domains.join(', ')}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('sources.reorderHint')}
                  disabled={index === 0}
                  onClick={() => moveSource(source.id, -1)}
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('sources.reorderHint')}
                  disabled={index === ordered.length - 1}
                  onClick={() => moveSource(source.id, 1)}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </Button>
                {isCustom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('common.remove')}
                    onClick={() => removeCustomSource(source.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${source.label}`}
                  onClick={() => toggleSource(source.id)}
                  className={cx(
                    'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150',
                    enabled ? 'bg-accent' : 'bg-line',
                  )}
                >
                  <span
                    className={cx(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all',
                      enabled ? 'start-[1.125rem]' : 'start-0.5',
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="hint">{t('sources.reorderHint')}</p>
      <p className="hint">{t('sources.generalNote')}</p>

      <div className="mt-4 rounded-card border border-line bg-page p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className="input"
            placeholder={t('sources.addNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t('sources.addName')}
          />
          <input
            className={cx('input', domainError && 'border-danger')}
            placeholder={t('sources.addDomainPlaceholder')}
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setDomainError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            aria-label={t('sources.addDomain')}
            aria-invalid={domainError}
          />
          <Button variant="primary" onClick={submit}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('sources.add')}
          </Button>
        </div>
        {domainError && <p className="mt-2 text-[13px] text-danger">{t('sources.invalidDomain')}</p>}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="subtle" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" aria-hidden="true" />
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
}
