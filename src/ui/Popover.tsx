import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from './cx';

/**
 * Floating white card anchored to a trigger — the one layer allowed a soft
 * shadow. Opens on click (150ms), closes on outside click, Escape, or act.
 *
 * Uncontrolled by default: any click inside the panel dismisses it (menus).
 * Pass `open` + `onOpenChange` to control it (filter panels whose Apply
 * button decides when to close).
 */
export function Popover({
  trigger,
  children,
  align = 'end',
  width = 'w-60',
  label,
  className,
  open: controlledOpen,
  onOpenChange,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={wrapRef} className={cx('relative inline-flex', className)}>
      {isValidElement(trigger)
        ? cloneElement(trigger as ReactElement<TriggerProps>, {
            'aria-haspopup': 'true',
            'aria-expanded': open,
            'aria-controls': open ? panelId : undefined,
            onClick: () => setOpen(!open),
          })
        : trigger}
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className={cx(
            'absolute top-full z-50 mt-1.5 animate-panel-in',
            align === 'end' ? 'end-0' : 'start-0',
          )}
          onClick={(event) => {
            // Menus close on any item click; controlled panels decide themselves.
            if (controlledOpen === undefined) setOpen(false);
            else event.stopPropagation();
          }}
        >
          <div className={cx('surface max-w-[calc(100vw-24px)] p-1.5 shadow-popover', width)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  danger?: boolean;
}

/** A row inside a Popover menu. */
export function MenuItem({ icon, danger, className, children, ...rest }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cx(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm font-medium transition-colors duration-150',
        danger ? 'text-danger hover:bg-danger/10' : 'text-ink hover:bg-ink/[0.05]',
        className,
      )}
      {...rest}
    >
      {icon && <span className="shrink-0 text-ink2 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1.5 border-t border-line" role="separator" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium text-ink3">{children}</div>;
}

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  width?: string;
  label: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  'aria-haspopup'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
};
