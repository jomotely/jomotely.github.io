# Siftly — Launch checklist

Everything below must be checked **in a real browser** before calling this
release-ready. Search engines change URL parameters without notice; the
marked items are exactly the ones that silently degrade.

## 1. ATS & job-site domains

For each source, run a bare query (`site:{DOMAIN} your title`) on Google and
confirm real job postings come back from that domain.

- [ ] Greenhouse — `boards.greenhouse.io`, `job-boards.greenhouse.io`
- [ ] Lever — `jobs.lever.co`
- [ ] Ashby — `jobs.ashbyhq.com`
- [ ] Workable — `apply.workable.com`
- [ ] Workday — `myworkdayjobs.com`
- [ ] SmartRecruiters — `jobs.smartrecruiters.com`
- [ ] Breezy HR — `breezy.hr`
- [ ] Recruitee — `recruitee.com`
- [ ] Rippling — `ats.rippling.com`
- [ ] JazzHR — `applytojob.com`
- [ ] Jobvite — `jobs.jobvite.com`
- [ ] iCIMS — `icims.com`
- [ ] LinkedIn — `linkedin.com/jobs` (optional, often blocks indexing)
- [ ] Indeed — `indeed.com` (optional, often blocks indexing)
- [ ] Glassdoor — `glassdoor.com` (optional, often blocks indexing)

Region boards (per preset): Dice, USAJOBS, Reed, Totaljobs, Job Bank, SEEK,
StepStone, Welcome to the Jungle, FINN, Jobindex, Varbi, Bayt, GulfTalent,
Naukri.

## 2. Freshness parameters per engine

Run one search per row and confirm the filter chip in the engine's UI.

| Engine     | 1h | 4h | 8h | 12h | 24h | 48h | 72h | 7d | 30d | Param |
| ---------- | -- | -- | -- | --- | --- | --- | --- | -- | --- | ----- |
| Google     | qdr:h | qdr:h4 | qdr:h8 | qdr:h12 | qdr:d | qdr:d2 | qdr:d3 | qdr:w | qdr:m | `tbs` |
| Bing       | →ez1 | →ez1 | →ez1 | →ez1 | ez1 | →ez1 | →ez1 | ez2 | ez3 | `filters=ex1:"ez*"` |
| DuckDuckGo | →d | →d | →d | →d | d | →d | →d | w | m | `df` |
| Brave      | →pd | →pd | →pd | →pd | pd | →pd | →pd | pw | pm | `tf` |
| Yahoo      | →d | →d | →d | →d | d | →d | →d | w | m | `btf` |
| Startpage  | →d | →d | →d | →d | d | →d | →d | w | m | `with_date` |
| Kagi       | — unsupported (parameter omitted, notice shown) | | | | | | | | |
| Qwant      | →day | →day | →day | →day | day | →day | →day | week | month | `freshness` |

(→ = rounded, the card must show the "Freshness rounded" notice.)

## 3. Region parameters

With each preset active (US, UK, Canada, Australia, Germany, France,
Nordics, MENA, India), confirm per engine:

- [ ] Google — `gl` + `hl` change results language/region
- [ ] Bing — `cc` + `mkt` accepted (no error banner)
- [ ] DuckDuckGo — `kl` accepted
- [ ] Brave — `country` + `search_lang` accepted
- [ ] Startpage — `language` accepted
- [ ] Qwant — `locale` accepted
- [ ] Yahoo / Kagi — no region params by design; URLs unchanged

## 4. Core flows

- [ ] Enter submits the search from any form field; Ctrl/Cmd+K focuses titles
- [ ] Result cards: Open opens the engine in a new tab with the exact query
- [ ] Copy query copies the query string (fallback works on non-HTTPS)
- [ ] Open all opens cards in batches; popup-blocked state shows the warning toast
- [ ] Sources: toggle chips, reorder in Manage, add/remove custom domain
      (invalid domain rejected), preset adds its region boards
- [ ] Boolean helper output `(a OR "b c") d -e` lands in Extra keywords
- [ ] Saved searches: save, rename, duplicate, delete, re-run (re-runs populate results)
- [ ] History: capped at 20, relative timestamps, run again works
- [ ] Share link: copy → open in a new profile/tab → search applied + toast;
      tampered hash shows the invalid-share toast
- [ ] Tracker: add/edit/delete cards, drag between and within columns
      (keyboard DnD too), deadline chips turn amber ≤7 days and red when overdue
- [ ] Import/export: JSON saved-searches, tracker JSON, tracker CSV —
      round-trip in both directions; CSV opens in Excel with Arabic intact
- [ ] Storage: reload restores everything; private-window run shows the
      memory-storage warning banner

## 5. Design, i18n & PWA

- [ ] X-style theme: true-black dark canvas, graphite cards, hairline borders,
      signal-blue accent — light theme contrast spot-check (WCAG AA), focus rings visible
- [ ] Arabic: full RTL mirror, Noto Sans Arabic renders, query blocks stay LTR
- [ ] French copy review by a native speaker
- [ ] Mobile (390 px): no horizontal scroll, bottom nav, modals usable
- [ ] Onboarding tour: 4 steps, skip persists across reloads
- [ ] PWA: installable (desktop + Android), works offline after first load,
      maskable icon looks right on Android
- [ ] Lighthouse ≥ 95 in all four categories (production build, not dev)
- [ ] `npm run test` green; snapshots reviewed if updated
