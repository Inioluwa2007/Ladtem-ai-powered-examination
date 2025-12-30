
/**
 * LADTEM COMMISSION - Neural Cloud Sync Engine
 * Optimized for cross-device consistency and fast deployment.
 */

const API_BASE = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '67b36f52ad19ca34f80210e7'; 
const MASTER_KEY = '$2a$10$T85zV.S5YxUj/yF5f9u.A.oG9J7rL2R9E7Z9E7Z9E7Z9E7Z9E7Z9E';

export const syncToCloud = async (nodeId: string, state: any) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(`${API_BASE}/${BIN_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        nodeId,
        state,
        lastUpdated: new Date().toISOString()
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    console.warn("LADTEM SYNC: Transmission paused (Network logic).", error);
    return false;
  }
};

export const fetchFromCloud = async (nodeId: string) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': MASTER_KEY
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.record;
  } catch (error) {
    console.error("LADTEM SYNC: Identity retrieval failed.", error);
    return null;
  }
};
