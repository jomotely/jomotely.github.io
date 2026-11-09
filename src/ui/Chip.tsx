import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Pill filter chip. Active: pale accent tint, accent text. */
export function Chip({ active = false, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        'inline-flex h-8 select-none items-center gap-1.5 rounded-full border px-3 text-13 font-medium transition-colors duration-150',
        active
          ? 'border-accent/30 bg-accent-tint text-accent'
          : 'border-line bg-surface text-ink2 hover:bg-ink/[0.04] hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
