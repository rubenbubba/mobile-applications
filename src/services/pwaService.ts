// No-ops for native builds. The web build uses pwaService.web.ts.
export type InstallState = 'unavailable' | 'available' | 'ios-instructions' | 'installed';

export interface PwaCallbacks {
  onUpdateAvailable: () => void;
  onInstallStateChange: (state: InstallState) => void;
}

export function startPwa(_callbacks: PwaCallbacks): void {}

export async function promptInstall(): Promise<boolean> {
  return false;
}

export function applyUpdate(): void {}

export function setDocumentThemeColor(_color: string): void {}
