
import React, { useState } from 'react';

interface SyncHubProps {
  onConnectNode: (nodeId: string) => void;
  currentNodeId: string | null;
  onClose: () => void;
}

const SyncHub: React.FC<SyncHubProps> = ({ onConnectNode, currentNodeId, onClose }) => {
  const [nodeInput, setNodeInput] = useState(currentNodeId || '');

  const handleConnect = () => {
    if (!nodeInput.trim()) return;
    onConnectNode(nodeInput.trim().toUpperCase());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[200] p-6">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-10 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Global Hub</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect your node to the cloud database</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-100">
            <p className="text-sm font-bold text-indigo-900 leading-relaxed mb-4">
              Enter a unique **Institutional Node ID**. Use the same ID on your phone and computer to link your database instantly.
            </p>
            <input 
              type="text" 
              value={nodeInput} 
              onChange={e => setNodeInput(e.target.value)}
              placeholder="e.g. LADTEM-OFFICE-1"
              className="w-full px-6 py-4 bg-white border-2 border-indigo-200 rounded-2xl text-xl font-black text-indigo-600 uppercase tracking-tighter outline-none focus:border-indigo-600 transition-all"
            />
          </div>

          <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight tracking-wider">Note: This creates a shared cloud room. Anyone with this ID can access and modify the data in this node.</p>
          </div>

          <button 
            onClick={handleConnect}
            className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Connect Node Database
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncHub;
