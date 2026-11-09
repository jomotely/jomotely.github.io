import { describe, expect, it } from 'vitest';
import {
  buildSourceQuery,
  experienceClause,
  parseTitles,
  quoteTitle,
  remoteClause,
  salaryClause,
  stripQuotes,
} from '../queryBuilder';
import { ALL_SOURCES } from '../sources';
import { EMPTY_PARAMS, type SearchParams } from '../types';

const lever = ALL_SOURCES.find((s) => s.id === 'lever')!;
const greenhouse = ALL_SOURCES.find((s) => s.id === 'greenhouse')!;

function params(over: Partial<SearchParams> = {}): SearchParams {
  return { ...EMPTY_PARAMS, ...over };
}

describe('parseTitles', () => {
  it('splits, trims and de-duplicates', () => {
    expect(parseTitles(' Frontend dev , Frontend dev ,backend ')).toEqual([
      'Frontend dev',
      'backend',
    ]);
  });

  it('returns an empty list for empty input', () => {
    expect(parseTitles('')).toEqual([]);
    expect(parseTitles(' , , ')).toEqual([]);
  });
});

describe('quoteTitle', () => {
  it('quotes titles containing spaces', () => {
    expect(quoteTitle('frontend developer')).toBe('"frontend developer"');
  });

  it('leaves single words bare', () => {
    expect(quoteTitle('developer')).toBe('developer');
  });

  it('strips straight and curly inner quotes', () => {
    expect(quoteTitle('senior "dev"')).toBe('"senior dev"');
    expect(quoteTitle('senior \u201cdev\u201d')).toBe('"senior dev"');
  });
});

describe('stripQuotes', () => {
  it('removes double quotes of all kinds', () => {
    expect(stripQuotes('"Berlin" \u201cParis\u201d')).toBe('Berlin Paris');
  });
});

describe('remoteClause', () => {
  it('exclude drops remote keywords', () => {
    expect(remoteClause('exclude')).toBe('-remote -"work from home"');
  });
  it('remote-only requires remote keywords', () => {
    expect(remoteClause('remote-only')).toBe('(remote OR "work from home")');
  });
  it('include adds nothing', () => {
    expect(remoteClause('include')).toBe('');
  });
});

describe('salaryClause', () => {
  it('both bounds form a range', () => {
    expect(salaryClause(80000, 120000)).toBe('salary $80000-$120000');
  });
  it('min only uses a plus suffix', () => {
    expect(salaryClause(60000, null)).toBe('salary $60000+');
  });
  it('max only reads as an upper bound', () => {
    expect(salaryClause(null, 90000)).toBe('salary under $90000');
  });
  it('no bounds, no clause', () => {
    expect(salaryClause(null, null)).toBe('');
  });
  it('inverted bounds produce no clause', () => {
    expect(salaryClause(120000, 80000)).toBe('');
  });
  it('fractional values are rounded', () => {
    expect(salaryClause(79999.4, null)).toBe('salary $79999+');
  });
});

describe('experienceClause', () => {
  it('intern expands to internship variants', () => {
    expect(experienceClause('intern')).toBe('(intern OR internship)');
  });
  it('mid adds nothing (mid-level is implied by titles)', () => {
    expect(experienceClause('mid')).toBe('');
  });
  it('junior / senior / lead append the keyword', () => {
    expect(experienceClause('junior')).toBe('junior');
    expect(experienceClause('senior')).toBe('senior');
    expect(experienceClause('lead')).toBe('lead');
  });
  it('null adds nothing', () => {
    expect(experienceClause(null)).toBe('');
  });
});

describe('buildSourceQuery', () => {
  it('bare site: filter when everything is empty', () => {
    expect(buildSourceQuery(params(), lever)).toBe('site:jobs.lever.co');
  });

  it('single word title stays bare', () => {
    expect(buildSourceQuery(params({ titles: ['developer'] }), lever)).toBe(
      'site:jobs.lever.co developer',
    );
  });

  it('multiple titles are quoted and OR-joined', () => {
    expect(buildSourceQuery(params({ titles: ['frontend developer', 'UI engineer'] }), lever)).toBe(
      'site:jobs.lever.co ("frontend developer" OR "UI engineer")',
    );
  });

  it('location is wrapped in quotes', () => {
    expect(buildSourceQuery(params({ titles: ['designer'], location: 'Rabat' }), lever)).toBe(
      'site:jobs.lever.co designer "Rabat"',
    );
  });

  it('multi-domain sources combine into site:(a OR b)', () => {
    expect(buildSourceQuery(params({ titles: ['designer'] }), greenhouse)).toBe(
      'site:(boards.greenhouse.io OR job-boards.greenhouse.io) designer',
    );
  });

  it('emits clauses in canonical order', () => {
    const query = buildSourceQuery(
      params({
        titles: ['product designer'],
        location: 'Berlin',
        remote: 'remote-only',
        salaryMin: 60000,
        salaryMax: 80000,
        experience: 'senior',
        extraKeywords: 'figma',
      }),
      lever,
    );
    expect(query).toBe(
      'site:jobs.lever.co "product designer" "Berlin" (remote OR "work from home") salary $60000-$80000 senior figma',
    );
  });

  it('strips user-typed quotes from location and extra keywords (location stays quoted per template)', () => {
    const query = buildSourceQuery(
      params({ titles: ['dev'], location: '"Berlin"', extraKeywords: 'react "next.js"' }),
      lever,
    );
    expect(query).toBe('site:jobs.lever.co dev "Berlin" react next.js');
  });

  it('handles Arabic titles and locations', () => {
    const query = buildSourceQuery(params({ titles: ['مهندس برمجيات'], location: 'الرباط' }), lever);
    expect(query).toBe('site:jobs.lever.co "مهندس برمجيات" "الرباط"');
  });

  it('handles special characters without breaking the quoting scheme', () => {
    const query = buildSourceQuery(
      params({ titles: ['c++ dev (remote)'], location: "Côte d'Azur" }),
      lever,
    );
    expect(query).toBe('site:jobs.lever.co "c++ dev (remote)" "Côte d\'Azur"');
  });
});
