
import React, { useState } from 'react';
import { UserRole, Department, Institute, User } from '../types';
import { BRANDING } from '../constants/branding';
import { BrandingLogo } from '../App';

interface LoginProps {
  portalType: UserRole;
  institutes: Institute[];
  departments: Department[];
  users: User[];
  onLogin: (credentials: { email: string; password: string; role: UserRole }) => void;
  onSignUp: (data: { name: string; email: string; password?: string; role: UserRole; instituteId: string; departmentId: string }) => void;
  onResetPassword: (email: string, role: UserRole, newPassword: string) => void;
  onBack: () => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ResetStep = 'IDENTIFY' | 'VERIFY' | 'NEW_PASSWORD' | null;

const Login: React.FC<LoginProps> = ({ portalType, institutes, departments, users, onLogin, onSignUp, onResetPassword, onBack, notify }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedInst, setSelectedInst] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const filteredDepts = departments.filter(d => d.instituteId === selectedInst);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      if (!selectedInst) {
        notify("Institute selection required.", "error");
        return;
      }
      if (!selectedDept) {
        notify("Academic Department selection required.", "error");
        return;
      }
    }
    setIsLoading(true);
    setTimeout(() => {
      if (isSignUp) {
        onSignUp({ name, email, password, role: portalType, instituteId: selectedInst, departmentId: selectedDept });
        if (portalType === UserRole.EXAMINER) setIsSignUp(false);
        else onLogin({ email, password, role: portalType });
      } else {
        onLogin({ email, password, role: portalType });
      }
      setIsLoading(false);
    }, 800);
  };

  const handleIdentifyReset = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === portalType);
    if (!user) {
      notify("Identity Record Not Found: Access Denied.", "error");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setResetStep('VERIFY');
    notify(`Verification Protocol Sent: Use code ${code} to proceed.`, "info");
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode === generatedCode) {
      setResetStep('NEW_PASSWORD');
      notify("Identity Verified. Define new credentials.", "success");
    } else {
      notify("Invalid Protocol Code: Verification Failed.", "error");
    }
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    onResetPassword(email, portalType, newPassword);
    setResetStep(null);
    setNewPassword('');
    notify("Identity Node Restored.", "success");
  };

  const theme = {
    [UserRole.STUDENT]: { accent: 'emerald', title: 'Student Portal', bg: 'bg-emerald-50', btn: 'bg-emerald-600' },
    [UserRole.EXAMINER]: { accent: 'indigo', title: 'Examiner Portal', bg: 'bg-indigo-50', btn: 'bg-indigo-600' },
    [UserRole.ADMIN]: { accent: 'slate', title: 'Admin Console', bg: 'bg-slate-100', btn: 'bg-slate-900' }
  }[portalType];

  const brandParts = BRANDING.NAME.split(' ');

  if (resetStep) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg} px-4 py-12 transition-all duration-500`}>
        <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-6">
          <div className="text-center">
            <button onClick={() => setResetStep(null)} className="mb-8 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center space-x-2 mx-auto hover:text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span>Back to Login</span>
            </button>
            <div className="inline-flex p-4 rounded-3xl bg-white border-2 border-slate-200 mb-6 shadow-xl">
              <BrandingLogo className="w-16 h-16 object-contain" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Credential Recovery</h2>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-slate-300">
            {resetStep === 'IDENTIFY' && (
              <form onSubmit={handleIdentifyReset} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Institutional Email</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all" placeholder="user@ladtem.edu" />
                </div>
                <button className={`w-full py-5 rounded-[2rem] font-black text-white shadow-xl ${theme.btn} uppercase tracking-widest text-xs`}>Transmit Code</button>
              </form>
            )}

            {resetStep === 'VERIFY' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 text-center">Enter Transmitted Protocol Code</label>
                  <input 
                    required 
                    type="text" 
                    maxLength={6} 
                    value={resetCode} 
                    onChange={e => setResetCode(e.target.value)} 
                    className="block w-full px-5 py-6 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-black text-3xl text-center outline-none focus:border-indigo-600 transition-all tracking-[0.5em]" 
                    placeholder="000000" 
                  />
                </div>
                <button className={`w-full py-5 rounded-[2rem] font-black text-white shadow-xl ${theme.btn} uppercase tracking-widest text-xs`}>Verify Protocol</button>
              </form>
            )}

            {resetStep === 'NEW_PASSWORD' && (
              <form onSubmit={handleCompleteReset} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">New Identity Credentials</label>
                  <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="block w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all" placeholder="••••••••" />
                </div>
                <button className={`w-full py-5 rounded-[2rem] font-black text-white shadow-xl ${theme.btn} uppercase tracking-widest text-xs`}>Restore Node Access</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.bg} px-4 py-12 transition-colors duration-500`}>
      <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <button onClick={onBack} className="mb-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center space-x-2 mx-auto hover:text-slate-600 transition-all bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span>Exit Portal</span>
          </button>
          
          <div className="inline-flex items-center justify-center p-6 rounded-[3rem] shadow-2xl mb-6 bg-white border-2 border-slate-200 transform -rotate-3 hover:rotate-0 transition-all">
            <BrandingLogo className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{brandParts[0]} <span className={portalType === UserRole.ADMIN ? 'text-slate-600' : `text-${theme.accent}-600`}>{brandParts.slice(1).join(' ')}</span></h1>
          <p className="mt-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{theme.title}</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-slate-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Identity Name</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all" placeholder="Enter Full Name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Institute</label>
                    <select required value={selectedInst} onChange={e => { setSelectedInst(e.target.value); setSelectedDept(''); }} className="block w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all appearance-none">
                      <option value="" disabled>Choose Institute...</option>
                      {institutes.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Department</label>
                    <select required value={selectedDept} disabled={!selectedInst} onChange={e => setSelectedDept(e.target.value)} className="block w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all appearance-none disabled:opacity-50">
                      <option value="" disabled>{selectedInst ? 'Choose Department...' : 'Select Institute first'}</option>
                      {filteredDepts.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Institutional Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all" placeholder="user@ladtem.edu" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Credentials</label>
                  {!isSignUp && portalType !== UserRole.ADMIN && (
                    <button type="button" onClick={() => setResetStep('IDENTIFY')} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest">Forgot?</button>
                  )}
                </div>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all" placeholder="••••••••" />
              </div>
            </div>
            <button disabled={isLoading} className={`w-full py-5 px-6 rounded-[2rem] font-black text-white shadow-xl transition-all active:scale-95 uppercase tracking-widest ${theme.btn} hover:opacity-90`}>
              {isLoading ? 'Processing Node...' : isSignUp ? 'Register Identity' : 'Authenticate'}
            </button>
          </form>
          {portalType !== UserRole.ADMIN && (
            <div className="mt-8 text-center">
              <button onClick={() => { setIsSignUp(!isSignUp); setSelectedInst(''); setSelectedDept(''); }} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest underline decoration-2 underline-offset-4">{isSignUp ? 'Have account? Sign In' : 'New Identity? Create Access'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
