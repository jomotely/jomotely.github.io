import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fr } from '../../i18n/fr';
import { ar } from '../../i18n/ar';
import { LANGUAGES } from '../../i18n';

describe('dictionaries', () => {
  it('fr mirrors every en key exactly', () => {
    const enKeys = Object.keys(en).sort();
    expect(Object.keys(fr).sort()).toEqual(enKeys);
  });

  it('ar mirrors every en key exactly', () => {
    const enKeys = Object.keys(en).sort();
    expect(Object.keys(ar).sort()).toEqual(enKeys);
  });

  it('no translation is empty', () => {
    for (const dict of [en, fr, ar]) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim().length, `empty value for ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('every {var} used in fr/ar also exists in the en template', () => {
    const varPattern = /\{(\w+)\}/g;
    for (const [key, value] of Object.entries(fr)) {
      const vars = [...value.matchAll(varPattern)].map((m) => m[1]).sort();
      const enVars = [...(en[key as keyof typeof en] ?? '').matchAll(varPattern)]
        .map((m) => m[1])
        .sort();
      expect(vars, `fr vars mismatch for ${key}`).toEqual(enVars);
    }
    for (const [key, value] of Object.entries(ar)) {
      const vars = [...value.matchAll(varPattern)].map((m) => m[1]).sort();
      const enVars = [...(en[key as keyof typeof en] ?? '').matchAll(varPattern)]
        .map((m) => m[1])
        .sort();
      expect(vars, `ar vars mismatch for ${key}`).toEqual(enVars);
    }
  });
});

describe('languages', () => {
  it('declares English, French and Arabic with Arabic RTL', () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(['en', 'fr', 'ar']);
    expect(LANGUAGES.find((l) => l.id === 'ar')?.dir).toBe('rtl');
    expect(LANGUAGES.filter((l) => l.dir === 'ltr').length).toBe(2);
  });
});
