
/**
 * LADTEM COMMISSION - Universal Neural Sync (V4.7)
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
 * Intelligent Additive Merge (LADTEM Merge V4)
 * This ensures that if an item exists in EITHER local or cloud, it is preserved.
 * If an item exists in both, the one with more data (or the approved one) wins.
 */
export const mergeStates = (local: SyncState, cloud: SyncState): SyncState => {
  const mergeCollection = (localCol: any[] = [], cloudCol: any[] = []) => {
    const map = new Map();
    
    // 1. Load Cloud Data into map
    cloudCol.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });

    // 2. Overlay Local Data (Additive)
    localCol.forEach(item => {
      if (!item || !item.id) return;
      if (!map.has(item.id)) {
        // If it's only local, keep it (prevents deletion bug)
        map.set(item.id, item);
      } else {
        const existing = map.get(item.id);
        // If local version is "more approved" or has more content, local wins
        const localStr = JSON.stringify(item);
        const cloudStr = JSON.stringify(existing);
        
        // Priority: If local is approved and cloud isn't, local wins.
        if (item.isApproved && !existing.isApproved) {
          map.set(item.id, item);
        } 
        // Otherwise, the one with the most information wins
        else if (localStr.length >= cloudStr.length) {
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
 * Cloud Push Interface
 */
export const syncToCloud = async (nodeId: string, state: SyncState, vBlobUrl?: string): Promise<SyncState | null> => {
  try {
    // 1. Fetch current cloud state to merge before pushing
    const cloudData = await fetchFromCloud(nodeId, vBlobUrl) || { 
      institutes: [], departments: [], users: [], exams: [], submissions: [], gradingResults: [] 
    };

    // 2. Merge current local state with cloud state
    const mergedState = mergeStates(state, cloudData);

    // 3. Commit to Hub (JSONBin acting as the primary coordination server)
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
    // Try Vercel Blob first if URL is provided
    if (vBlobUrl) {
      try {
        const res = await fetch(`${vBlobUrl}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const reg = await res.json();
          if (reg[nodeId]?.state) return reg[nodeId].state;
        }
      } catch (e) { /* Fallback to JSONBin */ }
    }

    // Master Hub Fallback
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
