
/**
 * LADTEM COMMISSION - Neural Cloud Sync Engine (V2.0)
 * Multi-Node Registry Implementation.
 */

const API_BASE = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '67b36f52ad19ca34f80210e7'; 
const MASTER_KEY = '$2a$10$T85zV.S5YxUj/yF5f9u.A.oG9J7rL2R9E7Z9E7Z9E7Z9E7Z9E7Z9E';

export interface NodeData {
  state: any;
  lastUpdated: string;
  checksum: number;
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
 * Pushes local state to the cloud registry.
 * Performs a Fetch-Merge-Push cycle to prevent overwriting other nodes.
 */
export const syncToCloud = async (nodeId: string, state: any): Promise<boolean> => {
  try {
    const checksum = JSON.stringify(state).length;
    
    // 1. Fetch current global registry
    const getRes = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': MASTER_KEY }
    });
    
    let registry: GlobalRegistry = {};
    if (getRes.ok) {
      const data = await getRes.json();
      registry = data.record || {};
    }

    // 2. Update ONLY our specific node
    registry[nodeId] = {
      state,
      lastUpdated: new Date().toISOString(),
      checksum
    };

    // 3. Push the entire registry back
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
    console.error("LADTEM SYNC: Uplink failed.", error);
    return false;
  }
};

/**
 * Fetches specific node data from the global registry.
 */
export const fetchFromCloud = async (nodeId: string): Promise<CloudResponse | null> => {
  try {
    const response = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': MASTER_KEY }
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
    console.error("LADTEM SYNC: Downlink failed.", error);
    return null;
  }
};
