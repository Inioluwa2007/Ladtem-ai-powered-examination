
/**
 * LADTEM COMMISSION - Universal Neural Sync (V5.0)
 * Hardened for multi-device simultaneous operations.
 */

const HUB_BASE = 'https://api.jsonbin.io/v3/b';
const HUB_ID = '67b36f52ad19ca34f80210e7'; 
const HUB_KEY = '$2b$10$T85zV.S5YxUj/yF5f9u.A.oG9J7rL2R9E7Z9E7Z9E7Z9E7Z9E7Z9E';

export interface SyncState {
  institutes: any[];
  departments: any[];
  users: any[];
  exams: any[];
  submissions: any[];
  gradingResults: any[];
}

/**
 * LADTEM Merge V5 - Conflict Resolution Strategy
 * 1. Additive: New items from both sides are kept.
 * 2. Deep Comparison: If IDs match, keep the most "complete" object.
 * 3. Priority: Approved users/published results are never overwritten by unapproved versions.
 */
export const mergeStates = (local: SyncState, cloud: SyncState): SyncState => {
  const mergeCollection = (localCol: any[] = [], cloudCol: any[] = []) => {
    const map = new Map();
    
    // Process Cloud first (Baseline)
    cloudCol.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });

    // Process Local (Merge)
    localCol.forEach(item => {
      if (!item || !item.id) return;
      if (!map.has(item.id)) {
        map.set(item.id, item);
      } else {
        const existing = map.get(item.id);
        
        // Priority checks
        const isApprovedItem = (obj: any) => obj.isApproved || obj.isPublished || obj.status === 'GRADED';
        
        if (isApprovedItem(item) && !isApprovedItem(existing)) {
          map.set(item.id, item);
        } else if (!isApprovedItem(item) && isApprovedItem(existing)) {
          // Keep existing
        } else {
          // Fallback: Longest JSON string usually has more data
          const localStr = JSON.stringify(item);
          const cloudStr = JSON.stringify(existing);
          if (localStr.length > cloudStr.length) {
            map.set(item.id, item);
          }
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

export const syncToCloud = async (nodeId: string, state: SyncState, vBlobUrl?: string): Promise<SyncState | null> => {
  try {
    // 1. Fetch current cloud state to merge before pushing
    const cloudData = await fetchFromCloud(nodeId, vBlobUrl) || { 
      institutes: [], departments: [], users: [], exams: [], submissions: [], gradingResults: [] 
    };

    // 2. Merge local + cloud
    const mergedState = mergeStates(state, cloudData);

    // 3. Update Global Registry
    const getReg = await fetch(`${HUB_BASE}/${HUB_ID}/latest`, {
      headers: { 'X-Master-Key': HUB_KEY }
    });
    if (!getReg.ok) throw new Error("Registry access failed");
    
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
    console.error("Neural Sync Error", error);
    return null;
  }
};

export const fetchFromCloud = async (nodeId: string, vBlobUrl?: string): Promise<SyncState | null> => {
  try {
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
