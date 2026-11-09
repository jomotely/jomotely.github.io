import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Quiet guidance: one outline icon, one sentence, one primary button.
 * No illustrations, no jokes.
 */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="surface px-5 py-10">
      <Icon className="h-5 w-5 text-ink3" aria-hidden="true" />
      <h3 className="mt-3 text-[15px] font-medium">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink2">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}
