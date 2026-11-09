import { useEffect, useState } from 'react';
import {
  Bookmark,
  Boxes,
  Download,
  Globe,
  History,
  Info,
  KanbanSquare,
  Keyboard,
  Menu,
  Moon,
  MoreHorizontal,
  Search,
  Settings2,
  Sun,
  X,
} from 'lucide-react';
import { Logo, LogoMark } from './Logo';
import { useInstallPrompt } from './useInstallPrompt';
import { useI18n, type TKey } from '../i18n';
import { usePrefs } from '../state/prefs';
import { useUiStore } from '../state/uiStore';
import { Button } from './Button';
import { Popover, MenuItem, MenuDivider } from './Popover';
import { cx } from './cx';

export type TabId = 'search' | 'tracker' | 'library';
export type LibraryTab = 'saved' | 'history';

interface HeaderProps {
  tab: TabId;
  onTab: (tab: TabId) => void;
  libraryTab: LibraryTab;
  onLibraryTab: (tab: LibraryTab) => void;
}

interface NavLink {
  id: string;
  icon: typeof Search;
  labelKey: TKey;
  active: boolean;
  onSelect: () => void;
}

/**
 * App shell: one slim sticky top bar (56px, page background, 1px bottom
 * border). Left: logo + text links. Right: theme toggle and a "More" menu.
 * Below 768px the links collapse into a full-width drawer behind a menu
 * button. No sidebar, no group labels, no account chrome.
 */
export function Header({ tab, onTab, libraryTab, onLibraryTab }: HeaderProps) {
  const { t } = useI18n();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const { canInstall, install } = useInstallPrompt();
  const openSettings = useUiStore((s) => s.openSettings);
  const openSources = useUiStore((s) => s.openSources);
  const openAbout = useUiStore((s) => s.openAbout);
  const openShortcuts = useUiStore((s) => s.openShortcuts);
  const requestRegionFocus = useUiStore((s) => s.requestRegionFocus);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const goLibrary = (next: LibraryTab) => {
    onTab('library');
    onLibraryTab(next);
  };

  const links: NavLink[] = [
    {
      id: 'search',
      icon: Search,
      labelKey: 'nav.search',
      active: tab === 'search',
      onSelect: () => onTab('search'),
    },
    {
      id: 'saved',
      icon: Bookmark,
      labelKey: 'nav.saved',
      active: tab === 'library' && libraryTab === 'saved',
      onSelect: () => goLibrary('saved'),
    },
    {
      id: 'tracker',
      icon: KanbanSquare,
      labelKey: 'nav.tracker',
      active: tab === 'tracker',
      onSelect: () => onTab('tracker'),
    },
    {
      id: 'sources',
      icon: Boxes,
      labelKey: 'nav.sources',
      active: false,
      onSelect: () => {
        onTab('search');
        openSources();
      },
    },
  ];

  const moreItems: NavLink[] = [
    {
      id: 'recent',
      icon: History,
      labelKey: 'history.title',
      active: false,
      onSelect: () => goLibrary('history'),
    },
    {
      id: 'region',
      icon: Globe,
      labelKey: 'search.region',
      active: false,
      onSelect: () => {
        onTab('search');
        requestRegionFocus();
      },
    },
    {
      id: 'settings',
      icon: Settings2,
      labelKey: 'settings.title',
      active: false,
      onSelect: () => openSettings(),
    },
    {
      id: 'shortcuts',
      icon: Keyboard,
      labelKey: 'action.shortcuts',
      active: false,
      onSelect: () => openShortcuts(),
    },
    {
      id: 'about',
      icon: Info,
      labelKey: 'footer.about',
      active: false,
      onSelect: () => openAbout(),
    },
  ];

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-page">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-stretch gap-1 px-4 md:px-8">
          {/* Logo — links back to the home (search) state. */}
          <button
            type="button"
            onClick={() => onTab('search')}
            className="my-auto me-4 flex shrink-0 items-center rounded-md"
            aria-label="Siftly"
          >
            <Logo />
          </button>

          {/* Text links — accent underline on the active one, no pills. */}
          <nav aria-label="Main" className="hidden items-stretch md:flex">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={link.onSelect}
                aria-current={link.active ? 'page' : undefined}
                className={cx(
                  'relative inline-flex items-center px-3.5 text-sm transition-colors duration-150',
                  link.active
                    ? 'font-medium text-ink after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent'
                    : 'text-ink2 hover:text-ink',
                )}
              >
                {t(link.labelKey)}
              </button>
            ))}
          </nav>

          {/* Right cluster: theme toggle, More menu, mobile menu button. */}
          <div className="ms-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={t('theme.label')}
              title={t('theme.label')}
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </Button>

            <Popover
              label={t('nav.more')}
              width="w-56"
              className="hidden md:inline-flex"
              trigger={
                <Button variant="ghost" size="icon" aria-label={t('nav.more')} title={t('nav.more')}>
                  <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
                </Button>
              }
            >
              {moreItems.map((item) => (
                <MenuItem key={item.id} icon={<item.icon />} onClick={item.onSelect}>
                  {t(item.labelKey)}
                </MenuItem>
              ))}
              {canInstall && (
                <>
                  <MenuDivider />
                  <MenuItem icon={<Download />} onClick={() => void install()}>
                    {t('install.label')}
                  </MenuItem>
                </>
              )}
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.openMenu')}
              aria-expanded={drawerOpen}
              aria-haspopup="true"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer: full-width sheet with the same links. */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.openMenu')}
        >
          <div
            className="absolute inset-0 animate-overlay-in bg-ink/40"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-0 animate-panel-in border-b border-line bg-page pb-3 shadow-popover">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo />
              <Button variant="ghost" size="icon" onClick={closeDrawer} aria-label={t('common.close')}>
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav aria-label="Main" className="px-3">
              <ul>
                {links.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => {
                        link.onSelect();
                        closeDrawer();
                      }}
                      aria-current={link.active ? 'page' : undefined}
                      className={cx(
                        'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-start text-[15px] transition-colors duration-150',
                        link.active ? 'font-medium text-accent' : 'text-ink2 hover:bg-ink/[0.05] hover:text-ink',
                      )}
                    >
                      <link.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {t(link.labelKey)}
                    </button>
                  </li>
                ))}
              </ul>
              <MenuDivider />
              <ul>
                {moreItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        item.onSelect();
                        closeDrawer();
                      }}
                      className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-start text-[15px] text-ink2 transition-colors duration-150 hover:bg-ink/[0.05] hover:text-ink"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {t(item.labelKey)}
                    </button>
                  </li>
                ))}
                {canInstall && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        void install();
                      }}
                      className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-start text-[15px] text-ink2 transition-colors duration-150 hover:bg-ink/[0.05] hover:text-ink"
                    >
                      <Download className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {t('install.label')}
                    </button>
                  </li>
                )}
              </ul>
              <MenuDivider />
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[13px] text-ink3">{t('theme.label')}</span>
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" aria-hidden="true" />
                      {t('theme.light')}
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" aria-hidden="true" />
                      {t('theme.dark')}
                    </>
                  )}
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

/** Compact brand block used while persisted stores rehydrate. */
export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page">
      <div className="flex flex-col items-center gap-3">
        <LogoMark size={48} />
        <div className="text-lg font-semibold">Siftly</div>
      </div>
    </div>
  );
}
