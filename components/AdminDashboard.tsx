
import React, { useState } from 'react';
import { Department, User, UserRole, Institute } from '../types';

interface AdminDashboardProps {
  institutes: Institute[];
  departments: Department[];
  users: User[];
  onAddDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: string) => void;
  onApproveUser: (userId: string) => void;
  onDeclineUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateBlobConfig?: (url: string) => void;
  blobConfigUrl?: string;
  exams?: any[];
  submissions?: any[];
  gradingResults?: any[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  institutes,
  departments, 
  users, 
  onAddDepartment, 
  onDeleteDepartment, 
  onApproveUser, 
  onDeclineUser,
  onDeleteUser,
  onUpdateBlobConfig,
  blobConfigUrl,
  exams = [],
  submissions = [],
  gradingResults = []
}) => {
  const [activeTab, setActiveTab] = useState<'depts' | 'users' | 'approvals' | 'infrastructure'>('depts');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '', instituteId: '' });
  const [tempBlobUrl, setTempBlobUrl] = useState(blobConfigUrl || '');
  const [isTestingLink, setIsTestingLink] = useState(false);

  const pendingUsers = users.filter(u => u.role === UserRole.EXAMINER && !u.isApproved);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.instituteId) return;
    onAddDepartment({ id: `dept-${Date.now()}`, ...newDept });
    setNewDept({ name: '', code: '', description: '', instituteId: '' });
    setShowDeptModal(false);
  };

  const testConnection = async () => {
    if (!tempBlobUrl) return;
    setIsTestingLink(true);
    try {
      const res = await fetch(tempBlobUrl, { method: 'HEAD' });
      if (res.ok) alert("✅ Connectivity Protocol Established: Vercel Blob is online.");
      else alert("❌ Connection Refused: Ensure your Vercel Blob is set to 'Public' visibility.");
    } catch (e) {
      alert("❌ Link Broken: Could not reach the specified endpoint.");
    } finally {
      setIsTestingLink(false);
    }
  };

  const downloadStateForVercel = () => {
    const nodeId = localStorage.getItem('ig_node_id') || 'LADTEM-GLOBAL';
    const state = { institutes, departments, users, exams, submissions, gradingResults };
    const blobData = { [nodeId]: { state, lastUpdated: new Date().toISOString(), version: 1 } };
    
    const blob = new Blob([JSON.stringify(blobData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ladtem-cloud-payload.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const deptUsers = users.filter(u => u.departmentId === selectedDeptId);

  if (selectedDeptId && selectedDept) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <button onClick={() => setSelectedDeptId(null)} className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Inventory View</span>
        </button>
        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-xl space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedDept.name}</h2>
          <div className="flex flex-col space-y-2">
             <div className="flex items-center space-x-4">
               <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedDept.code}</span>
               <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{institutes.find(i => i.id === selectedDept.instituteId)?.name}</span>
             </div>
             <p className="text-slate-500 font-bold text-sm">{selectedDept.description}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 p-8">
           <h3 className="text-lg font-black text-slate-900 uppercase mb-6">Linked Members ({deptUsers.length})</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deptUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-white ${user.role === UserRole.EXAMINER ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{user.name.charAt(0)}</div>
                  <div><p className="font-bold text-slate-900 text-sm">{user.name}</p><p className="text-[10px] text-slate-400 font-black uppercase">{user.role}</p></div>
                </div>
              ))}
              {deptUsers.length === 0 && <p className="col-span-full text-center text-slate-400 font-bold italic py-10 uppercase text-xs">No personnel linked to this unit.</p>}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tighter">Admin Console</h1>
        <div className="flex bg-slate-200 p-1 rounded-xl overflow-x-auto max-w-full">
          {['depts', 'users', 'approvals', 'infrastructure'].map((id) => (
            <button key={id} onClick={() => setActiveTab(id as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>
              {id === 'depts' ? 'Units' : id === 'approvals' ? `Approvals (${pendingUsers.length})` : id}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'depts' && (
        <div className="space-y-12">
          {institutes.map(inst => {
            const instDepts = departments.filter(d => d.instituteId === inst.id);
            return (
              <div key={inst.id} className="space-y-6">
                <div className="border-b-2 border-slate-200 pb-2"><h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{inst.name}</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instDepts.map(dept => (
                    <button key={dept.id} onClick={() => setSelectedDeptId(dept.id)} className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 transition-all text-left">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dept.code}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">{dept.name}</h3>
                    </button>
                  ))}
                  <button onClick={() => { setNewDept({ ...newDept, instituteId: inst.id }); setShowDeptModal(true); }} className="border-2 border-dashed border-slate-300 rounded-2xl p-8 hover:bg-white hover:border-indigo-400 transition-all flex flex-col items-center justify-center bg-slate-100 min-h-[160px]">
                    <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <p className="font-black text-slate-600 text-[10px] uppercase tracking-widest">Add Unit</p>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12 pb-20">
          <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
               <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <div className="relative z-10 max-w-2xl">
               <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Vercel Cloud Persistence</h2>
               <p className="text-indigo-100 font-bold leading-relaxed mb-8">
                 Securely host your academic database on Vercel's Edge Infrastructure. Use the steps below to pair this device with your permanent storage.
               </p>
               <div className="flex flex-wrap gap-4">
                 <button onClick={downloadStateForVercel} className="bg-white text-indigo-600 font-black px-6 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center space-x-3 text-xs uppercase tracking-widest">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   <span>1. Download Sync Payload</span>
                 </button>
                 <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="bg-indigo-500/50 backdrop-blur-md text-white border-2 border-white/20 font-black px-6 py-4 rounded-2xl hover:bg-indigo-500 transition-all flex items-center space-x-3 text-xs uppercase tracking-widest">
                   <span>2. Open Vercel Dashboard</span>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                 </a>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-xl space-y-8">
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">3. Bridge Connection</h3>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Vercel Blob URL (Public)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tempBlobUrl} 
                        onChange={(e) => setTempBlobUrl(e.target.value)} 
                        placeholder="https://...blob.vercel-storage.com/payload.json" 
                        className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-2xl px-5 py-4 font-bold text-indigo-600 text-xs focus:ring-4 focus:ring-indigo-100 outline-none transition-all" 
                      />
                      <button 
                        onClick={testConnection}
                        disabled={!tempBlobUrl || isTestingLink}
                        className="px-4 bg-slate-100 rounded-2xl border-2 border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                      >
                        {isTestingLink ? '...' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      </button>
                    </div>
                 </div>
                 <button onClick={() => onUpdateBlobConfig?.(tempBlobUrl)} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] hover:bg-black transition-all text-xs uppercase tracking-widest shadow-xl">
                   Authorize Node Bridge
                 </button>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-emerald-400">Pair Multi-Device Guide</h3>
              <div className="space-y-4">
                 <div className="flex items-start space-x-4">
                    <div className="bg-white/10 p-2 rounded-lg text-emerald-400 font-black">01</div>
                    <p className="text-[11px] font-bold text-slate-300 leading-tight">Enter your Unique Node ID (e.g. LADTEM-1) in the Sync Hub on **Device A**.</p>
                 </div>
                 <div className="flex items-start space-x-4">
                    <div className="bg-white/10 p-2 rounded-lg text-emerald-400 font-black">02</div>
                    <p className="text-[11px] font-bold text-slate-300 leading-tight">Open the app on **Device B** and use the **SAME ID** to pair instantly.</p>
                 </div>
                 <div className="flex items-start space-x-4">
                    <div className="bg-white/10 p-2 rounded-lg text-emerald-400 font-black">03</div>
                    <p className="text-[11px] font-bold text-slate-300 leading-tight">Once paired, all exams and student results will stream between devices automatically.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs remain identical */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b-2 border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {users.filter(u => u.isApproved).map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4"><p className="font-bold text-slate-900">{user.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{user.email}</p></td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100">{user.role}</span></td>
                  <td className="px-6 py-4 text-right"><button onClick={() => onDeleteUser(user.id)} className="text-slate-300 hover:text-rose-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
