import { create } from 'zustand';
import { uid } from './uid';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: string) => void;
}

const TOAST_MS = 4000;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, message }] }));
    window.setTimeout(() => get().dismiss(id), TOAST_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience helper so components can fire a toast in one line. */
export const toast = {
  success: (message: string) => useToasts.getState().push('success', message),
  error: (message: string) => useToasts.getState().push('error', message),
  info: (message: string) => useToasts.getState().push('info', message),
  warning: (message: string) => useToasts.getState().push('warning', message),
};
