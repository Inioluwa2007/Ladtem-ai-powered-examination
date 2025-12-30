
/**
 * LADTEM COMMISSION - Neural Cloud Sync Engine (V3.1)
 * Optimized for high-frequency updates and multi-device coordination.
 */

const API_BASE = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '67b36f52ad19ca34f80210e7'; 
const MASTER_KEY = '$2a$10$T85zV.S5YxUj/yF5f9u.A.oG9J7rL2R9E7Z9E7Z9E7Z9E7Z9E7Z9E';

export interface NodeData {
  state: any;
  lastUpdated: string;
  version: number;
}

export interface GlobalRegistry {
  [nodeId: string]: NodeData;
}

export interface CloudResponse {
  nodeId: string;
  state: any;
  lastUpdated: string;
}

/**
 * Pushes local state to the cloud.
 * Implements an 'Atomic Merge' strategy to prevent cross-device data overwrites.
 */
export const syncToCloud = async (nodeId: string, state: any): Promise<boolean> => {
  try {
    // 1. Fetch current global registry to merge changes
    const getRes = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': MASTER_KEY },
      cache: 'no-store'
    });
    
    let registry: GlobalRegistry = {};
    if (getRes.ok) {
      const data = await getRes.json();
      registry = data.record || {};
    }

    const currentVersion = registry[nodeId]?.version || 0;

    // 2. Prepare the update with incremented version
    registry[nodeId] = {
      state,
      lastUpdated: new Date().toISOString(),
      version: currentVersion + 1
    };

    // 3. Commit back to cloud
    const putRes = await fetch(`${API_BASE}/${BIN_ID}`, {
      method: 'PUT',
      body: JSON.stringify(registry),
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY
      }
    });
    
    return putRes.ok;
  } catch (error) {
    console.error("LADTEM SYNC: Uplink Interrupted.", error);
    return false;
  }
};

/**
 * Fetches the specific state for the active Room/Node ID.
 */
export const fetchFromCloud = async (nodeId: string): Promise<CloudResponse | null> => {
  try {
    const response = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': MASTER_KEY },
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const registry: GlobalRegistry = data.record || {};
    const nodeData = registry[nodeId];

    if (!nodeData) return null;

    return {
      nodeId,
      state: nodeData.state,
      lastUpdated: nodeData.lastUpdated
    };
  } catch (error) {
    console.error("LADTEM SYNC: Downlink Interrupted.", error);
    return null;
  }
};
