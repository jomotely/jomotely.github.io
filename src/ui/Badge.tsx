import type { SourceCategory } from '../core/sources';
import { cx } from './cx';

/** Desaturated per-category tints for small tags and avatar circles. */
const STYLES: Record<SourceCategory, string> = {
  ats: 'bg-accent-tint text-accent',
  jobboard: 'bg-warn/10 text-warn',
  general: 'bg-ink/[0.06] text-ink2',
};

export function Badge({
  children,
  tone,
  className,
}: {
  children: string;
  tone: SourceCategory;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pastel-tinted circle holding a source's or company's initials. */
export function AvatarCircle({
  initials,
  tone,
  className,
}: {
  initials: string;
  tone: SourceCategory;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-[11px] font-semibold',
        STYLES[tone],
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** First letters of the first two words, e.g. "Greenhouse" → "G", "Breezy HR" → "BH". */
export function initialsOf(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
