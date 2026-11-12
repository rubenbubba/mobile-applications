import { Share } from 'react-native';

// Native: opens the share sheet with the data, so the user can save it to Files, mail it, and so on.
// The web build downloads a file instead (exportService.web.ts).
export async function saveJsonFile(fileName: string, data: unknown): Promise<void> {
  await Share.share({ title: fileName, message: JSON.stringify(data, null, 2) });
}
