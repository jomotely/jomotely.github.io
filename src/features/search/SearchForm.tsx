import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ChevronDown, Copy, Search } from 'lucide-react';
import { useSearchStore, allKnownSources } from '../../state/searchStore';
import { useI18n, type TKey } from '../../i18n';
import { useUiStore } from '../../state/uiStore';
import { usePrefs } from '../../state/prefs';
import {
  FRESHNESS_ORDER,
  type ExperienceLevel,
  type Freshness,
  type RemotePref,
} from '../../core/types';
import { buildSourceQuery, parseTitles } from '../../core/queryBuilder';
import { ENGINES } from '../../core/engines';
import type { EngineId } from '../../core/engines';
import type { JobSource } from '../../core/sources';
import { Field } from '../../ui/Field';
import { Select } from '../../ui/Select';
import { Chip } from '../../ui/Chip';
import { Button } from '../../ui/Button';
import { RegionSelect } from '../presets/RegionSelect';
import { copyText } from './clipboard';
import { freshnessLabel } from './labels';
import { toast } from '../../state/toastStore';
import { BooleanBuilderModal } from './BooleanBuilderModal';
import { relTime, summaryOf, type LibraryTab } from '../saved/LibraryPage';
import { cx } from '../../ui/cx';

const LEVELS: ExperienceLevel[] = ['intern', 'junior', 'mid', 'senior', 'lead'];
const LEVEL_KEYS: Record<ExperienceLevel, TKey> = {
  intern: 'search.levelIntern',
  junior: 'search.levelJunior',
  mid: 'search.levelMid',
  senior: 'search.levelSenior',
  lead: 'search.levelLead',
};

const EXAMPLE_KEYS: TKey[] = ['home.example1', 'home.example2', 'home.example3'];

/** Mirrors the store's salary parsing so the preview matches real output. */
function previewSalary(raw: string): number | null {
  const trimmed = raw.trim().replace(/[,\s_]/g, '');
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * The home page form: one large pill search bar, a compact quick row
 * (Location / Remote / Posted within), an expandable "More filters" panel
 * holding every other field, example chips and the latest searches.
 * Submitting (button or Enter) generates the links — the page then flips
 * to the results state.
 */
export function SearchForm({ onOpenLibrary }: { onOpenLibrary: (tab: LibraryTab) => void }) {
  const { t } = useI18n();
  const state = useSearchStore();
  const openSources = useUiStore((s) => s.openSources);
  const regionFocusTick = useUiStore((s) => s.regionFocusTick);
  const moreOpen = usePrefs((s) => s.moreFiltersOpen);
  const setMoreOpen = usePrefs((s) => s.setMoreFiltersOpen);
  const regionWrapRef = useRef<HTMLDivElement>(null);
  const [regionHighlighted, setRegionHighlighted] = useState(false);
  const [previewCopied, setPreviewCopied] = useState(false);

  const pool = allKnownSources(state.customSources);
  const orderedSources = state.sourceOrder
    .map((id) => pool.find((source) => source.id === id))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));
  const enabledSources = orderedSources.filter((source) => !state.sourceDisabled[source.id]);
  const enabledCount = enabledSources.length;

  const hasTitle = parseTitles(state.titlesRaw).length > 0;

  // "Region" in the More menu lands here: expand the panel, then reveal,
  // scroll to, and briefly highlight the existing region field.
  useEffect(() => {
    if (regionFocusTick === 0) return;
    setMoreOpen(true);
    const timer = window.setTimeout(() => {
      const wrap = regionWrapRef.current;
      if (!wrap) return;
      wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const select = wrap.querySelector<HTMLSelectElement>('#job-region');
      select?.focus({ preventScroll: true });
      setRegionHighlighted(true);
      window.setTimeout(() => setRegionHighlighted(false), 1800);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [regionFocusTick, setMoreOpen]);

  // Live query preview — the canonical string for the first enabled source.
  const preview = useMemo(() => {
    if (!hasTitle || enabledSources.length === 0) return null;
    const source: JobSource = enabledSources[0];
    const query = buildSourceQuery(
      {
        titles: parseTitles(state.titlesRaw),
        location: state.location,
        remote: state.remote,
        salaryMin: previewSalary(state.salaryMin),
        salaryMax: previewSalary(state.salaryMax),
        experience: state.experience,
        extraKeywords: state.extraKeywords,
      },
      source,
    );
    return { query, sourceLabel: source.label };
  }, [
    hasTitle,
    enabledSources,
    state.titlesRaw,
    state.location,
    state.remote,
    state.salaryMin,
    state.salaryMax,
    state.experience,
    state.extraKeywords,
  ]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    state.runSearch();
  };

  const copyPreview = async () => {
    if (!preview) return;
    const ok = await copyText(preview.query);
    if (ok) {
      setPreviewCopied(true);
      window.setTimeout(() => setPreviewCopied(false), 1500);
    }
    toast[ok ? 'success' : 'error'](t(ok ? 'results.queryCopied' : 'data.importError'));
  };

  const remoteOptions = [
    { value: 'include', label: t('search.remoteInclude') },
    { value: 'exclude', label: t('search.remoteExclude') },
    { value: 'remote-only', label: t('search.remoteOnly') },
  ];

  const levelOptions = [
    { value: '', label: t('search.levelNone') },
    ...LEVELS.map((level) => ({ value: level, label: t(LEVEL_KEYS[level]) })),
  ];

  const freshnessOptions = FRESHNESS_ORDER.map((value) => ({
    value,
    label: freshnessLabel(t, value),
  }));

  return (
    <form onSubmit={submit}>
      {/* The search bar: 64px pill, icon left, hints and the accent action inside. */}
      <div className="pill-bar relative flex h-16 items-center rounded-full border border-line bg-surface ps-[52px] pe-1.5">
        <Search
          className="pointer-events-none absolute start-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink3"
          aria-hidden="true"
        />
        <input
          id="job-titles"
          autoFocus
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink3 focus:outline-none"
          placeholder={t('search.titlesPlaceholder')}
          aria-label={t('search.titles')}
          value={state.titlesRaw}
          onChange={(e) => state.update({ titlesRaw: e.target.value })}
          autoComplete="off"
          spellCheck={false}
        />
        <span className="kbd me-1.5 hidden shrink-0 sm:inline-flex">{t('search.focusHint')}</span>
        <span className="kbd me-3 hidden shrink-0 sm:inline-flex">{t('search.runHint')}</span>
        <Button
          type="submit"
          variant="primary"
          className="h-[52px] shrink-0 self-center px-5"
          disabled={!hasTitle}
        >
          {t('search.run')}
        </Button>
      </div>

      {/* Live query preview — appears under the bar once a title is typed. */}
      {preview && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-ink2">{t('preview.title')}</span>
            <Button variant="ghost" size="sm" onClick={copyPreview} aria-label={t('results.copyQuery')}>
              {previewCopied ? (
                <span className="text-accent">{t('common.copied')}</span>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('common.copy')}
                </>
              )}
            </Button>
          </div>
          <pre
            dir="ltr"
            className="scroll-slim whitespace-pre-wrap break-all rounded-card border border-line bg-page p-3.5 font-mono text-[12.5px] leading-relaxed text-ink2"
          >
            {preview.query}
          </pre>
          <p className="hint">{t('preview.note', { source: preview.sourceLabel })}</p>
        </div>
      )}

      {/* Quick row: three equal-height controls. */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)_minmax(0,180px)] sm:gap-3">
        <Field label={t('search.location')} htmlFor="job-location">
          <input
            id="job-location"
            className="input h-10"
            placeholder={t('search.locationPlaceholder')}
            value={state.location}
            onChange={(e) => state.update({ location: e.target.value })}
            autoComplete="off"
          />
        </Field>

        <Field label={t('search.remote')} htmlFor="job-remote">
          <Select
            id="job-remote"
            className="[&_select]:h-10"
            value={state.remote}
            options={remoteOptions}
            onChange={(value) => state.update({ remote: value as RemotePref })}
          />
        </Field>

        <Field label={t('search.freshness')} htmlFor="job-freshness">
          <Select
            id="job-freshness"
            className="[&_select]:h-10"
            value={state.freshness}
            options={freshnessOptions}
            onChange={(value) => state.update({ freshness: value as Freshness })}
          />
        </Field>
      </div>

      {/* More filters — expands to reveal everything else in the form. */}
      <button
        type="button"
        onClick={() => setMoreOpen(!moreOpen)}
        aria-expanded={moreOpen}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink2 transition-colors duration-150 hover:text-ink"
      >
        <ChevronDown
          className={cx('h-4 w-4 transition-transform duration-150', moreOpen && 'rotate-180')}
          aria-hidden="true"
        />
        {t('home.moreFilters')}
      </button>

      {moreOpen && (
        <div className="surface mt-3 animate-panel-in p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              ref={regionWrapRef}
              className={cx(
                'rounded-field transition-shadow duration-150',
                regionHighlighted && 'ring-2 ring-accent/60',
              )}
            >
              <Field label={t('search.region')} htmlFor="job-region">
                <RegionSelect id="job-region" />
              </Field>
            </div>

            <Field label={t('search.salary')} htmlFor="job-salary-min">
              <div className="flex items-center gap-2">
                <input
                  id="job-salary-min"
                  className="input"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder={t('search.salaryMin')}
                  value={state.salaryMin}
                  onChange={(e) => state.update({ salaryMin: e.target.value })}
                />
                <span className="shrink-0 text-sm text-ink3" aria-hidden="true">
                  –
                </span>
                <input
                  id="job-salary-max"
                  className="input"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder={t('search.salaryMax')}
                  value={state.salaryMax}
                  onChange={(e) => state.update({ salaryMax: e.target.value })}
                  aria-label={t('search.salaryMax')}
                />
              </div>
            </Field>

            <Field label={t('search.level')} htmlFor="job-level">
              <Select
                id="job-level"
                value={state.experience ?? ''}
                options={levelOptions}
                onChange={(value) =>
                  state.update({ experience: (value || null) as ExperienceLevel | null })
                }
              />
            </Field>

            <Field label={t('search.engine')} htmlFor="job-engine">
              <Select
                id="job-engine"
                value={state.engine}
                options={ENGINES.map((e) => ({ value: e.id, label: e.label }))}
                onChange={(value) => state.update({ engine: value as EngineId })}
              />
            </Field>

            <Field label={t('search.extra')} htmlFor="job-extra" className="sm:col-span-2">
              <input
                id="job-extra"
                className="input"
                placeholder={t('search.extraPlaceholder')}
                value={state.extraKeywords}
                onChange={(e) => state.update({ extraKeywords: e.target.value })}
                autoComplete="off"
              />
            </Field>
          </div>
          <p className="hint">{t('search.salaryHint')}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="label mb-0 me-1">{t('search.freshness')}</span>
            {FRESHNESS_ORDER.map((freshness) => (
              <Chip
                key={freshness}
                active={state.freshness === freshness}
                onClick={() => state.update({ freshness })}
              >
                {freshnessLabel(t, freshness)}
              </Chip>
            ))}
          </div>

          <div className="mt-4">
            <BooleanBuilderModal />
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-ink2">
                {t('sources.title')}
                <span className="ms-2 text-[13px] font-normal text-ink3">
                  {t('sources.enabledCount', { n: enabledCount })}
                </span>
              </span>
              <Button variant="subtle" size="sm" onClick={openSources}>
                {t('sources.manage')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {orderedSources.map((source) => (
                <Chip
                  key={source.id}
                  active={!state.sourceDisabled[source.id]}
                  onClick={() => state.toggleSource(source.id)}
                  title={source.domains.join(', ')}
                >
                  {source.label}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-ink3">{t('sources.generalNote')}</p>
          </div>
        </div>
      )}

      {/* Quiet line under the form: how many sources are live, with Manage. */}
      <p className="mt-4 text-[13px] text-ink3">
        {t('home.sourcesLine', { n: enabledCount })}
        <span aria-hidden="true"> · </span>
        <button
          type="button"
          onClick={openSources}
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-strong hover:underline"
        >
          {t('sources.manage')}
        </button>
      </p>

      {/* Example chips — fill the bar without submitting. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_KEYS.map((key) => (
          <Chip key={key} onClick={() => state.update({ titlesRaw: t(key) })}>
            {t(key)}
          </Chip>
        ))}
      </div>

      {/* Recent searches — only when there is history, three at most. */}
      {state.history.length > 0 && (
        <section aria-label={t('history.title')} className="mt-8">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-medium">{t('history.title')}</h2>
            <button
              type="button"
              onClick={() => onOpenLibrary('history')}
              className="text-[13px] font-medium text-accent transition-colors duration-150 hover:text-accent-strong hover:underline"
            >
              {t('home.viewAll')}
            </button>
          </div>
          <ul className="surface divide-y divide-line">
            {state.history.slice(0, 3).map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => state.runHistory(entry.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start transition-colors duration-150 hover:bg-ink/[0.025]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{summaryOf(entry)}</span>
                    <span className="block text-[13px] text-ink3">{relTime(t, entry.at)}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-medium text-accent">
                    {t('history.rerun')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </form>
  );
}
