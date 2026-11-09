import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Funnel, KanbanSquare, MoreHorizontal, Plus, Search as SearchIcon, X } from 'lucide-react';
import {
  TRACKER_COLUMNS,
  useTrackerStore,
  type ColumnId,
  type TrackerCard,
} from '../../state/trackerStore';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Popover, MenuItem } from '../../ui/Popover';
import { Select } from '../../ui/Select';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';
import { CardEditor, columnLabel } from './CardEditor';
import { cx } from '../../ui/cx';

/** Desaturated status palette, shared by the column dot and card avatars. */
const ACCENTS: Record<ColumnId, string> = {
  saved: 'bg-ink3',
  applied: 'bg-ok',
  interview: 'bg-warn',
  offer: 'bg-accent',
  rejected: 'bg-danger',
};

const AVATAR_TONES: Record<ColumnId, string> = {
  saved: 'bg-ink/[0.07] text-ink2',
  applied: 'bg-ok/10 text-ok',
  interview: 'bg-warn/10 text-warn',
  offer: 'bg-accent-tint text-accent',
  rejected: 'bg-danger/10 text-danger',
};

export function TrackerPage() {
  const { t } = useI18n();
  const cards = useTrackerStore((s) => s.cards);
  const moveCard = useTrackerStore((s) => s.moveCard);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TrackerCard | null>(null);
  const [editorColumn, setEditorColumn] = useState<ColumnId>('saved');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Presentation-only list state.
  const [textFilter, setTextFilter] = useState('');
  const [columnDraft, setColumnDraft] = useState<string>('all');
  const [columnApplied, setColumnApplied] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = useMemo(() => {
    const needle = textFilter.trim().toLowerCase();
    return cards.filter((card) => {
      if (columnApplied !== 'all' && card.column !== columnApplied) return false;
      if (!needle) return true;
      return (
        card.title.toLowerCase().includes(needle) ||
        card.company.toLowerCase().includes(needle) ||
        card.notes.toLowerCase().includes(needle)
      );
    });
  }, [cards, textFilter, columnApplied]);

  const hiddenByColumn = useMemo(() => {
    const hidden = cards.length - filtered.length;
    return hidden;
  }, [cards, filtered]);

  const columns = useMemo(() => {
    const map = {} as Record<ColumnId, TrackerCard[]>;
    for (const column of TRACKER_COLUMNS) map[column] = [];
    for (const card of filtered) {
      if (map[card.column]) map[card.column].push(card);
    }
    return map;
  }, [filtered]);

  const openAdd = (column: ColumnId) => {
    setEditing(null);
    setEditorColumn(column);
    setEditorOpen(true);
  };

  const openEdit = (card: TrackerCard) => {
    setEditing(card);
    setEditorOpen(true);
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const activeCard = cards.find((c) => c.id === String(event.active.id));
    const over = event.over;
    if (!activeCard || !over) return;

    if (over.data.current?.type === 'column') {
      moveCard(activeCard.id, over.id as ColumnId);
      return;
    }
    const overCard = over.data.current?.card as TrackerCard | undefined;
    if (!overCard) return;
    // Index of the hovered card inside its column (including the dragged card
    // when moving within the same column) — matches the store's semantics.
    const columnIds = cards.filter((c) => c.column === overCard.column).map((c) => c.id);
    const index = columnIds.indexOf(String(over.id));
    moveCard(activeCard.id, overCard.column, index < 0 ? undefined : index);
  };

  const activeCard = activeId ? cards.find((c) => c.id === activeId) ?? null : null;

  const columnOptions = [
    { value: 'all', label: t('filter.columnAll') },
    ...TRACKER_COLUMNS.map((column) => ({ value: column, label: columnLabel(t, column) })),
  ];

  const activeFilters =
    columnApplied === 'all'
      ? []
      : [{ key: 'column', label: t('filter.column') + ': ' + columnLabel(t, columnApplied as ColumnId) }];

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Page header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-medium leading-tight tracking-tight">{t('tracker.title')}</h1>
          <p className="mt-1 text-sm text-ink2">{t('tracker.hint')}</p>
          <p className="mt-0.5 text-[13px] text-ink3">{t('note.localOnly')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="primary" className="h-9" onClick={() => openAdd('saved')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('tracker.add')}
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title={t('tracker.emptyTitle')}
          body={t('tracker.emptyHint')}
          action={
            <Button variant="primary" onClick={() => openAdd('saved')}>
              {t('tracker.add')}
            </Button>
          }
        />
      ) : (
        <>
          {/* Toolbar: pill search, pill filter, overflow menu — same height. */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-72">
              <SearchIcon
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3"
                aria-hidden="true"
              />
              <input
                type="search"
                className="input h-9 rounded-full ps-9"
                placeholder={t('toolbar.searchCards')}
                aria-label={t('toolbar.searchCards')}
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
                  className={cx('h-9 rounded-full px-4', columnApplied !== 'all' && 'border-accent/40 bg-accent-tint text-accent')}
                >
                  <Funnel className="h-4 w-4" aria-hidden="true" />
                  {t('toolbar.filter')}
                </Button>
              }
            >
              <div className="p-2">
                <p className="label">{t('filter.column')}</p>
                <Select
                  id="filter-column"
                  value={columnDraft}
                  options={columnOptions}
                  onChange={setColumnDraft}
                />
                <div className="mt-3 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setColumnDraft('all');
                      setColumnApplied('all');
                    }}
                  >
                    {t('filter.reset')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setColumnApplied(columnDraft);
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
                <MenuItem icon={<Plus />} onClick={() => openAdd('saved')}>
                  {t('tracker.add')}
                </MenuItem>
              </Popover>
            </div>
          </div>

          {/* Active filters as removable chips */}
          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-tint px-3 text-[13px] font-medium text-accent"
                >
                  {filter.label}
                  <button
                    type="button"
                    onClick={() => {
                      setColumnApplied('all');
                      setColumnDraft('all');
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="scroll-slim flex gap-5 overflow-x-auto pb-4">
              {TRACKER_COLUMNS.map((column) => (
                <KanbanColumn
                  key={column}
                  id={column}
                  accent={ACCENTS[column]}
                  avatarTone={AVATAR_TONES[column]}
                  cards={columns[column]}
                  hiddenCount={columnApplied === 'all' && !textFilter ? 0 : cards.filter((c) => c.column === column).length - columns[column].length}
                  onAdd={openAdd}
                  onEdit={openEdit}
                />
              ))}
            </div>
            <DragOverlay>
              {activeCard ? (
                <div className="w-72">
                  <KanbanCard card={activeCard} onEdit={() => undefined} avatarTone={AVATAR_TONES[activeCard.column]} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {hiddenByColumn > 0 && (
            <p className="text-[13px] text-ink3">{t('tracker.filteredOut', { n: hiddenByColumn })}</p>
          )}
        </>
      )}

      <CardEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        card={editing}
        defaultColumn={editorColumn}
      />
    </div>
  );
}
