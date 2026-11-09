import { useState } from 'react';
import { usePrefs } from '../state/prefs';
import { useI18n, type TKey } from '../i18n';
import { Button } from './Button';

const STEPS = [1, 2, 3, 4] as const;

/** Short onboarding tour, shown once. Fully skippable. */
export function Tour() {
  const { t } = useI18n();
  const onboarded = usePrefs((s) => s.onboarded);
  const setOnboarded = usePrefs((s) => s.setOnboarded);
  const [step, setStep] = useState(0);

  if (onboarded) return null;

  const finish = () => setOnboarded(true);
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t(`tour.s${STEPS[step]}Title` as TKey)}
    >
      <div className="absolute inset-0 animate-overlay-in bg-ink/40" aria-hidden="true" />
      <div className="surface relative z-10 w-full max-w-md animate-panel-in p-6 shadow-popover">
        <div className="mb-4 flex items-center gap-1.5" aria-hidden="true">
          {STEPS.map((s, index) => (
            <span
              key={s}
              className={
                index === step
                  ? 'h-1.5 w-6 rounded-full bg-accent'
                  : 'h-1.5 w-1.5 rounded-full bg-line'
              }
            />
          ))}
        </div>
        <h2 className="text-lg font-medium">
          {t(`tour.s${STEPS[step]}Title` as TKey)}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink2">
          {t(`tour.s${STEPS[step]}Body` as TKey)}
        </p>
        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={finish}>
            {t('tour.skip')}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="subtle" size="sm" onClick={() => setStep(step - 1)}>
                {t('tour.back')}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => (isLast ? finish() : setStep(step + 1))}
            >
              {isLast ? t('tour.finish') : t('tour.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
