import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../storage/storage';
import { uid } from './uid';

export const TRACKER_COLUMNS = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
export type ColumnId = (typeof TRACKER_COLUMNS)[number];

export interface TrackerCard {
  id: string;
  column: ColumnId;
  title: string;
  company: string;
  url: string;
  notes: string;
  /** ISO date (yyyy-mm-dd) or null. */
  deadline: string | null;
  createdAt: number;
  updatedAt: number;
}

export type TrackerCardInput = Omit<TrackerCard, 'id' | 'createdAt' | 'updatedAt'>;

interface TrackerState {
  cards: TrackerCard[];
  addCard: (input: TrackerCardInput) => string;
  updateCard: (id: string, patch: Partial<Omit<TrackerCard, 'id' | 'createdAt'>>) => void;
  deleteCard: (id: string) => void;
  /** Move a card to a column, optionally at a specific index within it. */
  moveCard: (id: string, column: ColumnId, index?: number) => void;
  clearAll: () => void;
  importCards: (cards: TrackerCardInput[], mode: 'merge' | 'replace') => number;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set) => ({
      cards: [],

      addCard: (input) => {
        const id = uid();
        const now = Date.now();
        const card: TrackerCard = { ...input, id, createdAt: now, updatedAt: now };
        set((s) => ({ cards: [...s.cards, card] }));
        return id;
      },

      updateCard: (id, patch) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)),
        })),

      deleteCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

      moveCard: (id, column, index) =>
        set((s) => {
          const card = s.cards.find((c) => c.id === id);
          if (!card) return {};
          const moved: TrackerCard = { ...card, column, updatedAt: Date.now() };
          const rest = s.cards.filter((c) => c.id !== id);
          const targetColumn = rest.filter((c) => c.column === column);
          const clamped = Math.max(
            0,
            Math.min(index === undefined ? targetColumn.length : index, targetColumn.length),
          );
          const out: TrackerCard[] = [];
          if (clamped >= targetColumn.length) {
            out.push(...rest, moved);
          } else {
            const anchorId = targetColumn[clamped].id;
            let inserted = false;
            for (const c of rest) {
              if (!inserted && c.id === anchorId) {
                out.push(moved);
                inserted = true;
              }
              out.push(c);
            }
          }
          return { cards: out };
        }),

      clearAll: () => set({ cards: [] }),

      importCards: (cards, mode) => {
        const now = Date.now();
        const imported: TrackerCard[] = cards.map((input) => ({
          ...input,
          id: uid(),
          createdAt: now,
          updatedAt: now,
        }));
        set((s) => ({
          cards: mode === 'replace' ? imported : [...s.cards, ...imported],
        }));
        return imported.length;
      },
    }),
    {
      name: 'siftly.tracker',
      version: 1,
      storage: createJSONStorage(() => appStorage),
    },
  ),
);
