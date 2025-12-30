
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
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  institutes,
  departments, 
  users, 
  onAddDepartment, 
  onDeleteDepartment, 
  onApproveUser, 
  onDeclineUser,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'depts' | 'users' | 'approvals'>('depts');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '', instituteId: '' });

  const pendingUsers = users.filter(u => u.role === UserRole.EXAMINER && !u.isApproved);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.instituteId) {
      alert("Please select an institute for the department.");
      return;
    }
    onAddDepartment({
      id: `dept-${Date.now()}`,
      ...newDept
    });
    setNewDept({ name: '', code: '', description: '', instituteId: '' });
    setShowDeptModal(false);
  };

  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const deptUsers = users.filter(u => u.departmentId === selectedDeptId);
  const deptExaminers = deptUsers.filter(u => u.role === UserRole.EXAMINER);
  const deptStudents = deptUsers.filter(u => u.role === UserRole.STUDENT);

  if (selectedDeptId && selectedDept) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedDeptId(null)}
            className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span>Back to Units</span>
          </button>
          <button 
            onClick={() => {
              if (confirm(`Permanently decommission the ${selectedDept.name} unit? All associated access will be revoked.`)) {
                onDeleteDepartment(selectedDept.id);
                setSelectedDeptId(null);
              }
            }}
            className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-200"
          >
            Purge Unit
          </button>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-xl overflow-hidden">
              <div className="p-6 bg-slate-50 border-b-2 border-slate-100 flex justify-between items-center">
                 <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Faculty Directory</h3>
                 <span className="text-[10px] font-black text-slate-400 uppercase">{deptExaminers.length} Active</span>
              </div>
              <div className="divide-y-2 divide-slate-50 max-h-[400px] overflow-y-auto">
                 {deptExaminers.length === 0 ? (
                   <div className="p-10 text-center text-slate-400 font-bold italic text-xs uppercase">No Faculty Assigned</div>
                 ) : deptExaminers.map(user => (
                   <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                         <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">{user.name.charAt(0)}</div>
                         <div>
                            <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase">{user.email}</p>
                         </div>
                      </div>
                      <button onClick={() => { if(confirm(`Revoke faculty access for ${user.name}?`)) onDeleteUser(user.id) }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-xl overflow-hidden">
              <div className="p-6 bg-slate-50 border-b-2 border-slate-100 flex justify-between items-center">
                 <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Candidate Registry</h3>
                 <span className="text-[10px] font-black text-slate-400 uppercase">{deptStudents.length} Active</span>
              </div>
              <div className="divide-y-2 divide-slate-50 max-h-[400px] overflow-y-auto">
                 {deptStudents.length === 0 ? (
                   <div className="p-10 text-center text-slate-400 font-bold italic text-xs uppercase">No Candidates Registered</div>
                 ) : deptStudents.map(user => (
                   <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                         <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">{user.name.charAt(0)}</div>
                         <div>
                            <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase">{user.email}</p>
                         </div>
                      </div>
                      <button onClick={() => { if(confirm(`Revoke candidate access for ${user.name}?`)) onDeleteUser(user.id) }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tighter">Admin Console</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Institutional Management Hub</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-xl overflow-x-auto max-w-full">
          {[
            { id: 'depts', label: 'Departments' },
            { id: 'users', label: 'Directory' },
            { id: 'approvals', label: 'Approvals', count: pendingUsers.length }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab.label}
              {tab.count ? (
                <span className="ml-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
              ) : null}
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
                <div className="border-b-2 border-slate-200 pb-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{inst.name}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instDepts.map(dept => (
                    <div key={dept.id} className="relative group">
                      <button 
                        onClick={() => setSelectedDeptId(dept.id)}
                        className="w-full bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-indigo-300 transition-all text-left"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dept.code}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors pr-6">{dept.name}</h3>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">{dept.description}</p>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete the ${dept.name} unit? All associated data will be removed.`)) {
                            onDeleteDepartment(dept.id);
                          }
                        }}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-600 transition-colors z-10"
                        title="Delete Department"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      setNewDept({ ...newDept, instituteId: inst.id });
                      setShowDeptModal(true);
                    }}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-8 hover:bg-white hover:border-indigo-400 transition-all group flex flex-col items-center justify-center text-center bg-slate-100"
                  >
                    <div className="bg-slate-200 p-4 rounded-full mb-3 group-hover:bg-indigo-50 transition-colors">
                      <svg className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="font-black text-slate-600 group-hover:text-indigo-600 text-[10px] uppercase tracking-widest">Add Department to {inst.name.split(' ')[0]}</p>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b-2 border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Identity Details</th>
                <th className="px-6 py-4">Access Level</th>
                <th className="px-6 py-4">Department Unit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {users.filter(u => u.isApproved).map(user => {
                const dept = departments.find(d => d.id === user.departmentId);
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${user.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        user.role === UserRole.ADMIN ? 'bg-amber-50 text-amber-700' :
                        user.role === UserRole.EXAMINER ? 'bg-indigo-50 text-indigo-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-700 font-bold">{dept ? dept.name : 'Central Command'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         disabled={user.role === UserRole.ADMIN}
                         onClick={() => { if(confirm(`Revoke all access for ${user.name}?`)) onDeleteUser(user.id) }} 
                         className="text-slate-300 hover:text-rose-600 transition-colors disabled:opacity-0"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-slate-300 overflow-hidden shadow-sm">
             <div className="p-8 border-b-2 border-slate-100 bg-slate-50/50">
               <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Pending Faculty Verifications</h3>
             </div>
             {pendingUsers.length === 0 ? (
               <div className="p-20 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">No pending verification requests.</div>
             ) : (
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Proposed Identity</th>
                      <th className="px-6 py-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                    {pendingUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                             <button onClick={() => onDeclineUser(user.id)} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-all">Decline</button>
                             <button onClick={() => onApproveUser(user.id)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Approve Identity</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Deploy New Unit</h2>
              <button onClick={() => setShowDeptModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddDept} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assigned Institute</label>
                  <select required value={newDept.instituteId} onChange={e => setNewDept({...newDept, instituteId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-400 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold text-slate-900 appearance-none">
                    <option value="" disabled>Select Institute...</option>
                    {institutes.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Department Identifier</label>
                  <input required value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} type="text" className="w-full bg-slate-50 border-2 border-slate-400 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold text-slate-900" placeholder="e.g. Faculty of Advanced Science" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Institutional Code</label>
                  <input required value={newDept.code} onChange={e => setNewDept({...newDept, code: e.target.value})} type="text" className="w-full bg-slate-50 border-2 border-slate-400 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold text-slate-900" placeholder="e.g. FASC-402" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mandate Description</label>
                  <textarea required value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-400 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold text-slate-900 min-h-[120px]" placeholder="Outline unit scope..." />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs">
                Confirm Deployment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
