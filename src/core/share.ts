/**
 * Shareable search links. Settings are encoded into the URL hash so nothing
 * ever touches a server: `#s=<base64url(json)>`. Unicode-safe (Arabic titles
 * survive the round trip).
 */

import { ENGINES, type EngineId } from './engines';
import { FRESHNESS_ORDER, type Freshness, type RemotePref, type SearchParams } from './types';

export interface SharePayload {
  v: 1;
  params: SearchParams;
  engine: EngineId;
  presetId: string;
  freshness: Freshness;
}

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encode a payload into a hash fragment (including the leading `#`). */
export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return `#s=${bytesToBase64Url(ENCODER.encode(json))}`;
}

/** Full absolute URL with the encoded hash, e.g. for a "copy share link" button. */
export function buildShareUrl(payload: SharePayload): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${encodeShare(payload)}`;
}

function isRemotePref(value: unknown): value is RemotePref {
  return value === 'include' || value === 'exclude' || value === 'remote-only';
}

function isFreshness(value: unknown): value is Freshness {
  return FRESHNESS_ORDER.includes(value as Freshness);
}

function isEngineId(value: unknown): value is EngineId {
  return ENGINES.some((e) => e.id === value);
}

function isSearchParams(value: unknown): value is SearchParams {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    Array.isArray(p['titles']) &&
    p['titles'].every((t) => typeof t === 'string') &&
    typeof p['location'] === 'string' &&
    isRemotePref(p['remote']) &&
    (typeof p['salaryMin'] === 'number' || p['salaryMin'] === null) &&
    (typeof p['salaryMax'] === 'number' || p['salaryMax'] === null) &&
    (p['experience'] === null ||
      p['experience'] === 'intern' ||
      p['experience'] === 'junior' ||
      p['experience'] === 'mid' ||
      p['experience'] === 'senior' ||
      p['experience'] === 'lead') &&
    typeof p['extraKeywords'] === 'string'
  );
}

/** Parse and validate a hash fragment. Returns null for anything invalid. */
export function decodeShare(hash: string): SharePayload | null {
  if (!hash.startsWith('#s=')) return null;
  try {
    const json = DECODER.decode(base64UrlToBytes(hash.slice(3)));
    const raw = JSON.parse(json) as Record<string, unknown>;
    if (raw['v'] !== 1) return null;
    if (!isSearchParams(raw['params'])) return null;
    if (!isEngineId(raw['engine'])) return null;
    if (!isFreshness(raw['freshness'])) return null;
    if (typeof raw['presetId'] !== 'string') return null;
    return {
      v: 1,
      params: raw['params'],
      engine: raw['engine'],
      presetId: raw['presetId'],
      freshness: raw['freshness'],
    };
  } catch {
    return null;
  }
}
