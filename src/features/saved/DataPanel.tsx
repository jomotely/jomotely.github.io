import { useRef, useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import { parseCsv, toCsv } from '../../core/csv';
import { TRACKER_COLUMNS, useTrackerStore, type ColumnId, type TrackerCard, type TrackerCardInput } from '../../state/trackerStore';
import { useSearchStore, type SavedSearch } from '../../state/searchStore';
import { useI18n } from '../../i18n';
import { toast } from '../../state/toastStore';
import { uid } from '../../state/uid';
import { Button } from '../../ui/Button';
import { downloadFile } from './download';

const CSV_COLUMNS = ['column', 'title', 'company', 'url', 'notes', 'deadline'] as const;

export function trackerToCsv(cards: TrackerCard[]): string {
  const rows = cards.map((card) => [
    card.column,
    card.title,
    card.company,
    card.url,
    card.notes,
    card.deadline ?? '',
  ]);
  return toCsv([[...CSV_COLUMNS], ...rows]);
}

function toColumnId(raw: string): ColumnId {
  const clean = raw.trim().toLowerCase();
  return (TRACKER_COLUMNS as readonly string[]).includes(clean) ? (clean as ColumnId) : 'saved';
}

export function csvToTrackerCards(text: string): TrackerCardInput[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const colIndex = (name: string) => header.indexOf(name);
  const tIdx = colIndex('title');
  if (tIdx === -1) throw new Error('missing "title" column');
  const cIdx = colIndex('column');
  const coIdx = colIndex('company');
  const uIdx = colIndex('url');
  const nIdx = colIndex('notes');
  const dIdx = colIndex('deadline');
  const cell = (row: string[], index: number) => row[index] ?? '';

  return rows
    .slice(1)
    .filter((row) => cell(row, tIdx).trim() !== '')
    .map((row) => ({
      column: cIdx === -1 ? 'saved' : toColumnId(cell(row, cIdx)),
      title: cell(row, tIdx).trim(),
      company: cell(row, coIdx).trim(),
      url: cell(row, uIdx).trim(),
      notes: cell(row, nIdx).trim(),
      deadline: cell(row, dIdx).trim() || null,
    }));
}

function isTrackerCardInput(value: unknown): value is TrackerCardInput {
  if (typeof value !== 'object' || value === null) return false;
  const card = value as Record<string, unknown>;
  return typeof card['title'] === 'string' && typeof card['notes'] === 'string';
}

function isSavedSearch(value: unknown): value is SavedSearch {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item['name'] === 'string' &&
    typeof item['engine'] === 'string' &&
    typeof item['presetId'] === 'string' &&
    typeof item['freshness'] === 'string' &&
    typeof item['params'] === 'object' &&
    item['params'] !== null
  );
}

export function DataPanel() {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const cards = useTrackerStore((s) => s.cards);
  const importCards = useTrackerStore((s) => s.importCards);
  const saved = useSearchStore((s) => s.saved);
  const setSavedDirect = useSearchStore.setState;

  const exportSaved = () => {
    downloadFile(
      `siftly-saved-searches-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ app: 'siftly', type: 'saved-searches', version: 1, searches: saved }, null, 2),
    );
  };

  const exportTrackerJson = () => {
    downloadFile(
      `siftly-tracker-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ app: 'siftly', type: 'tracker', version: 1, cards }, null, 2),
    );
  };

  const exportTrackerCsv = () => {
    downloadFile(
      `siftly-tracker-${new Date().toISOString().slice(0, 10)}.csv`,
      trackerToCsv(cards),
      'text/csv;charset=utf-8',
    );
  };

  const importFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      let count = 0;
      let handled = false;

      if (file.name.toLowerCase().endsWith('.csv')) {
        count = importCards(csvToTrackerCards(text), 'merge');
        handled = true;
      } else {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (Array.isArray(parsed['searches'])) {
          const searches = (parsed['searches'] as unknown[]).filter(isSavedSearch).map((item) => ({
            ...item,
            id: uid(),
          }));
          setSavedDirect((state) => ({ saved: [...searches, ...state.saved] }));
          count = searches.length;
          handled = true;
        } else if (Array.isArray(parsed['cards'])) {
          const cardsIn = (parsed['cards'] as unknown[]).filter(isTrackerCardInput);
          count = importCards(cardsIn, 'merge');
          handled = true;
        }
      }

      if (!handled) throw new Error('unrecognized format');
      toast.success(t('data.imported', { n: count }));
    } catch {
      toast.error(t('data.importError'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="surface p-4 sm:p-5">
      <h2 className="text-base font-medium">{t('data.title')}</h2>
      <p className="hint">{t('data.hint')}</p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Button onClick={exportSaved} disabled={saved.length === 0}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('data.exportSaved')}
        </Button>
        <Button onClick={exportTrackerJson} disabled={cards.length === 0}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('data.exportTrackerJson')}
        </Button>
        <Button onClick={exportTrackerCsv} disabled={cards.length === 0}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('data.exportTrackerCsv')}
        </Button>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-field border border-dashed border-line px-4 py-5 text-sm text-ink2 transition-colors duration-150 hover:border-accent hover:text-accent">
        <FileUp className="h-4 w-4" aria-hidden="true" />
        {busy ? '…' : t('data.import')}
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,text/csv,application/json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
          }}
        />
      </label>
    </section>
  );
}
