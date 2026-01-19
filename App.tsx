
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate, Link } from 'react-router-dom';
import { UserRole, Exam, Submission, GradingResult, Answer, User, Department, Institute, AppTheme } from './types';
import Layout from './components/Layout';
import ExaminerDashboard from './components/ExaminerDashboard';
import StudentExam from './components/StudentExam';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import SyncHub from './components/SyncHub';
import { gradeSubmission } from './services/geminiService';
import { fetchFromCloud, syncToCloud, mergeStates } from './services/cloudSyncService';
import { BRANDING } from './constants/branding';
import { BrandingLogo } from './components/Branding';

const CENTRAL_ADMIN_EMAIL = 'ladtemcommision@gmail.com';
const CENTRAL_ADMIN_PASSWORD = 'ladtem';

const STORAGE_KEYS = {
  NODE_ID: 'ig_node_id',
  BLOB_URL: 'ig_blob_url',
  INSTITUTES: 'ig_institutes',
  DEPARTMENTS: 'ig_departments',
  USERS: 'ig_users',
  EXAMS: 'ig_exams',
  SUBMISSIONS: 'ig_submissions',
  RESULTS: 'ig_results',
  ACTIVE_USER: 'ig_active_user',
  THEME: 'ig_theme'
};

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

const INITIAL_INSTITUTES: Institute[] = [
  { id: 'inst-1', name: 'Discipleship Film and Media Institute' },
  { id: 'inst-2', name: 'Institute of Entrepreneurship Study and Research' },
  { id: 'inst-3', name: 'Research Plus' }
];

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', instituteId: 'inst-1', name: 'Cinematography & Directing', code: 'CFM-101', description: 'Advanced film production and visual storytelling.' },
  { id: 'dept-2', instituteId: 'inst-2', name: 'Business Innovation', code: 'BIE-202', description: 'Modern entrepreneurship strategies and R&D.' }
];

const LandingPage: React.FC<{ nodeId: string; cloudStatus: string; onOpenSync: () => void; appTheme: AppTheme }> = ({ nodeId, cloudStatus, onOpenSync, appTheme }) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${appTheme === 'slate' ? 'bg-slate-50' : appTheme === 'blue' ? 'bg-blue-50' : appTheme === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
      <div className="absolute top-6 right-6 flex flex-col items-end space-y-2">
         <button onClick={onOpenSync} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border-2 border-slate-200 shadow-sm hover:border-indigo-500 transition-all opacity-40 hover:opacity-100">
           <div className={`w-2.5 h-2.5 rounded-full ${cloudStatus === 'READY' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">NODE: {nodeId}</span>
         </button>
      </div>
      
      <div className="max-w-2xl w-full text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-12">
           <div className="inline-block p-8 bg-white rounded-[3.5rem] shadow-2xl border-2 border-slate-200 mb-8 transform -rotate-2 hover:rotate-0 transition-all duration-500"><BrandingLogo className="w-32 h-32" /></div>
           <h1 className="text-6xl font-black text-slate-900 uppercase mb-4 tracking-tighter">LADTEM <span className="text-indigo-600">COMMISSION</span></h1>
           <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">{BRANDING.SLOGAN}</p>
        </div>
        
        <div className="flex justify-center">
          <Link to="/student-login" className="group bg-white p-12 w-full max-w-sm rounded-[4rem] border-2 border-slate-200 shadow-2xl hover:border-emerald-500 transition-all transform hover:-translate-y-3 no-underline text-inherit block">
            <div className="w-28 h-28 bg-emerald-50 text-emerald-600 rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xl">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Student Portal</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Entry Only</p>
          </Link>
        </div>
        
        <div className="mt-20 flex flex-col items-center space-y-4">
          <div className="w-16 h-1 bg-slate-200 rounded-full"></div>
          <p className="text-slate-300 font-black text-[9px] uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} LADTEM COMMISSION • UNIVERSAL NEURAL SYNC
          </p>
          <div className="opacity-0 hover:opacity-10 text-[8px] font-black text-slate-400 flex space-x-4 uppercase tracking-widest transition-opacity">
            <span>Hidden paths: /examiner-login • /admin-login</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  
  const [nodeId, setNodeId] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEYS.NODE_ID) || 'LADTEM-GLOBAL'; } catch { return 'LADTEM-GLOBAL'; }
  });
  const [blobUrl, setBlobUrl] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEYS.BLOB_URL) || ''; } catch { return ''; }
  });
  const [isSyncHubOpen, setIsSyncHubOpen] = useState(false);

  const [institutes, setInstitutes] = useState<Institute[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSTITUTES);
    try { return saved ? JSON.parse(saved) : INITIAL_INSTITUTES; } catch { return INITIAL_INSTITUTES; }
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    try { return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS; } catch { return INITIAL_DEPARTMENTS; }
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXAMS);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [gradingResults, setGradingResults] = useState<GradingResult[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESULTS);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  const [activeUser, setActiveUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [appTheme, setAppTheme] = useState<AppTheme>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme) || 'slate');

  const [isExamActive, setIsExamActive] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'IDLE' | 'PULLING' | 'READY' | 'ERROR'>('IDLE');
  
  const isInternalUpdate = useRef(false);
  const hasInitialPullCompleted = useRef(false);
  const lastSyncChecksum = useRef<number>(0);
  const isSyncing = useRef(false);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  }, []);

  const triggerPush = useCallback(async () => {
    if (!hasInitialPullCompleted.current || isInternalUpdate.current) return;
    const currentState = { institutes, departments, users, exams, submissions, gradingResults };
    const checksum = JSON.stringify(currentState).length;
    if (checksum === lastSyncChecksum.current) return;
    
    isSyncing.current = true;
    const mergedState = await syncToCloud(nodeId, currentState, blobUrl);
    if (mergedState) {
      isInternalUpdate.current = true;
      setInstitutes(mergedState.institutes);
      setDepartments(mergedState.departments);
      setUsers(mergedState.users);
      setExams(mergedState.exams);
      setSubmissions(mergedState.submissions);
      setGradingResults(mergedState.gradingResults);
      lastSyncChecksum.current = JSON.stringify(mergedState).length;
      setTimeout(() => { isInternalUpdate.current = false; }, 500);
    }
    isSyncing.current = false;
  }, [nodeId, blobUrl, institutes, departments, users, exams, submissions, gradingResults]);

  const triggerPull = useCallback(async (silent = false) => {
    if (!silent) setCloudStatus('PULLING');
    isSyncing.current = true;
    const cloudState = await fetchFromCloud(nodeId, blobUrl);
    if (cloudState) {
      const currentState = { institutes, departments, users, exams, submissions, gradingResults };
      const merged = mergeStates(currentState, cloudState);
      
      setDepartments(merged.departments);
      setUsers(merged.users);
      setInstitutes(merged.institutes);
      setExams(merged.exams);
      setSubmissions(merged.submissions);
      setGradingResults(merged.gradingResults);
      
      if (!silent) notify("Neural Sync Refreshed", "success");
    }
    hasInitialPullCompleted.current = true;
    setCloudStatus('READY');
    isSyncing.current = false;
  }, [nodeId, blobUrl, notify, institutes, departments, users, exams, submissions, gradingResults]);

  useEffect(() => {
    triggerPull();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') triggerPull(true);
    }, 10000); // 10s for better simultaneous feel
    return () => clearInterval(interval);
  }, [triggerPull]);

  useEffect(() => {
    if (!hasInitialPullCompleted.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.INSTITUTES, JSON.stringify(institutes));
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(gradingResults));
      localStorage.setItem(STORAGE_KEYS.NODE_ID, nodeId);
      localStorage.setItem(STORAGE_KEYS.BLOB_URL, blobUrl);
      localStorage.setItem(STORAGE_KEYS.THEME, appTheme);
    } catch (e) { console.error("Persistence error", e); }
    const timer = setTimeout(() => { triggerPush(); }, 1000); 
    return () => clearTimeout(timer);
  }, [institutes, departments, users, exams, submissions, gradingResults, nodeId, blobUrl, appTheme, triggerPush]);

  const handleLogin = ({ email, password, role }: any) => {
    if (role === UserRole.ADMIN) {
      if (email.toLowerCase() === CENTRAL_ADMIN_EMAIL.toLowerCase() && password === CENTRAL_ADMIN_PASSWORD) {
         const adminUser = { id: 'admin-001', name: 'Central Admin', email: CENTRAL_ADMIN_EMAIL, role: UserRole.ADMIN, isApproved: true };
         setActiveUser(adminUser);
         localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(adminUser));
         notify("Admin Session Started", "success");
         navigate('/dashboard');
         return;
      }
      notify("Invalid Admin Credentials", "error"); return;
    }
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!user || (user.password && user.password !== password)) {
      notify("Authentication Failed", "error"); 
      return;
    }
    if (role === UserRole.EXAMINER && !user.isApproved) {
      notify("Access Pending Verification", "info"); 
      return;
    }
    setActiveUser(user);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    notify(`Welcome, ${user.name}`, "success");
    navigate('/dashboard');
  };

  const handleSignUp = (data: any) => {
    const newUser = { 
      ...data, 
      email: data.email.toLowerCase(), 
      id: `u-${Date.now()}`, 
      isApproved: data.role === UserRole.STUDENT 
    };
    setUsers(prev => [...prev, newUser]);
    notify("Identity Registered Successfully.", "success");
    setTimeout(() => triggerPush(), 500);
  };

  const handleStudentSubmit = async (answers: Answer[]) => {
    if (!activeUser) return;
    const exam = exams.find(e => 
      e.departmentId === activeUser.departmentId && 
      !submissions.some(s => s.examId === e.id && s.studentId === activeUser.id)
    );
    if (!exam) return;
    const newSubmission: Submission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      studentId: activeUser.id,
      studentName: activeUser.name,
      answers,
      submittedAt: new Date().toLocaleString(),
      status: 'PENDING'
    };
    setSubmissions(prev => [...prev, newSubmission]);
    setIsExamActive(false);
    notify("Assessment Transmitted Successfully.", "success");
    try {
      const grading = await gradeSubmission(exam, newSubmission);
      if (grading) {
        const result: GradingResult = {
          id: `res-${Date.now()}`,
          submissionId: newSubmission.id,
          examId: exam.id,
          questionGrades: grading.questionGrades || [],
          finalGrade: grading.finalGrade || 0,
          isPublished: false,
          reviewedBy: 'AI Node',
          gradingSource: 'AI'
        };
        setGradingResults(prev => [...prev, result]);
        setSubmissions(prev => prev.map(s => s.id === newSubmission.id ? { ...s, status: 'GRADED' } : s));
        notify("AI Evaluation Node Processed Results.", "success");
      }
    } catch (err) {
      notify("AI evaluation delay. Manual review recommended.", "error");
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    setActiveUser(null); 
    setIsExamActive(false); 
    notify("Session Logged Out", "info");
    navigate('/');
  };

  return (
    <>
      {notification && <Notification notification={notification} onClose={() => setNotification(null)} />}
      
      {isSyncHubOpen && (
        <SyncHub 
          currentNodeId={nodeId} 
          onConnectNode={(id) => { 
            setNodeId(id); 
            hasInitialPullCompleted.current = false; 
            triggerPull(); 
            notify(`Switching to Node: ${id}`, "info");
          }} 
          onManualSync={() => triggerPull(false)}
          onClose={() => setIsSyncHubOpen(false)} 
          isSyncing={isSyncing.current}
        />
      )}

      <Routes>
        <Route path="/" element={<LandingPage nodeId={nodeId} cloudStatus={cloudStatus} onOpenSync={() => setIsSyncHubOpen(true)} appTheme={appTheme} />} />
        
        <Route path="/student-login" element={<Login portalType={UserRole.STUDENT} institutes={institutes} departments={departments} users={users} onLogin={handleLogin} onSignUp={handleSignUp} onResetPassword={() => {}} onBack={() => navigate('/')} notify={notify} />} />
        <Route path="/examiner-login" element={<Login portalType={UserRole.EXAMINER} institutes={institutes} departments={departments} users={users} onLogin={handleLogin} onSignUp={handleSignUp} onResetPassword={() => {}} onBack={() => navigate('/')} notify={notify} />} />
        <Route path="/admin-login" element={<Login portalType={UserRole.ADMIN} institutes={institutes} departments={departments} users={users} onLogin={handleLogin} onSignUp={handleSignUp} onResetPassword={() => {}} onBack={() => navigate('/')} notify={notify} />} />

        <Route path="/dashboard" element={
          activeUser ? (
            <Layout role={activeUser.role} userName={activeUser.name} onRoleSwitch={handleLogout} appTheme={appTheme} onSetTheme={setAppTheme} onOpenSync={() => setIsSyncHubOpen(true)}>
              {activeUser.role === UserRole.ADMIN && (
                <AdminDashboard 
                  institutes={institutes} 
                  departments={departments} 
                  users={users} 
                  onAddDepartment={d => { setDepartments(prev => [...prev, d]); setTimeout(() => triggerPush(), 500); }} 
                  onDeleteDepartment={id => { setDepartments(prev => prev.filter(d => d.id !== id)); setTimeout(() => triggerPush(), 500); }} 
                  onApproveUser={id => { setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u)); setTimeout(() => triggerPush(), 500); }} 
                  onDeclineUser={id => { setUsers(prev => prev.filter(u => u.id !== id)); setTimeout(() => triggerPush(), 500); }} 
                  onDeleteUser={id => { setUsers(prev => prev.filter(u => u.id !== id)); setTimeout(() => triggerPush(), 500); }} 
                  onUpdateBlobConfig={setBlobUrl}
                  blobConfigUrl={blobUrl}
                  exams={exams}
                  submissions={submissions}
                  gradingResults={gradingResults}
                />
              )}
              {activeUser.role === UserRole.EXAMINER && <ExaminerDashboard examiner={activeUser} exams={exams.filter(e => e.examinerId === activeUser.id)} submissions={submissions.filter(s => exams.find(e => e.id === s.examId && e.examinerId === activeUser.id))} onGradeRequest={() => {}} onSaveExam={e => { setExams(prev => [...prev, e]); setTimeout(() => triggerPush(), 500); }} onDeleteExam={id => { setExams(prev => prev.filter(e => e.id !== id)); setTimeout(() => triggerPush(), 500); }} onPublishResult={id => { setGradingResults(prev => prev.map(r => r.submissionId === id ? { ...r, isPublished: true } : r)); setTimeout(() => triggerPush(), 500); }} onSaveManualGrade={res => { setGradingResults(prev => [...prev.filter(r => r.submissionId !== res.submissionId), res]); setSubmissions(prev => prev.map(s => s.id === res.submissionId ? { ...s, status: 'GRADED' } : s)); setTimeout(() => triggerPush(), 500); }} results={gradingResults} />}
              {activeUser.role === UserRole.STUDENT && (!isExamActive ? (
                <div className="max-w-4xl mx-auto py-10 space-y-12">
                   <div className="text-center space-y-6">
                      <div className="bg-white h-32 w-32 rounded-[32px] mx-auto flex items-center justify-center shadow-2xl border-2 border-slate-200 p-4"><BrandingLogo className="w-full h-full" /></div>
                      <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Welcome, <span className="text-emerald-600">{activeUser.name}</span></h1>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Node ID: {nodeId}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-10 rounded-[40px] border-2 border-slate-200 shadow-xl space-y-8 h-full">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Assigned Assessments</h3>
                         {exams.filter(e => e.departmentId === activeUser.departmentId && !submissions.some(s => s.examId === e.id && s.studentId === activeUser.id)).length > 0 ? (
                           <div className="space-y-6">
                             <p className="text-xl font-black text-slate-900 uppercase leading-tight">{exams.filter(e => e.departmentId === activeUser.departmentId && !submissions.some(s => s.examId === e.id && s.studentId === activeUser.id))[0].title}</p>
                             <button onClick={() => setIsExamActive(true)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all">Start Examination</button>
                           </div>
                         ) : <p className="text-slate-400 font-bold italic text-sm text-center py-10">No pending assessments.</p>}
                      </div>
                      <div className="bg-white p-10 rounded-[40px] border-2 border-slate-200 shadow-xl space-y-8 h-full">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Academic Results</h3>
                         <div className="space-y-4">
                           {gradingResults.filter(r => r.isPublished && submissions.some(s => s.id === r.submissionId && s.studentId === activeUser.id)).length === 0 ? <p className="text-slate-400 font-bold italic text-sm text-center py-10">No grades released yet.</p> : gradingResults.filter(r => r.isPublished && submissions.some(s => s.id === r.submissionId && s.studentId === activeUser.id)).map(res => (
                             <div key={res.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                               <p className="font-bold text-slate-900 text-sm">{exams.find(e => e.id === res.examId)?.title}</p>
                               <span className="text-xl font-black text-emerald-600">{res.finalGrade}%</span>
                             </div>
                           ))}
                         </div>
                      </div>
                   </div>
                </div>
              ) : <StudentExam exam={exams.find(e => e.departmentId === activeUser.departmentId && !submissions.some(s => s.examId === e.id && s.studentId === activeUser.id))!} onSubmit={handleStudentSubmit} notify={notify} />)}
            </Layout>
          ) : <Navigate to="/" />
        } />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
