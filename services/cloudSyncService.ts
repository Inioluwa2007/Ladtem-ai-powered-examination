
/**
 * LADTEM COMMISSION - Neural Cloud Sync Engine
 * Refined for reliable cross-device "Pull-then-Push" synchronization.
 */

// Using a more reliable public prototyping endpoint
const API_BASE = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '67b36f52ad19ca34f80210e7'; // Dedicated LADTEM 2025 Public Container
const MASTER_KEY = '$2a$10$T85zV.S5YxUj/yF5f9u.A.oG9J7rL2R9E7Z9E7Z9E7Z9E7Z9E7Z9E'; // Public key for prototype

export const syncToCloud = async (nodeId: string, state: any) => {
  try {
    // We update the master record for LADTEM-2025
    // In a real app, nodeId would be a dynamic parameter in the URL
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
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("LADTEM CLOUD: Push Error", error);
    return false;
  }
};

export const fetchFromCloud = async (nodeId: string) => {
  try {
    const response = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': MASTER_KEY
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.record;
  } catch (error) {
    console.error("LADTEM CLOUD: Pull Error", error);
    return null;
  }
};
