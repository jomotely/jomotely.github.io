import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { ColumnId, TrackerCard } from '../../state/trackerStore';
import { columnLabel } from './CardEditor';
import { KanbanCard } from './KanbanCard';
import { Button } from '../../ui/Button';
import { useI18n } from '../../i18n';
import { cx } from '../../ui/cx';

interface KanbanColumnProps {
  id: ColumnId;
  /** Desaturated accent classes: dot + avatar tint, from the status palette. */
  accent: string;
  avatarTone: string;
  cards: TrackerCard[];
  hiddenCount: number;
  onAdd: (column: ColumnId) => void;
  onEdit: (card: TrackerCard) => void;
}

/**
 * A Kanban column sits directly on the page background — no card chrome.
 * White cards carry the jobs; the column is just a labeled drop zone.
 */
export function KanbanColumn({ id, accent, avatarTone, cards, hiddenCount, onAdd, onEdit }: KanbanColumnProps) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column' } });
  const label = columnLabel(t, id);

  return (
    <section
      className={cx(
        'flex w-[280px] shrink-0 flex-col transition-colors duration-150 md:w-auto md:flex-1',
        isOver && 'rounded-card bg-accent-tint/50',
      )}
      aria-label={label}
    >
      <header className="mb-2.5 flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <span className={cx('h-2 w-2 rounded-full', accent)} aria-hidden="true" />
          {label}
          <span className="text-[13px] font-normal text-ink3">
            ({t('tracker.cardCount', { n: cards.length })})
          </span>
        </h2>
        <Button variant="ghost" size="icon" onClick={() => onAdd(id)} aria-label={`${t('tracker.add')} — ${label}`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div
        ref={setNodeRef}
        className={cx(
          'flex min-h-28 flex-1 flex-col gap-2.5 rounded-card p-0.5 transition-colors duration-150',
          cards.length === 0 && !isOver && 'border border-dashed border-line',
        )}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onEdit={onEdit} avatarTone={avatarTone} />
          ))}
        </SortableContext>
        {hiddenCount > 0 && cards.length === 0 && (
          <p className="px-2 py-3 text-[13px] text-ink3">{t('tracker.filteredOut', { n: hiddenCount })}</p>
        )}
      </div>
    </section>
  );
}
