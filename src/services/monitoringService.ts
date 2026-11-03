import { buildDemoSnapshot, type DemoInput } from '../data/demo/buildSnapshot';
import { DEMO_DEFINITIONS, DEFAULT_BUSINESS_ID, type DemoDefinition } from '../data/demo/businesses';
import type { Business } from '../types/Business';
import type { MonitoringSnapshot } from '../types/Monitoring';
import { isOnline } from './connectivityService';

// Demo implementation. Keep these signatures when replacing it with Supabase (see TODOS.md).

const LOAD_DELAY_MS = 450;
const CHECK_DELAY_MS = 1400;

export const defaultBusinessId = DEFAULT_BUSINESS_ID;

export class OfflineError extends Error {
  constructor() {
    super('You are offline and this business has not been loaded on this device yet.');
    this.name = 'OfflineError';
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function findDefinition(businessId: string): DemoDefinition {
  const definition = DEMO_DEFINITIONS.find((item) => item.business.id === businessId);
  if (definition === undefined) throw new Error(`Unknown business: ${businessId}`);
  return definition;
}

export function listBusinesses(): Business[] {
  return DEMO_DEFINITIONS.map((definition) => definition.business);
}

export function getBusiness(businessId: string): Business {
  return findDefinition(businessId).business;
}

async function fetchDemoSnapshot(businessId: string, input: DemoInput, delay: number): Promise<MonitoringSnapshot> {
  if (!isOnline()) throw new OfflineError();
  await wait(delay);
  return buildDemoSnapshot(findDefinition(businessId), input, new Date());
}

export function fetchSnapshot(businessId: string, input: DemoInput): Promise<MonitoringSnapshot> {
  return fetchDemoSnapshot(businessId, input, LOAD_DELAY_MS);
}

export function runCheck(businessId: string, input: DemoInput): Promise<MonitoringSnapshot> {
  return fetchDemoSnapshot(businessId, input, CHECK_DELAY_MS);
}
