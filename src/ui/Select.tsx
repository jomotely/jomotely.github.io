import { ChevronDown } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { cx } from './cx';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

/** Styled native select — keyboard and screen-reader friendly by default. */
export function Select({ id, value, options, onChange, ariaLabel, className }: SelectProps) {
  const handle = (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value);
  return (
    <div className={cx('relative', className)}>
      <select
        id={id}
        value={value}
        onChange={handle}
        aria-label={ariaLabel}
        className="input appearance-none pe-9"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3"
        aria-hidden="true"
      />
    </div>
  );
}
