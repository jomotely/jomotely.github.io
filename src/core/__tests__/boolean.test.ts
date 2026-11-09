import { describe, expect, it } from 'vitest';
import { buildBooleanQuery, EMPTY_BOOLEAN } from '../booleanBuilder';

describe('buildBooleanQuery', () => {
  it('combines OR, AND and NOT groups', () => {
    expect(
      buildBooleanQuery({
        anyOf: ['react', 'vue js'],
        allOf: ['typescript'],
        noneOf: ['angular'],
      }),
    ).toBe('(react OR "vue js") typescript -angular');
  });

  it('quotes multi-word terms', () => {
    expect(buildBooleanQuery({ anyOf: [], allOf: ['product designer'], noneOf: [] })).toBe(
      '"product designer"',
    );
  });

  it('negates multi-word terms with a leading minus', () => {
    expect(buildBooleanQuery({ anyOf: [], allOf: [], noneOf: ['work from home'] })).toBe(
      '-"work from home"',
    );
  });

  it('returns an empty string for an empty spec', () => {
    expect(buildBooleanQuery(EMPTY_BOOLEAN)).toBe('');
  });

  it('strips user-typed quotes', () => {
    expect(buildBooleanQuery({ anyOf: ['"react"'], allOf: [], noneOf: [] })).toBe('(react)');
  });
});
