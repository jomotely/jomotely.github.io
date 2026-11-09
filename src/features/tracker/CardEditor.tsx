import { useEffect, useState } from 'react';
import { useTrackerStore, TRACKER_COLUMNS, type ColumnId, type TrackerCard } from '../../state/trackerStore';
import { useI18n, type TKey } from '../../i18n';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';

interface CardEditorProps {
  open: boolean;
  onClose: () => void;
  /** Existing card to edit, or null to create a new one. */
  card: TrackerCard | null;
  defaultColumn: ColumnId;
}

const COLUMN_KEYS: Record<ColumnId, TKey> = {
  saved: 'columns.saved',
  applied: 'columns.applied',
  interview: 'columns.interview',
  offer: 'columns.offer',
  rejected: 'columns.rejected',
};

export function columnLabel(t: (key: TKey) => string, column: ColumnId): string {
  return t(COLUMN_KEYS[column]);
}

export function CardEditor({ open, onClose, card, defaultColumn }: CardEditorProps) {
  const { t } = useI18n();
  const addCard = useTrackerStore((s) => s.addCard);
  const updateCard = useTrackerStore((s) => s.updateCard);
  const deleteCard = useTrackerStore((s) => s.deleteCard);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');
  const [column, setColumn] = useState<ColumnId>(defaultColumn);

  useEffect(() => {
    if (!open) return;
    setTitle(card?.title ?? '');
    setCompany(card?.company ?? '');
    setUrl(card?.url ?? '');
    setNotes(card?.notes ?? '');
    setDeadline(card?.deadline ?? '');
    setColumn(card?.column ?? defaultColumn);
  }, [open, card, defaultColumn]);

  const save = () => {
    if (!title.trim()) return;
    if (card) {
      updateCard(card.id, {
        title: title.trim(),
        company: company.trim(),
        url: url.trim(),
        notes: notes.trim(),
        deadline: deadline || null,
        column,
      });
    } else {
      addCard({
        column,
        title: title.trim(),
        company: company.trim(),
        url: url.trim(),
        notes: notes.trim(),
        deadline: deadline || null,
      });
    }
    onClose();
  };

  const remove = () => {
    if (!card) return;
    if (window.confirm(t('tracker.deleteConfirm'))) {
      deleteCard(card.id);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card ? t('tracker.editTitle') : t('tracker.addTitle')}
      footer={
        <>
          {card && (
            <Button variant="danger" onClick={remove} className="me-auto">
              {t('common.delete')}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={save} disabled={!title.trim()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('tracker.cardTitle')} htmlFor="card-title">
          <input
            id="card-title"
            className="input"
            value={title}
            placeholder={t('tracker.cardTitlePlaceholder')}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('tracker.company')} htmlFor="card-company">
            <input
              id="card-company"
              className="input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </Field>
          <Field label={t('tracker.deadline')} htmlFor="card-deadline">
            <input
              id="card-deadline"
              className="input"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('tracker.link')} htmlFor="card-url">
          <input
            id="card-url"
            className="input"
            type="url"
            value={url}
            placeholder="https://…"
            onChange={(e) => setUrl(e.target.value)}
          />
        </Field>
        <Field label={t('tracker.notes')} htmlFor="card-notes">
          <textarea
            id="card-notes"
            className="input min-h-24 resize-y"
            value={notes}
            placeholder={t('tracker.notesPlaceholder')}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <Field label={t('tracker.column')} htmlFor="card-column">
          <Select
            id="card-column"
            value={column}
            options={TRACKER_COLUMNS.map((c) => ({ value: c, label: columnLabel(t, c) }))}
            onChange={(value) => setColumn(value as ColumnId)}
          />
        </Field>
      </div>
    </Modal>
  );
}
