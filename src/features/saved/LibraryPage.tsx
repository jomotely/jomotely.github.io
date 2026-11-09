import { useMemo, useState } from 'react';
import {
  Bookmark,
  Copy,
  History,
  MoreHorizontal,
  Play,
  Pencil,
  Plus,
  Search as SearchIcon,
  Share2,
  Trash2,
} from 'lucide-react';
import { useSearchStore, type SavedSearch, type HistoryEntry } from '../../state/searchStore';
import { useI18n, type TKey, type Vars } from '../../i18n';
import { freshnessLabel } from '../search/labels';
import { getEngine } from '../../core/engines';
import { getPreset } from '../../core/presets';
import { buildShareUrl, type SharePayload } from '../../core/share';
import { toast } from '../../state/toastStore';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Popover, MenuItem, MenuDivider } from '../../ui/Popover';
import { Tabs } from '../../ui/Tabs';
import { DataPanel } from './DataPanel';
import { copyText } from '../search/clipboard';

export type LibraryTab = 'saved' | 'history';

type Translate = (key: TKey, vars?: Vars) => string;

export function relTime(t: Translate, at: number): string {
  const minutes = Math.floor((Date.now() - at) / 60_000);
  if (minutes < 1) return t('history.justNow');
  if (minutes < 60) return t('history.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('history.hoursAgo', { n: hours });
  return t('history.daysAgo', { n: Math.floor(hours / 24) });
}

export function summaryOf(entry: SavedSearch | HistoryEntry): string {
  const titles = entry.params.titles.join(', ');
  const location = entry.params.location;
  return [titles, location].filter(Boolean).join(', ');
}

function metaOf(t: Translate, entry: SavedSearch | HistoryEntry): string {
  return [
    getEngine(entry.engine).label,
    getPreset(entry.presetId).label,
    freshnessLabel(t, entry.freshness),
  ].join(', ');
}

async function copyShare(
  entry: SavedSearch | HistoryEntry,
  okMessage: string,
  errorMessage: string,
): Promise<void> {
  const payload: SharePayload = {
    v: 1,
    params: entry.params,
    engine: entry.engine,
    presetId: entry.presetId,
    freshness: entry.freshness,
  };
  const ok = await copyText(buildShareUrl(payload));
  toast[ok ? 'success' : 'error'](ok ? okMessage : errorMessage);
}

interface LibraryPageProps {
  tab: LibraryTab;
  onTab: (tab: LibraryTab) => void;
  onNavigateToSearch: () => void;
}

export function LibraryPage({ tab, onTab, onNavigateToSearch }: LibraryPageProps) {
  const { t } = useI18n();
  const saved = useSearchStore((s) => s.saved);
  const history = useSearchStore((s) => s.history);
  const saveCurrentSearch = useSearchStore((s) => s.saveCurrentSearch);
  const renameSaved = useSearchStore((s) => s.renameSaved);
  const duplicateSaved = useSearchStore((s) => s.duplicateSaved);
  const deleteSaved = useSearchStore((s) => s.deleteSaved);
  const runSaved = useSearchStore((s) => s.runSaved);
  const runHistory = useSearchStore((s) => s.runHistory);

  const [draftName, setDraftName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [savedFilter, setSavedFilter] = useState('');
  const [historyFilter, setHistoryFilter] = useState('');

  const filteredSaved = useMemo(() => {
    const needle = savedFilter.trim().toLowerCase();
    if (!needle) return saved;
    return saved.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) || summaryOf(entry).toLowerCase().includes(needle),
    );
  }, [saved, savedFilter]);

  const filteredHistory = useMemo(() => {
    const needle = historyFilter.trim().toLowerCase();
    if (!needle) return history;
    return history.filter((entry) => summaryOf(entry).toLowerCase().includes(needle));
  }, [history, historyFilter]);

  const save = () => {
    saveCurrentSearch(draftName);
    setDraftName('');
    toast.success(t('saved.saved'));
  };

  const searchField = (
    id: string,
    placeholder: TKey,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div className="relative w-full sm:max-w-72">
      <SearchIcon
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        className="input h-9 rounded-full ps-9"
        placeholder={t(placeholder)}
        aria-label={t(placeholder)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-[28px] font-medium leading-tight tracking-tight">{t('nav.library')}</h1>
        <p className="mt-1 text-sm text-ink2">{t('note.localOnly')}</p>
      </div>

      {/* Tabs with counts */}
      <div className="mb-5">
        <Tabs
          ariaLabel={t('nav.library')}
          active={tab}
          onChange={(id) => onTab(id as LibraryTab)}
          items={[
            { id: 'saved', label: t('saved.title'), count: saved.length },
            { id: 'history', label: t('history.title'), count: history.length },
          ]}
        />
      </div>

      {tab === 'saved' ? (
        <section aria-label={t('saved.title')} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {searchField('library-saved-search', 'toolbar.searchSaved', savedFilter, setSavedFilter)}
            <div className="flex items-center gap-2">
              <input
                className="input h-9 w-44 rounded-full"
                placeholder={t('saved.namePlaceholder')}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && draftName.trim() && save()}
                aria-label={t('saved.saveCurrent')}
              />
              <Button
                variant="primary"
                onClick={save}
                disabled={!draftName.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('saved.saveCurrent')}
              </Button>
            </div>
          </div>

          {saved.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title={t('saved.empty')}
              body={t('saved.emptyHint')}
              action={
                <Button variant="primary" onClick={onNavigateToSearch}>
                  {t('action.newSearch')}
                </Button>
              }
            />
          ) : filteredSaved.length === 0 ? (
            <p className="text-sm text-ink3">{t('common.noResults')}</p>
          ) : (
            <ul className="surface divide-y divide-line">
              {filteredSaved.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-ink/[0.025] sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    {renamingId === entry.id ? (
                      <div className="flex gap-2">
                        <input
                          className="input"
                          value={renameDraft}
                          autoFocus
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameSaved(entry.id, renameDraft);
                              setRenamingId(null);
                            }
                          }}
                          aria-label={t('common.edit')}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            renameSaved(entry.id, renameDraft);
                            setRenamingId(null);
                          }}
                        >
                          {t('common.save')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => setRenamingId(null)}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="truncate text-sm font-medium">{entry.name}</h3>
                        <p className="mt-0.5 truncate text-[13px] text-ink2">{summaryOf(entry)}</p>
                        <p className="mt-0.5 text-xs text-ink3">{metaOf(t, entry)}</p>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button variant="primary" size="sm" onClick={() => { runSaved(entry.id); onNavigateToSearch(); }}>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('saved.run')}
                    </Button>
                    <Popover
                      label={t('toolbar.menu')}
                      width="w-52"
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={t('toolbar.menu')}>
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      }
                    >
                      <MenuItem
                        icon={<Pencil />}
                        onClick={() => {
                          setRenamingId(entry.id);
                          setRenameDraft(entry.name);
                        }}
                      >
                        {t('common.edit')}
                      </MenuItem>
                      <MenuItem icon={<Copy />} onClick={() => duplicateSaved(entry.id)}>
                        {t('common.duplicate')}
                      </MenuItem>
                      <MenuItem
                        icon={<Share2 />}
                        onClick={() => void copyShare(entry, t('share.copied'), t('data.importError'))}
                      >
                        {t('results.share')}
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem
                        icon={<Trash2 />}
                        danger
                        onClick={() => {
                          deleteSaved(entry.id);
                          toast.info(t('saved.deleted'));
                        }}
                      >
                        {t('common.delete')}
                      </MenuItem>
                    </Popover>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section aria-label={t('history.title')} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {searchField('library-history-search', 'toolbar.searchHistory', historyFilter, setHistoryFilter)}
          </div>

          {history.length === 0 ? (
            <EmptyState
              icon={History}
              title={t('history.title')}
              body={t('history.empty')}
              action={
                <Button variant="primary" onClick={onNavigateToSearch}>
                  {t('action.newSearch')}
                </Button>
              }
            />
          ) : filteredHistory.length === 0 ? (
            <p className="text-sm text-ink3">{t('common.noResults')}</p>
          ) : (
            <ul className="surface divide-y divide-line">
              {filteredHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-ink/[0.025]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{summaryOf(entry)}</p>
                    <p className="mt-0.5 text-[13px] text-ink3">
                      {relTime(t, entry.at)}, {metaOf(t, entry)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="subtle"
                    className="shrink-0"
                    onClick={() => {
                      runHistory(entry.id);
                      onNavigateToSearch();
                    }}
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('history.rerun')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="mt-6">
        <DataPanel />
      </div>
    </div>
  );
}
