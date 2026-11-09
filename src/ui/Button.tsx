import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'icon';

const VARIANTS: Record<Variant, string> = {
  // Solid pill — the one loud element on any screen.
  primary: 'bg-accent font-medium text-on-accent hover:bg-accent-strong active:bg-accent-strong',
  ghost: 'font-medium text-ink2 hover:bg-ink/[0.05] hover:text-ink',
  // Outlined pill for secondary actions.
  subtle: 'border border-line bg-surface font-medium text-ink hover:bg-page',
  danger: 'bg-danger/10 font-medium text-danger hover:bg-danger/20',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-full px-3.5 text-13',
  md: 'h-9 gap-2 rounded-full px-4 text-sm',
  icon: 'h-9 w-9 justify-center rounded-full',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'subtle',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex select-none items-center transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
