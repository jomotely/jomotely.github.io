/**
 * Region presets: country/region configurations with per-engine search
 * parameters and language hints, plus optional region-specific job boards
 * appended to the source list while the preset is active.
 */

import type { RegionParams } from './engines';
import type { JobSource } from './sources';

export interface RegionPreset {
  id: string;
  label: string;
  /** Human-facing language hint, e.g. "English", "Arabic". */
  languageHint: string;
  region: RegionParams;
  /** Region job boards appended to the source list. Verify domains before release. */
  extraSources?: JobSource[];
}

// Verify domains before release — see LAUNCH_CHECKLIST.md.
export const REGION_PRESETS: RegionPreset[] = [
  { id: 'global', label: 'Global', languageHint: 'Any', region: {} },
  {
    id: 'us',
    label: 'United States',
    languageHint: 'English',
    region: {
      gl: 'us',
      hl: 'en',
      cc: 'us',
      mkt: 'en-US',
      kl: 'us-en',
      country: 'us',
      searchLang: 'en',
      locale: 'en_US',
      language: 'english',
    },
    extraSources: [
      { id: 'us-dice', label: 'Dice', domains: ['dice.com'], category: 'jobboard' },
      { id: 'us-usajobs', label: 'USAJOBS', domains: ['usajobs.gov'], category: 'jobboard' },
    ],
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    languageHint: 'English',
    region: {
      gl: 'gb',
      hl: 'en',
      cc: 'gb',
      mkt: 'en-GB',
      kl: 'uk-en',
      country: 'gb',
      searchLang: 'en',
      locale: 'en_GB',
      language: 'english',
    },
    extraSources: [
      { id: 'uk-reed', label: 'Reed', domains: ['reed.co.uk'], category: 'jobboard' },
      { id: 'uk-totaljobs', label: 'Totaljobs', domains: ['totaljobs.com'], category: 'jobboard' },
    ],
  },
  {
    id: 'canada',
    label: 'Canada',
    languageHint: 'English',
    region: {
      gl: 'ca',
      hl: 'en',
      cc: 'ca',
      mkt: 'en-CA',
      kl: 'ca-en',
      country: 'ca',
      searchLang: 'en',
      locale: 'en_CA',
      language: 'english',
    },
    extraSources: [
      { id: 'ca-jobbank', label: 'Job Bank', domains: ['jobbank.gc.ca'], category: 'jobboard' },
    ],
  },
  {
    id: 'australia',
    label: 'Australia',
    languageHint: 'English',
    region: {
      gl: 'au',
      hl: 'en',
      cc: 'au',
      mkt: 'en-AU',
      kl: 'au-en',
      country: 'au',
      searchLang: 'en',
      locale: 'en_AU',
      language: 'english',
    },
    extraSources: [{ id: 'au-seek', label: 'SEEK', domains: ['seek.com.au'], category: 'jobboard' }],
  },
  {
    id: 'germany',
    label: 'Germany',
    languageHint: 'German',
    region: {
      gl: 'de',
      hl: 'de',
      cc: 'de',
      mkt: 'de-DE',
      kl: 'de-de',
      country: 'de',
      searchLang: 'de',
      locale: 'de_DE',
      language: 'german',
    },
    extraSources: [
      { id: 'de-stepstone', label: 'StepStone', domains: ['stepstone.de'], category: 'jobboard' },
    ],
  },
  {
    id: 'france',
    label: 'France',
    languageHint: 'French',
    region: {
      gl: 'fr',
      hl: 'fr',
      cc: 'fr',
      mkt: 'fr-FR',
      kl: 'fr-fr',
      country: 'fr',
      searchLang: 'fr',
      locale: 'fr_FR',
      language: 'french',
    },
    extraSources: [
      {
        id: 'fr-wttj',
        label: 'Welcome to the Jungle',
        domains: ['welcometothejungle.com'],
        category: 'jobboard',
      },
    ],
  },
  {
    id: 'nordics',
    label: 'Nordics',
    languageHint: 'Swedish',
    region: {
      gl: 'se',
      hl: 'sv',
      cc: 'se',
      mkt: 'sv-SE',
      kl: 'se-sv',
      country: 'se',
      searchLang: 'sv',
      locale: 'sv_SE',
      language: 'swedish',
    },
    extraSources: [
      { id: 'no-finn', label: 'FINN', domains: ['finn.no'], category: 'jobboard' },
      { id: 'dk-jobindex', label: 'Jobindex', domains: ['jobindex.dk'], category: 'jobboard' },
      { id: 'se-varbi', label: 'Varbi', domains: ['varbi.com'], category: 'jobboard' },
    ],
  },
  {
    id: 'mena',
    label: 'MENA',
    languageHint: 'Arabic',
    region: {
      gl: 'sa',
      hl: 'ar',
      cc: 'sa',
      mkt: 'ar-SA',
      kl: 'xa-ar',
      country: 'sa',
      searchLang: 'ar',
      // Qwant has no Arabic locale code we can rely on — fall back to en_US.
      locale: 'en_US',
      language: 'arabic',
    },
    extraSources: [
      { id: 'mena-bayt', label: 'Bayt', domains: ['bayt.com'], category: 'jobboard' },
      {
        id: 'mena-gulftalent',
        label: 'GulfTalent',
        domains: ['gulftalent.com'],
        category: 'jobboard',
      },
    ],
  },
  {
    id: 'india',
    label: 'India',
    languageHint: 'English',
    region: {
      gl: 'in',
      hl: 'en',
      cc: 'in',
      mkt: 'en-IN',
      kl: 'in-en',
      country: 'in',
      searchLang: 'en',
      locale: 'en_IN',
      language: 'english',
    },
    extraSources: [{ id: 'in-naukri', label: 'Naukri', domains: ['naukri.com'], category: 'jobboard' }],
  },
];

export function getPreset(id: string): RegionPreset {
  return REGION_PRESETS.find((p) => p.id === id) ?? REGION_PRESETS[0];
}
