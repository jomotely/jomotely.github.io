interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * The Siftly mark: a teal tile with three descending bars and a falling
 * dot — a sieve, sifting job boards into a single stream.
 */
export function LogoMark({ size = 28, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="4" width="56" height="56" rx="16" className="fill-accent" />
      <rect x="16" y="17" width="32" height="7" rx="3.5" className="fill-on-accent" />
      <rect x="20" y="29" width="24" height="7" rx="3.5" className="fill-on-accent opacity-90" />
      <rect x="24" y="41" width="16" height="7" rx="3.5" className="fill-on-accent opacity-80" />
      <circle cx="32" cy="52.5" r="3.5" className="fill-on-accent opacity-70" />
    </svg>
  );
}

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={30} />
      <div className="leading-tight">
        <div className="text-[17px] font-semibold tracking-tight">Siftly</div>
        {subtitle && <div className="text-[11px] text-ink3">{subtitle}</div>}
      </div>
    </div>
  );
}
