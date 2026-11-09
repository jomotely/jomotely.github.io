import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../storage/storage';
import { ALL_SOURCES, DEFAULT_DISABLED_SOURCES, type JobSource, type SourceCategory } from '../core/sources';
import { getPreset, REGION_PRESETS } from '../core/presets';
import {
  DEFAULT_ENGINE,
  getEngine,
  type EngineId,
  type FreshnessNotice,
  type RegionParams,
} from '../core/engines';
import { buildSourceQuery, parseTitles } from '../core/queryBuilder';
import type { ExperienceLevel, Freshness, RemotePref, SearchParams } from '../core/types';
import type { SharePayload } from '../core/share';
import { uid } from './uid';

export interface SearchResult {
  sourceId: string;
  label: string;
  domains: string[];
  category: SourceCategory;
  query: string;
  url: string;
  notice: FreshnessNotice;
  engineLabel: string;
}

export interface HistoryEntry {
  id: string;
  at: number;
  params: SearchParams;
  engine: EngineId;
  presetId: string;
  freshness: Freshness;
}

export interface SavedSearch extends HistoryEntry {
  name: string;
}

/** Raw form fields as they live in the UI. */
export interface SearchFormFields {
  titlesRaw: string;
  location: string;
  remote: RemotePref;
  salaryMin: string;
  salaryMax: string;
  freshness: Freshness;
  experience: ExperienceLevel | null;
  extraKeywords: string;
  engine: EngineId;
  presetId: string;
}

interface SearchState extends SearchFormFields {
  sourceOrder: string[];
  sourceDisabled: Record<string, boolean>;
  customSources: JobSource[];
  results: SearchResult[] | null;
  history: HistoryEntry[];
  saved: SavedSearch[];
  /** Result rows the user has already opened this run — drives the plain "Opened" status text. Not persisted. */
  openedIds: string[];

  markOpened: (sourceId: string) => void;
  update: (partial: Partial<SearchFormFields>) => void;
  setPreset: (presetId: string) => void;
  resetForm: () => void;

  toggleSource: (id: string) => void;
  moveSource: (id: string, direction: -1 | 1) => void;
  addCustomSource: (label: string, domain: string) => void;
  removeCustomSource: (id: string) => void;

  resolveSources: () => JobSource[];
  currentParams: () => SearchParams;
  runSearch: () => void;
  clearResults: () => void;

  applySearchEntry: (entry: Omit<HistoryEntry, 'id' | 'at'>) => void;
  runHistory: (id: string) => void;

  saveCurrentSearch: (name: string) => void;
  renameSaved: (id: string, name: string) => void;
  duplicateSaved: (id: string) => void;
  deleteSaved: (id: string) => void;
  runSaved: (id: string) => void;

  applySharePayload: (payload: SharePayload) => void;
}

const DEFAULT_FORM: SearchFormFields = {
  titlesRaw: '',
  location: '',
  remote: 'include',
  salaryMin: '',
  salaryMax: '',
  freshness: '7d',
  experience: null,
  extraKeywords: '',
  engine: DEFAULT_ENGINE,
  presetId: 'global',
};

const DEFAULT_ORDER = ALL_SOURCES.map((s) => s.id);
const DEFAULT_DISABLED = Object.fromEntries(DEFAULT_DISABLED_SOURCES.map((id) => [id, true]));

function parseSalary(raw: string): number | null {
  const trimmed = raw.trim().replace(/[,\s_]/g, '');
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** All sources ever known: builtin + preset extras + user-added custom ones. */
export function allKnownSources(custom: JobSource[]): JobSource[] {
  const presetExtras = REGION_PRESETS.flatMap((p) => p.extraSources ?? []);
  return [...ALL_SOURCES, ...presetExtras, ...custom];
}

function toHistoryEntry(
  params: SearchParams,
  engine: EngineId,
  presetId: string,
  freshness: Freshness,
): HistoryEntry {
  return { id: uid(), at: Date.now(), params, engine, presetId, freshness };
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_FORM,
      sourceOrder: DEFAULT_ORDER,
      sourceDisabled: DEFAULT_DISABLED,
      customSources: [],
      results: null,
      history: [],
      saved: [],
      openedIds: [],

      markOpened: (sourceId) =>
        set((s) => (s.openedIds.includes(sourceId) ? s : { openedIds: [...s.openedIds, sourceId] })),

      update: (partial) => set(partial),

      setPreset: (presetId) => {
        const preset = getPreset(presetId);
        const { sourceOrder, sourceDisabled } = get();
        const additions = (preset.extraSources ?? [])
          .map((s) => s.id)
          .filter((id) => !sourceOrder.includes(id));
        set({
          presetId,
          sourceOrder: additions.length > 0 ? [...sourceOrder, ...additions] : sourceOrder,
          // New region boards start enabled.
          sourceDisabled: additions.reduce<Record<string, boolean>>(
            (acc, id) => {
              delete acc[id];
              return acc;
            },
            { ...sourceDisabled },
          ),
        });
      },

      resetForm: () => set({ ...DEFAULT_FORM, results: null, openedIds: [] }),

      toggleSource: (id) =>
        set((s) => {
          const next = { ...s.sourceDisabled };
          if (next[id]) delete next[id];
          else next[id] = true;
          return { sourceDisabled: next };
        }),

      moveSource: (id, direction) =>
        set((s) => {
          const order = [...s.sourceOrder];
          const index = order.indexOf(id);
          const target = index + direction;
          if (index === -1 || target < 0 || target >= order.length) return {};
          [order[index], order[target]] = [order[target], order[index]];
          return { sourceOrder: order };
        }),

      addCustomSource: (label, domain) => {
        const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!cleanDomain) return;
        const source: JobSource = {
          id: `custom-${uid().slice(0, 8)}`,
          label: label.trim() || cleanDomain,
          domains: [cleanDomain],
          category: 'jobboard',
        };
        set((s) => ({
          customSources: [...s.customSources, source],
          sourceOrder: [...s.sourceOrder, source.id],
        }));
      },

      removeCustomSource: (id) =>
        set((s) => ({
          customSources: s.customSources.filter((c) => c.id !== id),
          sourceOrder: s.sourceOrder.filter((sid) => sid !== id),
        })),

      resolveSources: () => {
        const { sourceOrder, sourceDisabled, customSources } = get();
        const pool = allKnownSources(customSources);
        return sourceOrder
          .map((id) => pool.find((s) => s.id === id))
          .filter((s): s is JobSource => Boolean(s) && !sourceDisabled[s?.id ?? '']);
      },

      currentParams: () => {
        const s = get();
        return {
          titles: parseTitles(s.titlesRaw),
          location: s.location,
          remote: s.remote,
          salaryMin: parseSalary(s.salaryMin),
          salaryMax: parseSalary(s.salaryMax),
          experience: s.experience,
          extraKeywords: s.extraKeywords,
        };
      },

      runSearch: () => {
        const s = get();
        const params = s.currentParams();
        const region: RegionParams = getPreset(s.presetId).region;
        const engine = getEngine(s.engine);
        const results = s.resolveSources().map((source) => {
          const query = buildSourceQuery(params, source);
          const { url, notice } = engine.buildUrl(query, s.freshness, region);
          return {
            sourceId: source.id,
            label: source.label,
            domains: source.domains,
            category: source.category,
            query,
            url,
            notice,
            engineLabel: engine.label,
          } satisfies SearchResult;
        });
        const entry = toHistoryEntry(params, s.engine, s.presetId, s.freshness);
        set((state) => ({
          results,
          history: [entry, ...state.history].slice(0, 20),
          openedIds: [],
        }));
      },

      clearResults: () => set({ results: null }),

      applySearchEntry: (entry) => {
        set({
          titlesRaw: entry.params.titles.join(', '),
          location: entry.params.location,
          remote: entry.params.remote,
          salaryMin: entry.params.salaryMin === null ? '' : String(entry.params.salaryMin),
          salaryMax: entry.params.salaryMax === null ? '' : String(entry.params.salaryMax),
          freshness: entry.freshness,
          experience: entry.params.experience,
          extraKeywords: entry.params.extraKeywords,
          engine: entry.engine,
          presetId: entry.presetId,
        });
        get().runSearch();
      },

      runHistory: (id) => {
        const entry = get().history.find((h) => h.id === id);
        if (!entry) return;
        get().applySearchEntry({
          params: entry.params,
          engine: entry.engine,
          presetId: entry.presetId,
          freshness: entry.freshness,
        });
      },

      saveCurrentSearch: (name) => {
        const s = get();
        const entry = toHistoryEntry(s.currentParams(), s.engine, s.presetId, s.freshness);
        const savedItem: SavedSearch = { ...entry, name: name.trim() || 'Untitled search' };
        set((state) => ({ saved: [savedItem, ...state.saved] }));
      },

      renameSaved: (id, name) =>
        set((s) => ({
          saved: s.saved.map((item) =>
            item.id === id ? { ...item, name: name.trim() || item.name } : item,
          ),
        })),

      duplicateSaved: (id) =>
        set((s) => {
          const original = s.saved.find((item) => item.id === id);
          if (!original) return {};
          const copy: SavedSearch = {
            ...original,
            id: uid(),
            name: `${original.name} (2)`,
          };
          const index = s.saved.findIndex((item) => item.id === id);
          const next = [...s.saved];
          next.splice(index + 1, 0, copy);
          return { saved: next };
        }),

      deleteSaved: (id) => set((s) => ({ saved: s.saved.filter((item) => item.id !== id) })),

      runSaved: (id) => {
        const item = get().saved.find((entry) => entry.id === id);
        if (!item) return;
        get().applySearchEntry({
          params: item.params,
          engine: item.engine,
          presetId: item.presetId,
          freshness: item.freshness,
        });
      },

      applySharePayload: (payload) => {
        set({
          titlesRaw: payload.params.titles.join(', '),
          location: payload.params.location,
          remote: payload.params.remote,
          salaryMin: payload.params.salaryMin === null ? '' : String(payload.params.salaryMin),
          salaryMax: payload.params.salaryMax === null ? '' : String(payload.params.salaryMax),
          freshness: payload.freshness,
          experience: payload.params.experience,
          extraKeywords: payload.params.extraKeywords,
          engine: payload.engine,
          presetId: payload.presetId,
          results: null,
        });
        get().runSearch();
      },
    }),
    {
      name: 'siftly.search',
      version: 1,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        titlesRaw: state.titlesRaw,
        location: state.location,
        remote: state.remote,
        salaryMin: state.salaryMin,
        salaryMax: state.salaryMax,
        freshness: state.freshness,
        experience: state.experience,
        extraKeywords: state.extraKeywords,
        engine: state.engine,
        presetId: state.presetId,
        sourceOrder: state.sourceOrder,
        sourceDisabled: state.sourceDisabled,
        customSources: state.customSources,
        history: state.history,
        saved: state.saved,
      }),
    },
  ),
);
