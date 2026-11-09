import { useI18n } from '../i18n';
import { useUiStore } from '../state/uiStore';
import { Modal } from './Modal';
import { Button } from './Button';
import { LogoMark } from './Logo';
import type { TabId } from './Header';

/**
 * The About dialog: what Siftly is, that everything stays in the browser,
 * and the no-affiliation note. Factual only — no stats, no testimonials.
 */
export function AboutModal({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { t } = useI18n();
  const open = useUiStore((s) => s.aboutOpen);
  const close = useUiStore((s) => s.closeAbout);

  return (
    <Modal open={open} onClose={close} title={t('about.title')}>
      <div className="flex items-start gap-3.5">
        <LogoMark size={40} />
        <div className="space-y-3 text-sm leading-relaxed text-ink2">
          <p>{t('about.body1')}</p>
          <p>{t('about.body2')}</p>
          <p>{t('about.body3')}</p>
          <p className="text-[13px] text-ink3">{t('app.privacy')}</p>
        </div>
      </div>
      <div className="mt-5">
        <Button
          variant="subtle"
          size="sm"
          onClick={() => {
            close();
            onNavigate('library');
          }}
        >
          {t('footer.export')}
        </Button>
      </div>
    </Modal>
  );
}
