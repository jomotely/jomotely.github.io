import { describe, expect, it } from 'vitest';
import { getPreset, REGION_PRESETS } from '../presets';

describe('region presets', () => {
  it('has unique ids', () => {
    const ids = REGION_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the spec regions', () => {
    const ids = REGION_PRESETS.map((p) => p.id);
    for (const id of ['global', 'us', 'nordics', 'mena']) {
      expect(ids).toContain(id);
    }
  });

  it('falls back to global for unknown ids', () => {
    expect(getPreset('does-not-exist').id).toBe('global');
  });

  it('extra sources have plausible domains', () => {
    for (const preset of REGION_PRESETS) {
      for (const source of preset.extraSources ?? []) {
        expect(source.domains.length, preset.id).toBeGreaterThan(0);
        for (const domain of source.domains) {
          expect(domain, source.id).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
        }
      }
    }
  });
});
