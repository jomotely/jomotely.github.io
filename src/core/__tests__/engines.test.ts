import { describe, expect, it } from 'vitest';
import { ENGINES, getEngine } from '../engines';
import { ALL_SOURCES } from '../sources';
import { buildSourceQuery } from '../queryBuilder';
import { FRESHNESS_ORDER, type Freshness, type SearchParams } from '../types';

/**
 * The fixed parameter set used for the full engine × source × freshness
 * snapshot matrix — two spaced titles, one location, remote included.
 */
const MATRIX_PARAMS: SearchParams = {
  titles: ['frontend developer', 'UI engineer'],
  location: 'Berlin',
  remote: 'include',
  salaryMin: null,
  salaryMax: null,
  experience: null,
  extraKeywords: '',
};

describe('engine × source × freshness URL matrix', () => {
  for (const engine of ENGINES) {
    for (const source of ALL_SOURCES) {
      for (const freshness of FRESHNESS_ORDER) {
        it(`${engine.id} × ${source.id} × ${freshness}`, () => {
          const query = buildSourceQuery(MATRIX_PARAMS, source);
          const { url, notice } = engine.buildUrl(query, freshness);
          expect(url).toMatchSnapshot();
          expect(notice).toMatchSnapshot();
        });
      }
    }
  }
});

describe('region parameters per engine', () => {
  const query = 'site:jobs.lever.co developer';

  it('google applies gl and hl (lower-cased)', () => {
    const { url } = getEngine('google').buildUrl(query, '30d', { gl: 'US', hl: 'EN' });
    expect(url).toContain('gl=us');
    expect(url).toContain('hl=en');
  });

  it('bing applies cc and mkt', () => {
    const { url } = getEngine('bing').buildUrl(query, '30d', { cc: 'de', mkt: 'de-DE' });
    expect(url).toContain('cc=de');
    expect(url).toContain('mkt=de-DE');
  });

  it('duckduckgo applies kl', () => {
    const { url } = getEngine('duckduckgo').buildUrl(query, '30d', { kl: 'xa-ar' });
    expect(url).toContain('kl=xa-ar');
  });

  it('brave applies country and search_lang', () => {
    const { url } = getEngine('brave').buildUrl(query, '30d', {
      country: 'FR',
      searchLang: 'fr',
    });
    expect(url).toContain('country=fr');
    expect(url).toContain('search_lang=fr');
  });

  it('startpage applies the interface language', () => {
    const { url } = getEngine('startpage').buildUrl(query, '30d', { language: 'french' });
    expect(url).toContain('language=french');
  });

  it('qwant applies the locale', () => {
    const { url } = getEngine('qwant').buildUrl(query, '30d', { locale: 'fr_FR' });
    expect(url).toContain('locale=fr_FR');
  });

  it('yahoo has no region parameters', () => {
    const { url } = getEngine('yahoo').buildUrl(query, '30d', { kl: 'us-en', gl: 'us' });
    const expected = 'https://search.yahoo.com/search?' + new URLSearchParams({ p: query, btf: 'm' }).toString();
    expect(url).toBe(expected);
  });

  it('kagi has no region parameters', () => {
    const { url } = getEngine('kagi').buildUrl(query, '30d', { gl: 'us', hl: 'en' });
    const expected = 'https://kagi.com/search?' + new URLSearchParams({ q: query }).toString();
    expect(url).toBe(expected);
  });
});

describe('freshness notices', () => {
  it('google supports all nine windows exactly', () => {
    for (const freshness of FRESHNESS_ORDER) {
      const { notice } = getEngine('google').buildUrl('q', freshness);
      expect(notice).toEqual({ kind: 'exact' });
    }
  });

  it('bing rounds 1h up to its 24h filter', () => {
    const { notice, url } = getEngine('bing').buildUrl('q', '1h');
    expect(notice).toEqual({ kind: 'rounded', from: '1h', to: '24h' });
    expect(url).toContain(encodeURIComponent('ex1:"ez1"'));
  });

  it('bing rounds 48h to 24h (nearest supported)', () => {
    const { notice } = getEngine('bing').buildUrl('q', '48h');
    expect(notice).toEqual({ kind: 'rounded', from: '48h', to: '24h' });
  });

  it('bing uses ez2 for 7d and ez3 for 30d exactly', () => {
    expect(getEngine('bing').buildUrl('q', '7d').notice).toEqual({ kind: 'exact' });
    expect(getEngine('bing').buildUrl('q', '30d').url).toContain(encodeURIComponent('ex1:"ez3"'));
  });

  it('duckduckgo rounds 48h/72h to day', () => {
    const { url, notice } = getEngine('duckduckgo').buildUrl('q', '72h');
    expect(notice).toEqual({ kind: 'rounded', from: '72h', to: '24h' });
    expect(url).toContain('df=d');
  });

  it('brave rounds 48h to past day (pd)', () => {
    const { notice, url } = getEngine('brave').buildUrl('q', '48h');
    expect(notice).toEqual({ kind: 'rounded', from: '48h', to: '24h' });
    expect(url).toContain('tf=pd');
  });

  it('kagi reports every window as unsupported', () => {
    for (const freshness of FRESHNESS_ORDER) {
      const { notice, url } = getEngine('kagi').buildUrl('q', freshness);
      expect(notice).toEqual({ kind: 'unsupported' });
      expect(url).not.toMatch(/freshness|tbs|df=|tf=|btf|with_date/);
    }
  });

  it('qwant maps day/week/month exactly', () => {
    expect(getEngine('qwant').buildUrl('q', '24h').url).toContain('freshness=day');
    expect(getEngine('qwant').buildUrl('q', '7d').url).toContain('freshness=week');
    expect(getEngine('qwant').buildUrl('q', '30d').url).toContain('freshness=month');
  });

  it('startpage maps with_date exactly for 24h/7d/30d', () => {
    expect(getEngine('startpage').buildUrl('q', '24h').url).toContain('with_date=d');
    expect(getEngine('startpage').buildUrl('q', '7d').url).toContain('with_date=w');
    expect(getEngine('startpage').buildUrl('q', '30d').url).toContain('with_date=m');
  });

  it('yahoo maps btf exactly for 24h/7d/30d', () => {
    expect(getEngine('yahoo').buildUrl('q', '24h').url).toContain('btf=d');
    expect(getEngine('yahoo').buildUrl('q', '7d').url).toContain('btf=w');
    expect(getEngine('yahoo').buildUrl('q', '30d').url).toContain('btf=m');
  });

  it('google maps every documented tbs value', () => {
    const expected: Partial<Record<Freshness, string>> = {
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
    for (const [freshness, tbs] of Object.entries(expected)) {
      const { url, notice } = getEngine('google').buildUrl('q', freshness as Freshness);
      expect(notice).toEqual({ kind: 'exact' });
      expect(new URL(url).searchParams.get('tbs')).toBe(tbs);
    }
  });
});

describe('URL encoding', () => {
  it('round-trips Arabic queries through the q parameter', () => {
    const query = 'site:jobs.lever.co "مهندس برمجيات"';
    const { url } = getEngine('google').buildUrl(query, '30d');
    expect(new URL(url).searchParams.get('q')).toBe(query);
  });

  it('round-trips quotes and special characters', () => {
    const query = 'site:jobs.lever.co (a OR "b&c")';
    const { url } = getEngine('google').buildUrl(query, '30d');
    expect(new URL(url).searchParams.get('q')).toBe(query);
  });
});
