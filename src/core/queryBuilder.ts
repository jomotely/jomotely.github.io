/**
 * Query builder — pure functions, no UI or storage dependencies.
 *
 * Canonical query shape per source:
 *   site:{DOMAIN} ({T1} OR {T2}) "{LOCATION}" {remote} {salary} {level} {extra}
 * Empty segments are omitted entirely.
 */

import type { ExperienceLevel, RemotePref, SearchParams } from './types';
import type { JobSource } from './sources';

/** Split a raw comma-separated input into trimmed, de-duplicated titles. */
export function parseTitles(raw: string): string[] {
  const seen = new Set<string>();
  for (const t of raw.split(',')) {
    const title = t.trim();
    if (title) seen.add(title);
  }
  return [...seen];
}

/** Remove straight and curly double quotes — they would break the quoting scheme. */
export function stripQuotes(text: string): string {
  return text.replace(/["\u201c\u201d]/g, '');
}

/**
 * Titles containing whitespace are wrapped in double quotes so the engine
 * treats them as one phrase. Internal quotes are stripped first.
 */
export function quoteTitle(title: string): string {
  const clean = stripQuotes(title).trim();
  return /\s/.test(clean) ? `"${clean}"` : clean;
}

export function remoteClause(pref: RemotePref): string {
  switch (pref) {
    case 'exclude':
      return '-remote -"work from home"';
    case 'remote-only':
      return '(remote OR "work from home")';
    default:
      return '';
  }
}

/**
 * Engine-neutral salary hint: plain words and numbers (no separators, no
 * engine-specific operators). Only emitted when a bound is actually set;
 * an inverted range (min > max) is treated as no clause at all.
 */
export function salaryClause(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return min <= max ? `salary $${Math.round(min)}-$${Math.round(max)}` : '';
  }
  if (min !== null) return `salary $${Math.round(min)}+`;
  if (max !== null) return `salary under $${Math.round(max)}`;
  return '';
}

export function experienceClause(level: ExperienceLevel | null): string {
  switch (level) {
    case 'intern':
      return '(intern OR internship)';
    case 'junior':
      return 'junior';
    case 'senior':
      return 'senior';
    case 'lead':
      return 'lead';
    default:
      return '';
  }
}

/** One source's full query string for the given parameters. */
export function buildSourceQuery(params: SearchParams, source: JobSource): string {
  const parts: string[] = [];

  const site =
    source.domains.length === 1
      ? `site:${source.domains[0]}`
      : `site:(${source.domains.map((d) => d.trim()).join(' OR ')})`;
  parts.push(site);

  const titles = params.titles.map(quoteTitle).filter(Boolean);
  if (titles.length === 1) {
    parts.push(titles[0]);
  } else if (titles.length > 1) {
    parts.push(`(${titles.join(' OR ')})`);
  }

  const location = stripQuotes(params.location).trim();
  if (location) parts.push(`"${location}"`);

  const remote = remoteClause(params.remote);
  if (remote) parts.push(remote);

  const salary = salaryClause(params.salaryMin, params.salaryMax);
  if (salary) parts.push(salary);

  const level = experienceClause(params.experience);
  if (level) parts.push(level);

  const extra = stripQuotes(params.extraKeywords).trim();
  if (extra) parts.push(extra);

  return parts.join(' ');
}
