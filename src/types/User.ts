// 'demo' runs on sample data and never leaves the device. 'live' is a real Supabase account.
// Sessions saved before accounts existed have no mode and count as demo.
export type AccountMode = 'demo' | 'live';

export interface User {
  id: string;
  email: string;
  name: string;
  mode?: AccountMode;
}
