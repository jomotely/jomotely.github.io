import { useI18n } from '../i18n';
import { useUiStore } from '../state/uiStore';
import { Modal } from './Modal';

/**
 * Lists the app's real keyboard shortcuts. Same content the shortcut
 * popover used to show, now reachable from the "More" menu.
 */
export function ShortcutsModal() {
  const { t } = useI18n();
  const open = useUiStore((s) => s.shortcutsOpen);
  const close = useUiStore((s) => s.closeShortcuts);

  return (
    <Modal open={open} onClose={close} title={t('action.shortcuts')}>
      <div className="space-y-2">
        <p className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink2">{t('search.run')}</span>
          <span className="kbd">{t('search.runHint')}</span>
        </p>
        <p className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink2">{t('shortcuts.focus')}</span>
          <span className="kbd">{t('search.focusHint')}</span>
        </p>
      </div>
    </Modal>
  );
}
