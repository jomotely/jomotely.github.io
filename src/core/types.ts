/** Shared domain types for Siftly's query core. Pure data — no UI, no IO. */

/** How remote work should appear in the query. */
export type RemotePref = 'include' | 'exclude' | 'remote-only';

/** Experience level hint folded into the query as keywords. */
export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead';

/** How fresh results should be. Engines map these to their own URL parameters. */
export type Freshness = '1h' | '4h' | '8h' | '12h' | '24h' | '48h' | '72h' | '7d' | '30d';

export const FRESHNESS_ORDER: Freshness[] = [
  '1h',
  '4h',
  '8h',
  '12h',
  '24h',
  '48h',
  '72h',
  '7d',
  '30d',
];

/** The complete set of inputs that define one search. */
export interface SearchParams {
  /** Job titles, already split and de-duplicated (see parseTitles). */
  titles: string[];
  location: string;
  remote: RemotePref;
  salaryMin: number | null;
  salaryMax: number | null;
  experience: ExperienceLevel | null;
  extraKeywords: string;
}

export const EMPTY_PARAMS: SearchParams = {
  titles: [],
  location: '',
  remote: 'include',
  salaryMin: null,
  salaryMax: null,
  experience: null,
  extraKeywords: '',
};
