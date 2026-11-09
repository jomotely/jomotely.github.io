import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Copy,
  Funnel,
  Info,
  MoreHorizontal,
  Radar,
  Search as SearchIcon,
  Share2,
  X,
} from 'lucide-react';
import { useSearchStore, type SearchResult } from '../../state/searchStore';
import { useI18n, type TKey } from '../../i18n';
import type { Freshness } from '../../core/types';
import { copyText } from './clipboard';
import { freshnessLabel } from './labels';
import { buildShareUrl } from '../../core/share';
import { toast } from '../../state/toastStore';
import { AvatarCircle, initialsOf } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Popover, MenuItem, MenuDivider } from '../../ui/Popover';
import { Select } from '../../ui/Select';
import { cx } from '../../ui/cx';

const PAGE_SIZES = [10, 25, 50];

function NoticeLine({ result }: { result: SearchResult }) {
  const { t } = useI18n();
  if (result.notice.kind === 'exact') return null;
  const text =
    result.notice.kind === 'rounded'
      ? t('results.rounded', {
          engine: result.engineLabel,
          from: freshnessLabel(t, result.notice.from),
          to: freshnessLabel(t, result.notice.to),
        })
      : t('results.unsupported', { engine: result.engineLabel });
  return (
    <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-snug text-warn">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {text}
    </p>
  );
}

interface RowProps {
  result: SearchResult;
  freshness: Freshness;
  opened: boolean;
  onOpen: (result: SearchResult) => void;
  onCopy: (result: SearchResult) => void;
  onSave: () => void;
  onShare: () => void;
  onRemove: (result: SearchResult) => void;
}

function ResultRow({ result, freshness, opened, onOpen, onCopy, onSave, onShare, onRemove }: RowProps) {
  const { t } = useI18n();

  // The window this row's URL actually carries: rounded when the engine
  // rounded, none at all when the engine has no freshness filter.
  const windowLabel =
    result.notice.kind === 'unsupported'
      ? t('results.anyTime')
      : freshnessLabel(t, result.notice.kind === 'rounded' ? result.notice.to : freshness);

  return (
    <li className="group grid grid-cols-1 gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-ink/[0.025] md:grid-cols-[minmax(0,230px)_minmax(0,1fr)_110px_auto] md:items-start md:gap-5">
      {/* Source */}
      <div className="flex min-w-0 items-center gap-3">
        <AvatarCircle initials={initialsOf(result.label)} tone={result.category} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{result.label}</p>
          <p dir="ltr" className="truncate font-mono text-xs text-ink3">
            {result.domains.join(', ')}
          </p>
        </div>
      </div>

      {/* Query */}
      <div className="min-w-0">
        <div className="flex items-start gap-1.5">
          <p
            dir="ltr"
            title={result.query}
            className="min-w-0 flex-1 break-words font-mono text-[12.5px] leading-relaxed text-ink2 md:truncate"
          >
            {result.query}
          </p>
          <button
            type="button"
            onClick={() => onCopy(result)}
            aria-label={t('results.copyQuery')}
            title={t('results.copyQuery')}
            className="shrink-0 rounded-md p-1 text-ink3 transition-colors duration-150 hover:bg-ink/[0.06] hover:text-ink"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <NoticeLine result={result} />
      </div>

      {/* Status — plain muted text, no badge */}
      <p className="text-[13px] text-ink3 md:pt-1">
        <span className="md:hidden">{result.engineLabel}, {windowLabel} · </span>
        {opened ? t('status.opened') : t('status.notOpened')}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 md:justify-end md:pt-0.5">
        <button
          type="button"
          onClick={() => onOpen(result)}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-strong hover:underline"
        >
          {t('results.open')}
          <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
        <Popover
          label={t('toolbar.menu')}
          width="w-52"
          trigger={
            <Button variant="ghost" size="icon" aria-label={t('toolbar.menu')}>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        >
          <MenuItem icon={<Copy />} onClick={() => onCopy(result)}>
            {t('results.copyQuery')}
          </MenuItem>
          <MenuItem icon={<Bookmark />} onClick={onSave}>
            {t('menu.saveSearch')}
          </MenuItem>
          <MenuItem icon={<Share2 />} onClick={onShare}>
            {t('results.share')}
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<X />} danger onClick={() => onRemove(result)}>
            {t('menu.hideSource')}
          </MenuItem>
        </Popover>
      </div>
    </li>
  );
}

export function ResultsGrid() {
  const { t } = useI18n();
  const results = useSearchStore((s) => s.results);
  const freshness = useSearchStore((s) => s.freshness);
  const openedIds = useSearchStore((s) => s.openedIds);
  const markOpened = useSearchStore((s) => s.markOpened);
  const toggleSource = useSearchStore((s) => s.toggleSource);
  const saveCurrentSearch = useSearchStore((s) => s.saveCurrentSearch);

  // Presentation-only list state: text filter, category filter, hidden rows,
  // pagination. Never persisted, reset when a new run replaces the results.
  const [textFilter, setTextFilter] = useState('');
  const [categoryDraft, setCategoryDraft] = useState<string>('all');
  const [categoryApplied, setCategoryApplied] = useState<string>('all');
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(25);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setTextFilter('');
    setCategoryDraft('all');
    setCategoryApplied('all');
    setHiddenIds([]);
    setPageSize(25);
    setFilterOpen(false);
  }, [results]);

  const visible = useMemo(() => {
    if (!results) return [];
    const needle = textFilter.trim().toLowerCase();
    return results.filter((result) => {
      if (hiddenIds.includes(result.sourceId)) return false;
      if (categoryApplied !== 'all' && result.category !== categoryApplied) return false;
      if (!needle) return true;
      return (
        result.label.toLowerCase().includes(needle) ||
        result.domains.join(' ').toLowerCase().includes(needle) ||
        result.query.toLowerCase().includes(needle)
      );
    });
  }, [results, textFilter, categoryApplied, hiddenIds]);

  if (!results) {
    return (
      <section aria-label={t('results.title')} className="mt-8">
        <EmptyState
          icon={Radar}
          title={t('results.empty')}
          body={t('results.emptyHint')}
          action={
            <Button variant="primary" onClick={() => document.getElementById('job-titles')?.focus()}>
              {t('results.emptyAction')}
            </Button>
          }
        />
      </section>
    );
  }

  if (results.length === 0) {
    return (
      <section aria-label={t('results.title')} className="mt-8">
        <EmptyState icon={Radar} title={t('results.noSources')} body={t('results.emptyHint')} />
      </section>
    );
  }

  const open = (result: SearchResult) => {
    const win = window.open(result.url, '_blank');
    if (win) win.opener = null;
    else toast.warning(t('results.popupBlocked'));
    markOpened(result.sourceId);
  };

  const openAll = () => {
    let blocked = 0;
    // Synchronous loop: stays inside the user gesture, so browsers that allow
    // multiple pop-ups open everything at once.
    for (const result of visible) {
      const win = window.open(result.url, '_blank');
      if (win) win.opener = null;
      else blocked += 1;
      markOpened(result.sourceId);
    }
    if (blocked > 0) toast.warning(t('results.popupBlocked'));
  };

  const copy = async (result: SearchResult) => {
    const ok = await copyText(result.query);
    toast[ok ? 'success' : 'error'](t(ok ? 'results.queryCopied' : 'data.importError'));
  };

  const share = async () => {
    const state = useSearchStore.getState();
    const ok = await copyText(
      buildShareUrl({
        v: 1,
        params: state.currentParams(),
        engine: state.engine,
        presetId: state.presetId,
        freshness: state.freshness,
      }),
    );
    toast[ok ? 'success' : 'error'](t(ok ? 'share.copied' : 'data.importError'));
  };

  const save = () => {
    const state = useSearchStore.getState();
    const firstTitle = state.titlesRaw.split(',')[0]?.trim() ?? '';
    const name = [firstTitle, state.location].filter(Boolean).join(', ') || 'Search';
    saveCurrentSearch(name);
    toast.success(t('saved.saved'));
  };

  const remove = (result: SearchResult) => {
    toggleSource(result.sourceId);
    setHiddenIds((ids) => [...ids, result.sourceId]);
    toast.info(t('menu.hiddenToast'));
  };

  const categoryOptions = [
    { value: 'all', label: t('filter.categoryAll') },
    { value: 'ats', label: t('cat.ats') },
    { value: 'jobboard', label: t('cat.jobboard') },
    { value: 'general', label: t('cat.general') },
  ];

  const paged = visible.slice(0, pageSize);
  const activeFilters: { key: string; label: string }[] =
    categoryApplied === 'all'
      ? []
      : [{ key: 'category', label: t('filter.category') + ': ' + t(`cat.${categoryApplied}` as TKey) }];

  return (
    <section aria-label={t('results.title')} className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium tracking-tight">{t('results.title')}</h2>
          <p className="mt-0.5 text-[13px] text-ink3">
            {t('results.count', { n: visible.length })}
          </p>
        </div>
        <Button variant="primary" onClick={openAll}>
          {t('results.openAll', { n: visible.length })}
        </Button>
      </div>

      {/* Toolbar: pill search, pill filter, overflow menu — same height. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <SearchIcon
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3"
            aria-hidden="true"
          />
          <input
            type="search"
            className="input h-9 rounded-full ps-9"
            placeholder={t('toolbar.searchResults')}
            aria-label={t('toolbar.searchResults')}
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
          />
        </div>

        <Popover
          label={t('filter.title')}
          width="w-64"
          open={filterOpen}
          onOpenChange={setFilterOpen}
          trigger={
            <Button
              variant="subtle"
              className={cx('h-9 rounded-full px-4', categoryApplied !== 'all' && 'border-accent/40 bg-accent-tint text-accent')}
            >
              <Funnel className="h-4 w-4" aria-hidden="true" />
              {t('toolbar.filter')}
            </Button>
          }
        >
          <div className="p-2">
            <p className="label">{t('filter.category')}</p>
            <Select
              id="filter-category"
              value={categoryDraft}
              options={categoryOptions}
              onChange={setCategoryDraft}
            />
            <div className="mt-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryDraft('all');
                  setCategoryApplied('all');
                }}
              >
                {t('filter.reset')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCategoryApplied(categoryDraft);
                  setFilterOpen(false);
                }}
              >
                {t('filter.apply')}
              </Button>
            </div>
          </div>
        </Popover>

        <div className="ms-auto">
          <Popover
            label={t('toolbar.menu')}
            width="w-52"
            trigger={
              <Button variant="ghost" size="icon" aria-label={t('toolbar.menu')}>
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            }
          >
            <MenuItem icon={<Share2 />} onClick={share}>
              {t('results.share')}
            </MenuItem>
          </Popover>
        </div>
      </div>

      {/* Active filters as removable chips */}
      {activeFilters.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-tint px-3 text-[13px] font-medium text-accent"
            >
              {filter.label}
              <button
                type="button"
                onClick={() => {
                  setCategoryApplied('all');
                  setCategoryDraft('all');
                }}
                aria-label={t('filter.clear')}
                className="rounded-full p-0.5 transition-colors duration-150 hover:bg-accent/15"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="mb-3 mt-3 text-[13px] text-ink3">{t('results.popupNote')}</p>

      <div className="surface">
        {/* Column headers — small gray text, desktop only */}
        <div className="hidden grid-cols-[minmax(0,230px)_minmax(0,1fr)_110px_auto] gap-5 border-b border-line px-4 pb-2 pt-3 md:grid">
          <p className="text-xs font-medium text-ink3">{t('table.source')}</p>
          <p className="text-xs font-medium text-ink3">{t('table.query')}</p>
          <p className="text-xs font-medium text-ink3">{t('table.status')}</p>
          <p className="sr-only">{t('table.actions')}</p>
        </div>

        <ol className="divide-y divide-line">
          {paged.map((result) => (
            <ResultRow
              key={result.sourceId}
              result={result}
              freshness={freshness}
              opened={openedIds.includes(result.sourceId)}
              onOpen={open}
              onCopy={copy}
              onSave={save}
              onShare={share}
              onRemove={remove}
            />
          ))}
        </ol>
      </div>

      {/* Pagination / footer control */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <span className="text-[13px] text-ink3">
          {paged.length} / {visible.length}
        </span>
        <Select
          id="results-page-size"
          className="w-24"
          value={String(pageSize)}
          options={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))}
          onChange={(value) => setPageSize(Number(value))}
          ariaLabel={t('rows.label')}
        />
      </div>
    </section>
  );
}
