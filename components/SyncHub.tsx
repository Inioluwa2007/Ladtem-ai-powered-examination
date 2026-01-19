
import React, { useState } from 'react';

interface SyncHubProps {
  onConnectNode: (nodeId: string) => void;
  onManualSync: () => void;
  currentNodeId: string | null;
  onClose: () => void;
  isSyncing: boolean;
}

const SyncHub: React.FC<SyncHubProps> = ({ onConnectNode, onManualSync, currentNodeId, onClose, isSyncing }) => {
  const [nodeInput, setNodeInput] = useState(currentNodeId || '');

  const handleConnect = () => {
    if (!nodeInput.trim()) return;
    onConnectNode(nodeInput.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[200] p-6">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-10 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Device Linking</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Cloud Infrastructure</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-100">
            <p className="text-xs font-bold text-indigo-900 leading-relaxed mb-4">
              To sync multiple devices (e.g. your PC and Phone), enter the **exact same Node ID** below on both devices.
            </p>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Universal Room ID</label>
              <input 
                type="text" 
                value={nodeInput} 
                onChange={e => setNodeInput(e.target.value)}
                placeholder="e.g. LADTEM-OFFICE-1"
                className="w-full px-6 py-4 bg-white border-2 border-indigo-200 rounded-2xl text-xl font-black text-indigo-600 uppercase tracking-tighter outline-none focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleConnect}
              className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Switch Node / Connect
            </button>
            
            <button 
              onClick={onManualSync}
              disabled={isSyncing}
              className="w-full py-4 rounded-[2rem] bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] border-2 border-slate-200 hover:bg-white transition-all flex items-center justify-center space-x-2"
            >
              {isSyncing ? (
                <>
                  <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span>Sync Now</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-start space-x-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-[9px] font-bold text-amber-700 uppercase leading-tight tracking-wider">Warning: Anyone with your Node ID can access your exam data. Keep this ID private.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncHub;
