
/**
 * LADTEM COMMISSION - Universal Neural Sync (V4.5)
 * Optimized for Vercel Blob Persistence & JSON Hub Failover.
 */

const HUB_BASE = 'https://api.jsonbin.io/v3/b';
const HUB_ID = '67b36f52ad19ca34f80210e7'; 
const HUB_KEY = '$2a$10$T85zV.S5YxUj/yF5f9u.A.oG9J7rL2R9E7Z9E7Z9E7Z9E7Z9E7Z9E';

export interface SyncState {
  institutes: any[];
  departments: any[];
  users: any[];
  exams: any[];
  submissions: any[];
  gradingResults: any[];
}

/**
 * Intelligent Conflict Resolution (LADTEM Merge V2)
 */
export const mergeStates = (local: SyncState, cloud: SyncState): SyncState => {
  const mergeCollection = (localCol: any[] = [], cloudCol: any[] = []) => {
    const map = new Map();
    // Prioritize cloud for structure, but keep unique local entries
    cloudCol.forEach(item => map.set(item.id, item));
    localCol.forEach(item => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      } else {
        const existing = map.get(item.id);
        // Compare data complexity as a proxy for 'freshness'
        if (JSON.stringify(item).length > JSON.stringify(existing).length) {
          map.set(item.id, item);
        }
      }
    });
    return Array.from(map.values());
  };

  return {
    institutes: mergeCollection(local.institutes, cloud.institutes),
    departments: mergeCollection(local.departments, cloud.departments),
    users: mergeCollection(local.users, cloud.users),
    exams: mergeCollection(local.exams, cloud.exams),
    submissions: mergeCollection(local.submissions, cloud.submissions),
    gradingResults: mergeCollection(local.gradingResults, cloud.gradingResults),
  };
};

/**
 * Sync Router
 */
export const syncToCloud = async (nodeId: string, state: SyncState, vBlobUrl?: string): Promise<SyncState | null> => {
  try {
    // 1. Fetch Latest State
    let cloudData: any = {};
    
    // Check Vercel Blob First if URL provided
    if (vBlobUrl) {
      const vRes = await fetch(`${vBlobUrl}?t=${Date.now()}`, { cache: 'no-store' });
      if (vRes.ok) {
        const fullReg = await vRes.json();
        cloudData = fullReg[nodeId]?.state || {};
      }
    } else {
      // Fallback to Global Hub
      const hRes = await fetch(`${HUB_BASE}/${HUB_ID}/latest`, {
        headers: { 'X-Master-Key': HUB_KEY },
        cache: 'no-store'
      });
      if (hRes.ok) {
        const data = await hRes.json();
        cloudData = data.record[nodeId]?.state || {};
      }
    }

    // 2. Atomic Merge
    const mergedState = mergeStates(state, cloudData);

    // 3. Prepare Registry
    const getReg = await fetch(`${HUB_BASE}/${HUB_ID}/latest`, {
      headers: { 'X-Master-Key': HUB_KEY }
    });
    const regData = await getReg.json();
    const registry = regData.record || {};

    registry[nodeId] = {
      state: mergedState,
      lastUpdated: new Date().toISOString(),
      version: (registry[nodeId]?.version || 0) + 1
    };

    // 4. Commit to Hub
    // (In a full Vercel setup, we'd also trigger a Webhook to update the Blob)
    const putRes = await fetch(`${HUB_BASE}/${HUB_ID}`, {
      method: 'PUT',
      body: JSON.stringify(registry),
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': HUB_KEY
      }
    });
    
    return putRes.ok ? mergedState : null;
  } catch (error) {
    console.error("LADTEM SYNC: Uplink Failure.", error);
    return null;
  }
};

export const fetchFromCloud = async (nodeId: string, vBlobUrl?: string): Promise<SyncState | null> => {
  try {
    if (vBlobUrl) {
      const res = await fetch(`${vBlobUrl}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const reg = await res.json();
        return reg[nodeId]?.state || null;
      }
    }

    const res = await fetch(`${HUB_BASE}/${HUB_ID}/latest`, {
      headers: { 'X-Master-Key': HUB_KEY },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.record[nodeId]?.state || null;
  } catch (error) {
    return null;
  }
};
