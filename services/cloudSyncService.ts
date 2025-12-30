
/**
 * LADTEM COMMISSION - Universal Neural Sync (V4.6)
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
 * Intelligent Conflict Resolution (LADTEM Merge V3)
 */
export const mergeStates = (local: SyncState, cloud: SyncState): SyncState => {
  const mergeCollection = (localCol: any[] = [], cloudCol: any[] = []) => {
    const map = new Map();
    // 1. Process Cloud Data
    cloudCol.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    // 2. Process Local Data (Priority for local changes)
    localCol.forEach(item => {
      if (!item || !item.id) return;
      if (!map.has(item.id)) {
        map.set(item.id, item);
      } else {
        const existing = map.get(item.id);
        // Compare data complexity or keep local if it was just changed
        if (JSON.stringify(item).length >= JSON.stringify(existing).length) {
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
    // 1. Fetch Latest Cloud State
    let cloudData: any = {};
    
    if (vBlobUrl) {
      try {
        const vRes = await fetch(`${vBlobUrl}?t=${Date.now()}`, { cache: 'no-store' });
        if (vRes.ok) {
          const fullReg = await vRes.json();
          cloudData = fullReg[nodeId]?.state || {};
        }
      } catch (e) { console.warn("Vercel Blob Fetch Error", e); }
    }

    // Always fetch from JSONBin as the master coordination hub
    const hRes = await fetch(`${HUB_BASE}/${HUB_ID}/latest`, {
      headers: { 'X-Master-Key': HUB_KEY },
      cache: 'no-store'
    });
    if (hRes.ok) {
      const data = await hRes.json();
      const hubCloud = data.record[nodeId]?.state || {};
      // Merge Hub data into CloudData if Blob was empty
      cloudData = mergeStates(cloudData, hubCloud);
    }

    // 2. Atomic Merge Local and Cloud
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
        if (reg[nodeId]?.state) return reg[nodeId].state;
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
