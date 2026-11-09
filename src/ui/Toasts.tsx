import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useToasts, type ToastKind } from '../state/toastStore';
import { useI18n } from '../i18n';
import { cx } from './cx';

const KIND_STYLES: Record<ToastKind, { icon: typeof Info; ring: string }> = {
  success: { icon: CheckCircle2, ring: 'text-emerald-300' },
  error: { icon: XCircle, ring: 'text-red-300' },
  info: { icon: Info, ring: 'text-sky-200' },
  warning: { icon: AlertTriangle, ring: 'text-amber-200' },
};

/** Bottom-center dark pill — one short sentence, same wording as the action. */
export function Toasts() {
  const { toasts, dismiss } = useToasts();
  const { t } = useI18n();
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => {
        const { icon: Icon, ring } = KIND_STYLES[toast.kind];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-md items-center gap-2.5 rounded-full bg-ink py-2.5 pe-2.5 ps-4 text-[rgb(var(--bg))] shadow-popover animate-toast-in"
          >
            <Icon className={cx('h-4 w-4 shrink-0', ring)} aria-hidden="true" />
            <p className="flex-1 truncate text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t('common.dismiss')}
              className="rounded-full p-1.5 text-[rgb(var(--bg))]/60 transition-colors duration-150 hover:text-[rgb(var(--bg))]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
