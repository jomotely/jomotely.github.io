import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare } from '../share';
import type { EngineId } from '../engines';
import type { SearchParams } from '../types';

const arabicParams: SearchParams = {
  titles: ['مهندس برمجيات', 'frontend dev'],
  location: 'Casablanca',
  remote: 'remote-only',
  salaryMin: 50000,
  salaryMax: null,
  experience: 'junior',
  extraKeywords: 'react',
};

const payload = {
  v: 1 as const,
  params: arabicParams,
  engine: 'google' as EngineId,
  presetId: 'mena',
  freshness: '24h' as const,
};

describe('share codec', () => {
  it('round-trips Arabic and special characters through the hash', () => {
    const hash = encodeShare(payload);
    expect(hash.startsWith('#s=')).toBe(true);
    expect(decodeShare(hash)).toEqual(payload);
  });

  it('uses URL-safe base64 characters only', () => {
    const hash = encodeShare(payload);
    expect(hash.slice(3)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects garbage hashes', () => {
    expect(decodeShare('#s=not-base64!!!')).toBeNull();
    expect(decodeShare('no-hash-here')).toBeNull();
    expect(decodeShare('')).toBeNull();
  });

  it('rejects payloads with an unknown engine', () => {
    const tampered = { ...payload, engine: 'bogus' as unknown as EngineId };
    expect(decodeShare(encodeShare(tampered))).toBeNull();
  });

  it('rejects payloads with an unknown freshness window', () => {
    const tampered = { ...payload, freshness: '5h' as unknown as typeof payload.freshness };
    expect(decodeShare(encodeShare(tampered))).toBeNull();
  });

  it('rejects payloads with a malformed params object', () => {
    const tampered = {
      ...payload,
      params: { ...payload.params, remote: 'sometimes' },
    } as unknown as typeof payload;
    expect(decodeShare(encodeShare(tampered))).toBeNull();
  });

  it('rejects unknown versions', () => {
    const tampered = { ...payload, v: 2 } as unknown as typeof payload;
    expect(decodeShare(encodeShare(tampered))).toBeNull();
  });
});
