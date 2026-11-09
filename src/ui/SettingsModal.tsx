import { ArrowRight } from 'lucide-react';
import { LanguageSelect } from './LanguageSelect';
import { ThemeToggle } from './ThemeToggle';
import { Modal } from './Modal';
import { Button } from './Button';
import { useI18n } from '../i18n';
import { useUiStore } from '../state/uiStore';
import { storageMode } from '../storage/storage';
import type { TabId } from './Header';

/**
 * Settings: the existing appearance and language controls, gathered in one
 * place. No new data — everything here already existed in the header.
 */
export function SettingsModal({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { t } = useI18n();
  const open = useUiStore((s) => s.settingsOpen);
  const close = useUiStore((s) => s.closeSettings);
  const mode = storageMode();

  return (
    <Modal open={open} onClose={close} title={t('settings.title')}>
      <div className="space-y-5">
        <div>
          <p className="label">{t('settings.appearance')}</p>
          <ThemeToggle />
        </div>

        <div>
          <p className="label">{t('settings.language')}</p>
          <LanguageSelect className="max-w-56" />
        </div>

        <div className="rounded-card border border-line bg-page p-3.5">
          <p className="text-sm font-medium">{t('settings.data')}</p>
          <p className="mt-1 text-[13px] text-ink2">{t('data.hint')}</p>
          <Button variant="subtle" size="sm" className="mt-3" onClick={() => { close(); onNavigate('library'); }}>
            {t('data.title')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </div>

        <p className="text-[13px] leading-relaxed text-ink3">
          {t('app.privacy')}
          {mode === 'memory' ? ` ${t('app.storageWarning')}` : ''}
        </p>
      </div>
    </Modal>
  );
}
