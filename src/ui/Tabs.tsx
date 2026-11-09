import { cx } from './cx';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}

/**
 * Under-header tabs: active tab is bold with a short accent underline that
 * matches the text width, over a thin full-width divider. Counts sit in
 * lighter gray next to each label.
 */
export function Tabs({ items, active, onChange, ariaLabel }: TabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex items-center gap-6 border-b border-line">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cx(
              'relative -mb-px inline-flex items-baseline gap-1.5 border-b-2 pb-2.5 pt-1 text-sm transition-colors duration-150',
              isActive
                ? 'border-accent font-semibold text-ink'
                : 'border-transparent font-medium text-ink2 hover:text-ink',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cx('text-13 font-normal', isActive ? 'text-ink3' : 'text-ink3')}>
                ({item.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
