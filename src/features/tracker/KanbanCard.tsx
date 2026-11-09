import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { TrackerCard } from '../../state/trackerStore';
import { useTrackerStore } from '../../state/trackerStore';
import { useI18n } from '../../i18n';
import { usePrefs } from '../../state/prefs';
import { toast } from '../../state/toastStore';
import { cx } from '../../ui/cx';
import { initialsOf } from '../../ui/Badge';

interface KanbanCardProps {
  card: TrackerCard;
  onEdit: (card: TrackerCard) => void;
  /** Desaturated tint class for the initials avatar — set by the column. */
  avatarTone: string;
}

export function KanbanCard({ card, onEdit, avatarTone }: KanbanCardProps) {
  const { t } = useI18n();
  const lang = usePrefs((s) => s.lang);
  const deleteCard = useTrackerStore((s) => s.deleteCard);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const remove = (event: MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(t('tracker.deleteConfirm'))) {
      deleteCard(card.id);
      toast.info(t('common.delete'));
    }
  };

  const deadlineInfo = (() => {
    if (!card.deadline) return null;
    const date = new Date(`${card.deadline}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    const tone =
      diffDays < 0
        ? 'text-danger'
        : diffDays <= 7
          ? 'text-warn'
          : 'text-ink3';
    const label = diffDays < 0 ? t('tracker.overdue') : diffDays <= 7 ? t('tracker.dueSoon') : '';
    const formatted = new Intl.DateTimeFormat(localeOf(lang), {
      day: 'numeric',
      month: 'short',
    }).format(date);
    return { tone, label, formatted };
  })();

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cx(
        'surface touch-none select-none p-3.5',
        isDragging ? 'opacity-40' : 'cursor-grab active:cursor-grabbing',
      )}
      aria-label={card.title}
    >
      <div className="flex items-start gap-3">
        {/* Pastel initials avatar — company, falling back to the title */}
        <span
          aria-hidden="true"
          className={cx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
            avatarTone,
          )}
        >
          {initialsOf(card.company || card.title)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium">{card.title}</h3>
              {card.company && (
                <p className="truncate text-[13px] text-ink2">{card.company}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {card.url && (
                <a
                  href={card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="rounded-md p-1.5 text-ink3 transition-colors duration-150 hover:text-accent"
                  aria-label={t('tracker.link')}
                  title={t('tracker.link')}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-ink3 transition-colors duration-150 hover:text-accent"
                aria-label={t('common.edit')}
                title={t('common.edit')}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={remove}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-ink3 transition-colors duration-150 hover:text-danger"
                aria-label={t('common.delete')}
                title={t('common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Muted next-step note */}
          {card.notes && (
            <p className="mt-1.5 line-clamp-1 text-[13px] text-ink3">{card.notes}</p>
          )}

          {deadlineInfo && (
            <p className="mt-2 flex items-center gap-1.5 text-xs">
              <CalendarClock className="h-3.5 w-3.5 text-ink3" aria-hidden="true" />
              <span className={cx('font-medium', deadlineInfo.tone)}>{deadlineInfo.formatted}</span>
              {deadlineInfo.label && (
                <span className="text-ink3">· {deadlineInfo.label}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function localeOf(lang: string): string {
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'ar') return 'ar-MA';
  return 'en-US';
}
