/**
 * The source registry — data, not code.
 *
 * Each entry describes one applicant tracking system (ATS) or job site that
 * Siftly can aim a `site:`-restricted query at. Add new sources here; nothing
 * else needs to change.
 */

export type SourceCategory = 'ats' | 'jobboard' | 'general';

export interface JobSource {
  /** Stable identifier, used in storage and share links. Never rename an id. */
  id: string;
  /** Human-facing name shown on cards and chips. */
  label: string;
  /** One or more domains combined with OR inside the `site:` filter. */
  domains: string[];
  category: SourceCategory;
  /**
   * General job sites that are disabled by default — several actively block
   * search indexing, so results may be poor or empty.
   */
  optional?: boolean;
}

// Verify domains before release — see LAUNCH_CHECKLIST.md.
export const BUILTIN_SOURCES: JobSource[] = [
  {
    id: 'greenhouse',
    label: 'Greenhouse',
    domains: ['boards.greenhouse.io', 'job-boards.greenhouse.io'],
    category: 'ats',
  },
  { id: 'lever', label: 'Lever', domains: ['jobs.lever.co'], category: 'ats' },
  { id: 'ashby', label: 'Ashby', domains: ['jobs.ashbyhq.com'], category: 'ats' },
  { id: 'workable', label: 'Workable', domains: ['apply.workable.com'], category: 'ats' },
  { id: 'workday', label: 'Workday', domains: ['myworkdayjobs.com'], category: 'ats' },
  {
    id: 'smartrecruiters',
    label: 'SmartRecruiters',
    domains: ['jobs.smartrecruiters.com'],
    category: 'ats',
  },
  { id: 'breezy', label: 'Breezy HR', domains: ['breezy.hr'], category: 'ats' },
  { id: 'recruitee', label: 'Recruitee', domains: ['recruitee.com'], category: 'ats' },
  { id: 'rippling', label: 'Rippling', domains: ['ats.rippling.com'], category: 'ats' },
  { id: 'jazzhr', label: 'JazzHR', domains: ['applytojob.com'], category: 'ats' },
  { id: 'jobvite', label: 'Jobvite', domains: ['jobs.jobvite.com'], category: 'ats' },
  { id: 'icims', label: 'iCIMS', domains: ['icims.com'], category: 'ats' },
];

// Verify domains before release — see LAUNCH_CHECKLIST.md. Off by default.
export const OPTIONAL_SOURCES: JobSource[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    domains: ['linkedin.com/jobs'],
    category: 'general',
    optional: true,
  },
  { id: 'indeed', label: 'Indeed', domains: ['indeed.com'], category: 'general', optional: true },
  {
    id: 'glassdoor',
    label: 'Glassdoor',
    domains: ['glassdoor.com'],
    category: 'general',
    optional: true,
  },
];

/** Every source known at build time (builtin + optional general sites). */
export const ALL_SOURCES: JobSource[] = [...BUILTIN_SOURCES, ...OPTIONAL_SOURCES];

/** Ids disabled on first run (general sites — they often block crawlers). */
export const DEFAULT_DISABLED_SOURCES = OPTIONAL_SOURCES.map((s) => s.id);
