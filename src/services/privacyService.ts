import { getDataMode } from './dataMode';
import { saveJsonFile } from './exportService';
import { exportLiveData } from './liveMonitoringService';
import { storageService } from './storageService';

const LOCAL_KEYS = ['vitrine-session', 'vitrine-monitoring', 'vitrine-settings', 'vitrine-sync-queue'];

function readLocal(key: string): unknown {
  try {
    return JSON.parse(storageService.getItem(key) ?? 'null');
  } catch {
    return undefined;
  }
}

// "Download my data" (GDPR right of access and portability): everything stored about this user, as JSON.
export async function downloadMyData(): Promise<void> {
  const onThisDevice = Object.fromEntries(LOCAL_KEYS.map((key) => [key, readLocal(key)]));
  const fromServer = getDataMode() === 'live' ? await exportLiveData() : undefined;

  await saveJsonFile(`vitrine-my-data-${new Date().toISOString().slice(0, 10)}.json`, {
    exportedAt: new Date().toISOString(),
    explanation:
      fromServer === undefined
        ? 'Demo session: everything is stored only on this device.'
        : 'Your account data from our database (EU), plus what is saved on this device.',
    account: fromServer,
    onThisDevice,
  });
}
