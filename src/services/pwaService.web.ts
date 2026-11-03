export type InstallState = 'unavailable' | 'available' | 'ios-instructions' | 'installed';

export interface PwaCallbacks {
  onUpdateAvailable: () => void;
  onInstallStateChange: (state: InstallState) => void;
}

// Chrome's install event is not part of TypeScript's DOM types yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The service worker APIs below return null when there is no worker, so null checks stay at this boundary.
let installEvent: BeforeInstallPromptEvent | undefined;
let waitingWorker: ServiceWorker | undefined;
let isApplyingUpdate = false;

function isInstallEvent(event: Event): event is BeforeInstallPromptEvent {
  return 'prompt' in event;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function watchForUpdates(registration: ServiceWorkerRegistration, onUpdateAvailable: () => void): void {
  const offer = (worker: ServiceWorker) => {
    waitingWorker = worker;
    onUpdateAvailable();
  };

  if (registration.waiting !== null && navigator.serviceWorker.controller !== null) {
    offer(registration.waiting);
  }

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (worker === null) return;

    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller !== null) {
        offer(worker);
      }
    });
  });
}

export function startPwa({ onUpdateAvailable, onInstallStateChange }: PwaCallbacks): void {
  if (isStandalone()) {
    onInstallStateChange('installed');
  } else if (isIos()) {
    onInstallStateChange('ios-instructions');
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    if (!isInstallEvent(event)) return;
    event.preventDefault();
    installEvent = event;
    onInstallStateChange('available');
  });

  window.addEventListener('appinstalled', () => {
    installEvent = undefined;
    onInstallStateChange('installed');
  });

  if (__DEV__ || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install also takes control, so only reload when the user asked for the update.
    if (isApplyingUpdate) {
      isApplyingUpdate = false;
      window.location.reload();
    }
  });

  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => watchForUpdates(registration, onUpdateAvailable))
    .catch(() => {
      // The app still works online without a service worker.
    });
}

export async function promptInstall(): Promise<boolean> {
  if (installEvent === undefined) return false;

  await installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = undefined;
  return outcome === 'accepted';
}

export function applyUpdate(): void {
  isApplyingUpdate = true;
  waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
}

export function setDocumentThemeColor(color: string): void {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', color);
  });
}
