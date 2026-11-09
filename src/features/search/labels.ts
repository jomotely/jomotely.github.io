import type { Freshness } from '../../core/types';
import type { TKey, Vars } from '../../i18n';

type Translate = (key: TKey, vars?: Vars) => string;

/** Localized label for a freshness window ("7 days", "ساعة", …). */
export function freshnessLabel(t: Translate, freshness: Freshness): string {
  return t(`freshness.${freshness}` as TKey);
}
