import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

interface InstallPrompt {
  canInstall: boolean;
  install: () => Promise<void>;
}

/** Tracks the browser's PWA install prompt (Chrome/Edge desktop + Android). */
export function useInstallPrompt(): InstallPrompt {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (raw: Event) => {
      raw.preventDefault();
      setEvent(raw as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!event) return;
    await event.prompt();
    setEvent(null);
  };

  return { canInstall: event !== null, install };
}
