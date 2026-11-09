import { useMemo, useState } from 'react';
import { Waypoints, X } from 'lucide-react';
import { buildBooleanQuery, EMPTY_BOOLEAN, type BooleanSpec } from '../../core/booleanBuilder';
import { useSearchStore } from '../../state/searchStore';
import { useI18n, type TKey } from '../../i18n';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

interface TermListProps {
  label: string;
  terms: string[];
  onChange: (terms: string[]) => void;
  placeholder: string;
}

function TermList({ label, terms, onChange, placeholder }: TermListProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const clean = draft.trim();
    if (!clean) return;
    onChange([...terms, clean]);
    setDraft('');
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {terms.map((term, index) => (
          <span
            key={`${term}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-accent-tint px-2.5 py-1 text-[13px] font-medium text-accent"
          >
            {term}
            <button
              type="button"
              onClick={() => onChange(terms.filter((_, i) => i !== index))}
              aria-label={`${term} — remove`}
              className="rounded-full p-0.5 hover:bg-accent/15"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <input
        className="input"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
      />
    </div>
  );
}

export function BooleanBuilderModal() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [spec, setSpec] = useState<BooleanSpec>(EMPTY_BOOLEAN);
  const extraKeywords = useSearchStore((s) => s.extraKeywords);
  const update = useSearchStore((s) => s.update);

  const built = useMemo(() => buildBooleanQuery(spec), [spec]);

  const insert = () => {
    if (!built) return;
    const existing = extraKeywords.trim();
    update({ extraKeywords: existing ? `${existing} ${built}` : built });
    setOpen(false);
    setSpec(EMPTY_BOOLEAN);
  };

  return (
    <>
      <Button variant="subtle" onClick={() => setOpen(true)} title={t('search.booleanHelper')}>
        <Waypoints className="h-4 w-4" aria-hidden="true" />
        {t('search.booleanHelper')}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('search.booleanHelper')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={insert} disabled={!built}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <TermList
            label={t('boolean.any') as TKey}
            terms={spec.anyOf}
            placeholder="react, vue"
            onChange={(anyOf) => setSpec({ ...spec, anyOf })}
          />
          <TermList
            label={t('boolean.all') as TKey}
            terms={spec.allOf}
            placeholder="typescript"
            onChange={(allOf) => setSpec({ ...spec, allOf })}
          />
          <TermList
            label={t('boolean.none') as TKey}
            terms={spec.noneOf}
            placeholder="angular"
            onChange={(noneOf) => setSpec({ ...spec, noneOf })}
          />
          <div>
            <span className="label">{t('boolean.built')}</span>
            <pre
              dir="ltr"
              className="scroll-slim whitespace-pre-wrap break-all rounded-field border border-line bg-page p-3 font-mono text-[12.5px] text-ink2"
            >
              {built || '—'}
            </pre>
            <p className="hint">{t('boolean.hint') as string}</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
