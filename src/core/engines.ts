/**
 * Engine adapters. Each search engine implements one interface:
 *   buildUrl(query, freshness, region?) -> { url, notice }
 *
 * The `notice` tells the UI whether the freshness window was supported
 * exactly, rounded to the nearest supported one, or unsupported entirely.
 */

import type { Freshness } from './types';

export type EngineId =
  | 'google'
  | 'bing'
  | 'duckduckgo'
  | 'brave'
  | 'yahoo'
  | 'startpage'
  | 'kagi'
  | 'qwant';

/** Region/language hints from a preset. Each engine picks the keys it supports. */
export interface RegionParams {
  gl?: string;
  hl?: string; // Google: geolocation country + interface language
  cc?: string;
  mkt?: string; // Bing: country + market
  kl?: string; // DuckDuckGo: region-language code
  country?: string;
  searchLang?: string; // Brave: country + search language
  locale?: string; // Qwant: locale, e.g. en_US
  language?: string; // Startpage: interface language word, e.g. english
}

/** What happened to the requested freshness window on this engine. */
export type FreshnessNotice =
  | { kind: 'exact' }
  | { kind: 'rounded'; from: Freshness; to: Freshness }
  | { kind: 'unsupported' };

export interface EngineUrl {
  url: string;
  notice: FreshnessNotice;
}

export interface EngineAdapter {
  id: EngineId;
  label: string;
  base: string;
  buildUrl(query: string, freshness: Freshness, region?: RegionParams): EngineUrl;
}

/** Approximate length of each freshness window in hours. */
const FRESHNESS_HOURS: Record<Freshness, number> = {
  '1h': 1,
  '4h': 4,
  '8h': 8,
  '12h': 12,
  '24h': 24,
  '48h': 48,
  '72h': 72,
  '7d': 168,
  '30d': 720,
};

/** Nearest supported window by absolute distance in hours. */
function nearestSupported(supported: Freshness[], requested: Freshness): Freshness {
  return supported.reduce((best, candidate) => {
    const dBest = Math.abs(FRESHNESS_HOURS[best] - FRESHNESS_HOURS[requested]);
    const dCandidate = Math.abs(FRESHNESS_HOURS[candidate] - FRESHNESS_HOURS[requested]);
    return dCandidate < dBest ? candidate : best;
  }, supported[0]);
}

/**
 * Resolve a freshness map (requested window -> URL param value).
 * Exact hit -> exact notice; miss -> nearest supported with a rounded notice;
 * empty map -> unsupported notice with no parameter at all.
 */
function resolveFreshness(
  map: Partial<Record<Freshness, string>>,
  requested: Freshness,
): { value: string | null; notice: FreshnessNotice } {
  const exact = map[requested];
  if (exact) return { value: exact, notice: { kind: 'exact' } };
  const supported = Object.keys(map) as Freshness[];
  if (supported.length === 0) return { value: null, notice: { kind: 'unsupported' } };
  const to = nearestSupported(supported, requested);
  return { value: map[to] ?? null, notice: { kind: 'rounded', from: requested, to } };
}

function engine(
  id: EngineId,
  label: string,
  base: string,
  build: (query: string, freshness: Freshness, region: RegionParams | undefined) => EngineUrl,
): EngineAdapter {
  return { id, label, base, buildUrl: build };
}

// ---- Google ----------------------------------------------------------------
// Freshness: tbs=qdr:* — verify in browser before release (h4/h8/h12/d2/d3 are
// undocumented but work today; re-check if Google changes them).
const GOOGLE_FRESHNESS: Record<Freshness, string> = {
  '1h': 'qdr:h',
  '4h': 'qdr:h4',
  '8h': 'qdr:h8',
  '12h': 'qdr:h12',
  '24h': 'qdr:d',
  '48h': 'qdr:d2',
  '72h': 'qdr:d3',
  '7d': 'qdr:w',
  '30d': 'qdr:m',
};

const google = engine(
  'google',
  'Google',
  'https://www.google.com/search',
  (query, freshness, region) => {
    const sp = new URLSearchParams({ q: query, tbs: GOOGLE_FRESHNESS[freshness] });
    // Region: gl = country bias, hl = interface language. Verify before release.
    if (region?.gl) sp.set('gl', region.gl.toLowerCase());
    if (region?.hl) sp.set('hl', region.hl.toLowerCase());
    return { url: `https://www.google.com/search?${sp.toString()}`, notice: { kind: 'exact' } };
  },
);

// ---- Bing ------------------------------------------------------------------
// Freshness: filters=ex1:"ez1" (24h), "ez2" (week), "ez3" (month) — verify in
// browser before release; Bing documents ez* only loosely.
const BING_FRESHNESS: Partial<Record<Freshness, string>> = {
  '24h': 'ez1',
  '7d': 'ez2',
  '30d': 'ez3',
};

const bing = engine('bing', 'Bing', 'https://www.bing.com/search', (query, freshness, region) => {
  const sp = new URLSearchParams({ q: query });
  const { value, notice } = resolveFreshness(BING_FRESHNESS, freshness);
  if (value) sp.set('filters', `ex1:"${value}"`);
  // Region: cc = country, mkt = market. Verify before release.
  if (region?.cc) sp.set('cc', region.cc.toLowerCase());
  if (region?.mkt) sp.set('mkt', region.mkt);
  return { url: `https://www.bing.com/search?${sp.toString()}`, notice };
});

// ---- DuckDuckGo ------------------------------------------------------------
// Freshness: df=d / w / m — verify in browser before release.
const DUCKDUCKGO_FRESHNESS: Partial<Record<Freshness, string>> = {
  '24h': 'd',
  '7d': 'w',
  '30d': 'm',
};

const duckduckgo = engine(
  'duckduckgo',
  'DuckDuckGo',
  'https://duckduckgo.com/',
  (query, freshness, region) => {
    const sp = new URLSearchParams({ q: query });
    const { value, notice } = resolveFreshness(DUCKDUCKGO_FRESHNESS, freshness);
    if (value) sp.set('df', value);
    // Region: kl = region-language code. Verify before release.
    if (region?.kl) sp.set('kl', region.kl);
    return { url: `https://duckduckgo.com/?${sp.toString()}`, notice };
  },
);

// ---- Brave -----------------------------------------------------------------
// Freshness: tf=pd / pw / pm (past day / week / month) — verify in browser.
const BRAVE_FRESHNESS: Partial<Record<Freshness, string>> = {
  '24h': 'pd',
  '7d': 'pw',
  '30d': 'pm',
};

const brave = engine(
  'brave',
  'Brave',
  'https://search.brave.com/search',
  (query, freshness, region) => {
    const sp = new URLSearchParams({ q: query });
    const { value, notice } = resolveFreshness(BRAVE_FRESHNESS, freshness);
    if (value) sp.set('tf', value);
    // Region: country + search_lang. Verify before release.
    if (region?.country) sp.set('country', region.country.toLowerCase());
    if (region?.searchLang) sp.set('search_lang', region.searchLang.toLowerCase());
    return { url: `https://search.brave.com/search?${sp.toString()}`, notice };
  },
);

// ---- Yahoo -----------------------------------------------------------------
// Freshness: btf=d / w / m — verify in browser before release.
const YAHOO_FRESHNESS: Partial<Record<Freshness, string>> = {
  '24h': 'd',
  '7d': 'w',
  '30d': 'm',
};

const yahoo = engine('yahoo', 'Yahoo', 'https://search.yahoo.com/search', (query, freshness) => {
  const sp = new URLSearchParams({ p: query });
  const { value, notice } = resolveFreshness(YAHOO_FRESHNESS, freshness);
  if (value) sp.set('btf', value);
  // No stable region parameters for Yahoo web search — omitted intentionally.
  return { url: `https://search.yahoo.com/search?${sp.toString()}`, notice };
});

// ---- Startpage -------------------------------------------------------------
// Freshness: with_date=d / w / m — verify in browser before release.
const STARTPAGE_FRESHNESS: Partial<Record<Freshness, string>> = {
  '24h': 'd',
  '7d': 'w',
  '30d': 'm',
};

const startpage = engine(
  'startpage',
  'Startpage',
  'https://www.startpage.com/sp/search',
  (query, freshness, region) => {
    const sp = new URLSearchParams({ query });
    const { value, notice } = resolveFreshness(STARTPAGE_FRESHNESS, freshness);
    if (value) sp.set('with_date', value);
    // Region: interface language word only. Verify before release.
    if (region?.language) sp.set('language', region.language.toLowerCase());
    return { url: `https://www.startpage.com/sp/search?${sp.toString()}`, notice };
  },
);

// ---- Kagi ------------------------------------------------------------------
// Kagi exposes no documented URL freshness parameter, so every window is
// reported as unsupported and the filter is omitted. Verify before release.
const kagi = engine('kagi', 'Kagi', 'https://kagi.com/search', (query) => {
  const sp = new URLSearchParams({ q: query });
  // No documented region parameters either.
  return { url: `https://kagi.com/search?${sp.toString()}`, notice: { kind: 'unsupported' } };
});

// ---- Qwant -----------------------------------------------------------------
// Freshness: freshness=day / week / month — verify in browser before release.
const QWANT_FRESHNESS: Partial<Record<Freshness, string>> = {
  '24h': 'day',
  '7d': 'week',
  '30d': 'month',
};

const qwant = engine('qwant', 'Qwant', 'https://www.qwant.com/', (query, freshness, region) => {
  const sp = new URLSearchParams({ q: query, t: 'web' });
  const { value, notice } = resolveFreshness(QWANT_FRESHNESS, freshness);
  if (value) sp.set('freshness', value);
  // Region: locale like en_US. Verify before release.
  if (region?.locale) sp.set('locale', region.locale);
  return { url: `https://www.qwant.com/?${sp.toString()}`, notice };
});

export const ENGINES: EngineAdapter[] = [
  google,
  bing,
  duckduckgo,
  brave,
  yahoo,
  startpage,
  kagi,
  qwant,
];

export function getEngine(id: EngineId): EngineAdapter {
  const found = ENGINES.find((e) => e.id === id);
  return found ?? google;
}

export const DEFAULT_ENGINE: EngineId = 'google';
