import { Info, Search, X } from 'lucide-react';
import { SearchForm } from './SearchForm';
import { ResultsGrid } from './ResultsGrid';
import { SourcesManager } from './SourcesManager';
import { Button } from '../../ui/Button';
import { useI18n } from '../../i18n';
import { usePrefs } from '../../state/prefs';
import { useUiStore } from '../../state/uiStore';
import { useSearchStore, allKnownSources } from '../../state/searchStore';
import { parseTitles } from '../../core/queryBuilder';
import type { LibraryTab } from '../saved/LibraryPage';

/**
 * The search page has two states. With no generated results it is the
 * landing-style home: centered hero column, slim notice line, and a short
 * factual section below the fold. Once links are generated the search bar
 * sticks to the top (48px) and the result rows take over; "New search"
 * returns to the home state.
 */
export function SearchPage({ onOpenLibrary }: { onOpenLibrary: (tab: LibraryTab) => void }) {
  const results = useSearchStore((s) => s.results);

  return (
    <>
      {/* Bar → results is the one allowed page transition (150ms). */}
      <div key={results ? 'results' : 'home'} className={results ? 'animate-panel-in' : undefined}>
        {results === null ? (
          <HomePage onOpenLibrary={onOpenLibrary} />
        ) : (
          <div className="mx-auto w-full max-w-5xl">
            <ResultsBar />
            <ResultsGrid />
          </div>
        )}
      </div>
      <SourcesManager />
    </>
  );
}

/** Landing home: slim notice, hero, form, short notes below the fold, footer. */
function HomePage({ onOpenLibrary }: { onOpenLibrary: (tab: LibraryTab) => void }) {
  const { t } = useI18n();
  const hintDismissed = usePrefs((s) => s.hintDismissed);
  const setHintDismissed = usePrefs((s) => s.setHintDismissed);

  return (
    <div className="mx-auto w-full max-w-[720px] pb-2">
      {/* Slim, permanently dismissible notice line. */}
      {!hintDismissed && (
        <div
          role="note"
          className="mb-7 flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-1.5"
        >
          <Info className="h-3.5 w-3.5 shrink-0 text-ink3" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink2">{t('banner.tipTitle')}</p>
          <button
            type="button"
            onClick={() => setHintDismissed(true)}
            aria-label={t('common.dismiss')}
            className="shrink-0 rounded-full p-1 text-ink3 transition-colors duration-150 hover:bg-ink/[0.06] hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Hero: mark, one-line headline, one short bio. */}
      <div className="flex flex-col items-center text-center">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="16" className="fill-accent" />
          <rect x="16" y="17" width="32" height="7" rx="3.5" className="fill-on-accent" />
          <rect x="20" y="29" width="24" height="7" rx="3.5" className="fill-on-accent opacity-90" />
          <rect x="24" y="41" width="16" height="7" rx="3.5" className="fill-on-accent opacity-80" />
          <circle cx="32" cy="52.5" r="3.5" className="fill-on-accent opacity-70" />
        </svg>
        <h1 className="mt-5 text-[28px] font-medium leading-tight tracking-tight md:text-[38px]">
          {t('home.headline')}
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink2">{t('home.bio')}</p>
      </div>

      <div className="mt-7">
        <SearchForm onOpenLibrary={onOpenLibrary} />
      </div>

      <BelowFold />
      <HomeFooter onOpenLibrary={onOpenLibrary} />
    </div>
  );
}

/** Three short factual blocks — plain text, no cards, left-aligned. */
function BelowFold() {
  const { t } = useI18n();
  const openSettings = useUiStore((s) => s.openSettings);
  const customSources = useSearchStore((s) => s.customSources);
  const sourceOrder = useSearchStore((s) => s.sourceOrder);
  const sourceDisabled = useSearchStore((s) => s.sourceDisabled);

  const pool = allKnownSources(customSources);
  const enabledLabels = sourceOrder
    .map((id) => pool.find((source) => source.id === id))
    .filter((source): source is NonNullable<typeof source> => Boolean(source))
    .filter((source) => !sourceDisabled[source.id])
    .map((source) => source.label);

  return (
    <section className="mt-16 md:mt-24">
      <div className="space-y-6">
        <div>
          <h2 className="text-[15px] font-medium">{t('home.howTitle')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink2">{t('home.howBody')}</p>
        </div>
        <div>
          <h2 className="text-[15px] font-medium">{t('home.privateTitle')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink2">
            {t('home.privateBody')}{' '}
            <button
              type="button"
              onClick={openSettings}
              className="font-medium text-accent transition-colors duration-150 hover:text-accent-strong hover:underline"
            >
              {t('home.privateLink')}
            </button>
          </p>
        </div>
        <div>
          <h2 className="text-[15px] font-medium">{t('home.worksWithTitle')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink2">
            {enabledLabels.length > 0 ? enabledLabels.join(', ') : t('home.worksWithEmpty')}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Minimal footer: name, About, export link, disclaimer. Nothing else. */
function HomeFooter({ onOpenLibrary }: { onOpenLibrary: (tab: LibraryTab) => void }) {
  const { t } = useI18n();
  const openAbout = useUiStore((s) => s.openAbout);

  return (
    <footer className="mt-16 border-t border-line pt-5 md:mt-20">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
        <span className="font-semibold tracking-tight text-ink">Siftly</span>
        <button
          type="button"
          onClick={openAbout}
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-strong hover:underline"
        >
          {t('footer.about')}
        </button>
        <button
          type="button"
          onClick={() => onOpenLibrary('saved')}
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-strong hover:underline"
        >
          {t('footer.export')}
        </button>
        <span className="text-ink3">{t('footer.disclaimer')}</span>
      </div>
    </footer>
  );
}

/**
 * Results state: the search bar stays on top — sticky, 48px, Enter still
 * generates. "New search" clears the form and returns to the home state.
 */
function ResultsBar() {
  const { t } = useI18n();
  const titlesRaw = useSearchStore((s) => s.titlesRaw);
  const update = useSearchStore((s) => s.update);
  const runSearch = useSearchStore((s) => s.runSearch);
  const resetForm = useSearchStore((s) => s.resetForm);
  const hasTitle = parseTitles(titlesRaw).length > 0;

  return (
    <div className="sticky top-14 z-30 -mx-4 mb-5 border-b border-line bg-page px-4 pb-2.5 pt-2 md:-mx-8 md:px-8">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          runSearch();
        }}
      >
        <div className="pill-bar relative flex h-12 items-center rounded-full border border-line bg-surface ps-11 pe-1.5">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3"
            aria-hidden="true"
          />
          <input
            id="job-titles"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink3 focus:outline-none"
            placeholder={t('search.titlesPlaceholder')}
            aria-label={t('search.titles')}
            value={titlesRaw}
            onChange={(event) => update({ titlesRaw: event.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="me-1 hidden shrink-0 sm:inline-flex"
            disabled={!hasTitle}
          >
            {t('search.run')}
          </Button>
          <Button type="button" variant="subtle" size="sm" className="shrink-0" onClick={resetForm}>
            {t('action.newSearch')}
          </Button>
        </div>
      </form>
    </div>
  );
}
