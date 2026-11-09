/**
 * Boolean helper — turns a visual builder spec into a compact boolean string
 * that can be appended to the extra-keywords field of a search.
 */

import { stripQuotes } from './queryBuilder';

export interface BooleanSpec {
  /** Terms joined with OR — at least one should match. */
  anyOf: string[];
  /** Terms joined with AND — all must match. */
  allOf: string[];
  /** Terms excluded with a leading minus. */
  noneOf: string[];
}

export const EMPTY_BOOLEAN: BooleanSpec = { anyOf: [], allOf: [], noneOf: [] };

function term(text: string): string {
  const clean = stripQuotes(text).trim();
  if (!clean) return '';
  return /\s/.test(clean) ? `"${clean}"` : clean;
}

/** Build e.g. `(react OR vue) typescript -angular` from a spec. */
export function buildBooleanQuery(spec: BooleanSpec): string {
  const parts: string[] = [];

  const any = spec.anyOf.map(term).filter(Boolean);
  if (any.length > 0) parts.push(`(${any.join(' OR ')})`);

  const all = spec.allOf.map(term).filter(Boolean);
  if (all.length > 0) parts.push(all.join(' AND '));

  const none = spec.noneOf.map(term).filter(Boolean);
  if (none.length > 0) parts.push(none.map((t) => `-${t}`).join(' '));

  return parts.join(' ');
}
