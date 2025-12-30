
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, Exam, Submission, GradingResult, Answer, User, Department, Institute } from './types';
import Layout from './components/Layout';
import ExaminerDashboard from './components/ExaminerDashboard';
import StudentExam from './components/StudentExam';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import SyncHub from './components/SyncHub';
import { gradeSubmission } from './services/geminiService';
import { fetchFromCloud, syncToCloud } from './services/cloudSyncService';
import { BRANDING } from './constants/branding';

const CENTRAL_ADMIN_EMAIL = 'ladtemcommision@gmail.com';
const CENTRAL_ADMIN_PASSWORD = 'ladtem';
const CONSTANT_NODE_ID = 'LADTEM-2025';

const STORAGE_KEYS = {
  INSTITUTES: 'ig_institutes',
  DEPARTMENTS: 'ig_departments',
  USERS: 'ig_users',
  EXAMS: 'ig_exams',
  SUBMISSIONS: 'ig_submissions',
  RESULTS: 'ig_results',
  ACTIVE_USER: 'ig_active_user',
  PORTAL: 'ig_active_portal',
  THEME: 'ig_theme'
};

export type AppTheme = 'slate' | 'blue' | 'emerald' | 'rose';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

const Notification: React.FC<{ notification: NotificationState; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-600 border-emerald-400',
    error: 'bg-rose-600 border-rose-400',
    info: 'bg-indigo-600 border-indigo-400',
  };

  return (
    <div className={`fixed top-24 right-6 z-[200] animate-in slide-in-from-right-10 duration-300 p-4 rounded-2xl border-2 text-white shadow-2xl flex items-center space-x-4 min-w-[300px] ${colors[notification.type]}`}>
      <div className="bg-white/20 p-2 rounded-xl">
        {notification.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        {notification.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
        {notification.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{notification.type}</p>
        <p className="text-sm font-bold tracking-tight">{notification.message}</p>
      </div>
      <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

export const BrandingLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <img src={BRANDING.LOGO_SRC} alt={BRANDING.NAME} className={`${className} transition-opacity duration-300 object-contain`} />
  );
};

const INITIAL_INSTITUTES: Institute[] = [
  { id: 'inst-1', name: 'Discipleship Film and Media Institute' },
  { id: 'inst-2', name: 'Institute of Entrepreneurship Study and Research' },
  { id: 'inst-3', name: 'Research Plus' }
];

const App: React.FC = () => {
  // --- CORE STATE ---
  const [cloudNodeId] = useState<string>(CONSTANT_NODE_ID);
  const [portal, setPortal] = useState<UserRole | null>(() => (localStorage.getItem(STORAGE_KEYS.PORTAL) as UserRole) || null);
  const [activeUser, setActiveUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [institutes, setInstitutes] = useState<Institute[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSTITUTES);
    return saved ? JSON.parse(saved) : INITIAL_INSTITUTES;
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : [];
  });
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return saved ? JSON.parse(saved) : [];
  });
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : [];
  });
  const [gradingResults, setGradingResults] = useState<GradingResult[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [appTheme, setAppTheme] = useState<AppTheme>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme) || 'slate');

  const [isExamActive, setIsExamActive] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isInitialPullDone = useRef(false);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  }, []);

  // --- DATABASE SYNC LOGIC ---
  const triggerPush = useCallback(async () => {
    if (!cloudNodeId || !isInitialPullDone.current) return;
    setIsSyncing(true);
    const state = { institutes, departments, users, exams, submissions, gradingResults };
    await syncToCloud(cloudNodeId, state);
    setIsSyncing(false);
  }, [cloudNodeId, institutes, departments, users, exams, submissions, gradingResults]);

  const triggerPull = useCallback(async (nodeId: string) => {
    setIsSyncing(true);
    const cloudState = await fetchFromCloud(nodeId);
    if (cloudState && cloudState.state) {
      const { state } = cloudState;
      // Atomic updates to avoid partial state sync
      if (state.institutes) setInstitutes(state.institutes);
      if (state.departments) setDepartments(state.departments);
      if (state.users) setUsers(state.users);
      if (state.exams) setExams(state.exams);
      if (state.submissions) setSubmissions(state.submissions);
      if (state.gradingResults) setGradingResults(state.gradingResults);
      notify(`Identity Hub Synced: ${nodeId}`, "success");
    } else {
      notify("Global Node Initialized. Ready for data transmission.", "info");
    }
    isInitialPullDone.current = true;
    setIsSyncing(false);
  }, [notify]);

  // Initial Sync on Mount
  useEffect(() => {
    triggerPull(CONSTANT_NODE_ID);
  }, [triggerPull]);

  // Local Storage Middleware + Auto Cloud Push
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTITUTES, JSON.stringify(institutes));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(gradingResults));
    localStorage.setItem(STORAGE_KEYS.THEME, appTheme);
    if (portal) localStorage.setItem(STORAGE_KEYS.PORTAL, portal);
    if (activeUser) localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(activeUser));
    
    // Pulse to Cloud when data changes (Debounced)
    const timer = setTimeout(() => {
      triggerPush();
    }, 2000);
    return () => clearTimeout(timer);
  }, [institutes, departments, users, exams, submissions, gradingResults, appTheme, portal, activeUser, triggerPush]);

  // --- HANDLERS ---
  const handleLogin = ({ email, password, role }: any) => {
    if (role === UserRole.ADMIN) {
      if (email.toLowerCase() === CENTRAL_ADMIN_EMAIL.toLowerCase() && password === CENTRAL_ADMIN_PASSWORD) {
         setActiveUser({ id: 'admin-001', name: 'Central Admin', email: CENTRAL_ADMIN_EMAIL, role: UserRole.ADMIN, isApproved: true });
         notify("Administrative Access Granted", "success"); return;
      }
      notify("Invalid Credentials", "error"); return;
    }
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!user || (user.password && user.password !== password)) {
      notify("Authentication Failed", "error"); return;
    }
    if (role === UserRole.EXAMINER && !user.isApproved) {
      notify("Faculty Pending Verification", "info"); return;
    }
    setActiveUser(user);
    notify(`Identity Verified: ${user.name}`, "success");
  };

  const handleSignUp = (data: any) => {
    const newUser = { ...data, id: `u-${Date.now()}`, isApproved: data.role === UserRole.STUDENT };
    setUsers(prev => [...prev, newUser]);
    notify("Identity Registered Successfully", "success");
  };

  const handleLogout = () => { setActiveUser(null); setIsExamActive(false); notify("Session Terminated", "info"); };
  const handleExitPortal = () => { setPortal(null); setActiveUser(null); setIsExamActive(false); };

  const handleStudentSubmit = async (answers: Answer[]) => {
    const exam = exams.find(e => e.departmentId === activeUser?.departmentId && !submissions.some(s => s.examId === e.id && s.studentId === activeUser?.id));
    if (!exam) return;
    const sub = { id: `sub-${Date.now()}`, examId: exam.id, studentId: activeUser!.id, studentName: activeUser!.name, submittedAt: new Date().toLocaleString(), status: 'PENDING' as any, answers };
    setSubmissions(prev => [sub, ...prev]);
    setIsExamActive(false);
    notify("Assessment Transmitted to Node", "success");
    try {
      const res = await gradeSubmission(exam, sub);
      const gradeRes = { id: `g-${Date.now()}`, submissionId: sub.id, examId: exam.id, questionGrades: res.questionGrades || [], finalGrade: res.finalGrade || 0, isPublished: false, gradingSource: 'AI' as any };
      setGradingResults(prev => [...prev, gradeRes]);
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'GRADED' } : s));
    } catch (e) { notify("AI Pending Faculty Review", "info"); }
  };

  const studentExams = activeUser?.role === UserRole.STUDENT ? exams.filter(e => e.departmentId === activeUser.departmentId && !submissions.some(s => s.examId === e.id && s.studentId === activeUser.id)) : [];
  const studentGrades = activeUser?.role === UserRole.STUDENT ? gradingResults.filter(r => r.isPublished && submissions.find(s => s.id === r.submissionId && s.studentId === activeUser.id)) : [];

  return (
    <>
      {notification && <Notification notification={notification} onClose={() => setNotification(null)} />}
      {showSync && <SyncHub onConnectNode={() => {}} currentNodeId={cloudNodeId} onClose={() => setShowSync(false)} />}
      {!portal && !activeUser ? (
        <div className={`min-h-screen flex items-center justify-center p-6 ${appTheme === 'slate' ? 'bg-slate-50' : appTheme === 'blue' ? 'bg-blue-50' : appTheme === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <div className="absolute top-6 right-6">
             <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border-2 border-emerald-500 shadow-sm">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Node: {CONSTANT_NODE_ID}</span>
             </div>
          </div>
          <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="md:col-span-3 mb-12">
               <div className="inline-block p-4 bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 mb-6"><BrandingLogo className="w-24 h-24" /></div>
               <h1 className="text-4xl font-black text-slate-900 uppercase mb-2">{BRANDING.NAME.split(' ')[0]} <span className="text-indigo-600">{BRANDING.NAME.split(' ').slice(1).join(' ')}</span></h1>
               <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">{BRANDING.SLOGAN}</p>
            </div>
            <button onClick={() => setPortal(UserRole.STUDENT)} className="group bg-white p-12 rounded-[3rem] border-2 border-slate-200 shadow-xl hover:border-emerald-500 transition-all transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase">Student</h3>
            </button>
            <button onClick={() => setPortal(UserRole.EXAMINER)} className="group bg-white p-12 rounded-[3rem] border-2 border-slate-200 shadow-xl hover:border-indigo-500 transition-all transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase">Examiner</h3>
            </button>
            <button onClick={() => setPortal(UserRole.ADMIN)} className="group bg-white p-12 rounded-[3rem] border-2 border-slate-200 shadow-xl hover:border-slate-900 transition-all transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-slate-100 text-slate-600 rounded-3xl mx-auto flex items-center justify-center mb-8 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-lg"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase">Admin</h3>
            </button>
          </div>
        </div>
      ) : !activeUser ? (
        <Login portalType={portal!} institutes={institutes} departments={departments} users={users} onLogin={handleLogin} onSignUp={handleSignUp} onResetPassword={() => {}} onBack={handleExitPortal} notify={notify} />
      ) : (
        <Layout role={activeUser.role} userName={activeUser.name} onRoleSwitch={handleLogout} appTheme={appTheme} onSetTheme={setAppTheme} onOpenSync={() => setShowSync(true)}>
          <div className="fixed bottom-6 right-6 z-[100] flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl scale-75 md:scale-100 origin-bottom-right transition-all duration-300">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{isSyncing ? 'Transmitting...' : 'Link Active'}</span>
          </div>
          {activeUser.role === UserRole.ADMIN && <AdminDashboard institutes={institutes} departments={departments} users={users} onAddDepartment={d => setDepartments([...departments, d])} onDeleteDepartment={id => setDepartments(prev => prev.filter(d => d.id !== id))} onApproveUser={id => setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u))} onDeclineUser={id => setUsers(prev => prev.filter(u => u.id !== id))} onDeleteUser={id => setUsers(prev => prev.filter(u => u.id !== id))} />}
          {activeUser.role === UserRole.EXAMINER && <ExaminerDashboard examiner={activeUser} exams={exams.filter(e => e.examinerId === activeUser.id)} submissions={submissions.filter(s => exams.find(e => e.id === s.examId && e.examinerId === activeUser.id))} onGradeRequest={() => {}} onSaveExam={e => setExams([...exams, e])} onDeleteExam={id => setExams(prev => prev.filter(e => e.id !== id))} onPublishResult={id => setGradingResults(prev => prev.map(r => r.submissionId === id ? { ...r, isPublished: true } : r))} onSaveManualGrade={res => { setGradingResults(prev => [...prev.filter(r => r.submissionId !== res.submissionId), res]); setSubmissions(prev => prev.map(s => s.id === res.submissionId ? { ...s, status: 'GRADED' } : s)); }} results={gradingResults} />}
          {activeUser.role === UserRole.STUDENT && (!isExamActive ? (
            <div className="max-w-4xl mx-auto py-10 space-y-12">
               <div className="text-center space-y-6">
                  <div className="bg-white h-32 w-32 rounded-[32px] mx-auto flex items-center justify-center shadow-2xl border-2 border-slate-200 p-4"><BrandingLogo className="w-full h-full" /></div>
                  <h1 className="text-5xl font-black text-slate-900 uppercase">Greetings, <span className="text-emerald-600">{activeUser.name}</span></h1>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[40px] border-2 border-slate-200 shadow-xl space-y-8 h-full">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Assignment Queue</h3>
                     {studentExams.length > 0 ? (
                       <div className="space-y-6">
                         <p className="text-xl font-black text-slate-900 uppercase leading-tight">{studentExams[0].title}</p>
                         <button onClick={() => setIsExamActive(true)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-[10px]">Enter Exam Hall</button>
                       </div>
                     ) : <p className="text-slate-400 font-bold italic text-sm">No pending assessments.</p>}
                  </div>
                  <div className="bg-white p-10 rounded-[40px] border-2 border-slate-200 shadow-xl space-y-8 h-full">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Academic Records</h3>
                     <div className="space-y-4">
                       {studentGrades.map(res => (
                         <div key={res.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                           <p className="font-bold text-slate-900 text-sm">{exams.find(e => e.id === res.examId)?.title}</p>
                           <span className="text-xl font-black text-emerald-600">{res.finalGrade}%</span>
                         </div>
                       ))}
                     </div>
                  </div>
               </div>
            </div>
          ) : <StudentExam exam={studentExams[0]} onSubmit={handleStudentSubmit} notify={notify} />)}
        </Layout>
      )}
    </>
  );
};

export default App;
