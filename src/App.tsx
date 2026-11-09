import { Suspense, lazy, useEffect, useState } from 'react';
import { Header, Splash, type TabId, type LibraryTab } from './ui/Header';
import { Tour } from './ui/Tour';
import { Toasts } from './ui/Toasts';
import { SettingsModal } from './ui/SettingsModal';
import { AboutModal } from './ui/AboutModal';
import { ShortcutsModal } from './ui/ShortcutsModal';
import { toast } from './state/toastStore';
import { I18nProvider, useI18n } from './i18n';
import { usePrefs } from './state/prefs';
import { useHydrated } from './state/hydration';
import { useSearchStore } from './state/searchStore';
import { decodeShare } from './core/share';
import { storageMode } from './storage/storage';
import { SearchPage } from './features/search/SearchPage';

const TrackerPage = lazy(() =>
  import('./features/tracker/TrackerPage').then((m) => ({ default: m.TrackerPage })),
);
const LibraryPage = lazy(() =>
  import('./features/saved/LibraryPage').then((m) => ({ default: m.LibraryPage })),
);

function Shell() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const theme = usePrefs((s) => s.theme);
  const [tab, setTab] = useState<TabId>('search');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('saved');

  const openLibrary = (next: LibraryTab) => {
    setTab('library');
    setLibraryTab(next);
  };

  // Theme class on <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Global shortcut: Ctrl/Cmd + K goes to the search page and focuses titles.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setTab((current) => {
          if (current !== 'search') {
            window.setTimeout(() => document.getElementById('job-titles')?.focus(), 80);
            return 'search';
          }
          document.getElementById('job-titles')?.focus();
          return current;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Share links: decode settings from the URL hash once, then clean the bar.
  useEffect(() => {
    if (!hydrated) return;
    const hash = window.location.hash;
    if (!hash) return;
    if (hash.startsWith('#s=')) {
      const payload = decodeShare(hash);
      if (payload) {
        useSearchStore.getState().applySharePayload(payload);
        setTab('search');
        toast.success(t('search.loadedFromShare'));
      } else {
        toast.error(t('share.invalid'));
      }
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return <Splash />;

  return (
    <div className="min-h-dvh bg-page text-ink">
      <Header tab={tab} onTab={setTab} libraryTab={libraryTab} onLibraryTab={setLibraryTab} />

      {storageMode() === 'memory' && (
        <div className="border-b border-warn/25 bg-warn/10 px-4 py-2 text-center text-[13px] text-warn">
          {t('app.storageWarning')}
        </div>
      )}

      <main className="mx-auto w-full px-4 pb-16 pt-6 md:px-8 md:pb-20">
        {tab === 'search' ? (
          <SearchPage onOpenLibrary={openLibrary} />
        ) : (
          <Suspense
            fallback={
              <div className="surface mx-auto h-64 max-w-4xl animate-pulse bg-surface" />
            }
          >
            {tab === 'tracker' ? (
              <TrackerPage />
            ) : (
              <LibraryPage
                tab={libraryTab}
                onTab={setLibraryTab}
                onNavigateToSearch={() => setTab('search')}
              />
            )}
          </Suspense>
        )}
      </main>

      <SettingsModal onNavigate={setTab} />
      <AboutModal onNavigate={setTab} />
      <ShortcutsModal />
      <Tour />
      <Toasts />
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
