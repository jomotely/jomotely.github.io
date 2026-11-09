import { useEffect, useState } from 'react';
import { usePrefs } from './prefs';
import { useSearchStore } from './searchStore';
import { useTrackerStore } from './trackerStore';

const STORES = [usePrefs, useSearchStore, useTrackerStore];

function allHydrated(): boolean {
  return STORES.every((store) => store.persist.hasHydrated());
}

/** True once every persisted store finished rehydrating from storage. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    if (allHydrated()) {
      setHydrated(true);
      return;
    }
    const unsubscribers = STORES.map((store) =>
      store.persist.onFinishHydration(() => {
        if (allHydrated()) setHydrated(true);
      }),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return hydrated;
}
