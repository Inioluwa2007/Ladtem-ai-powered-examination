import React, { useState, useEffect } from 'react';
import { UserRole, Exam, Submission, GradingResult, Answer, User, Department } from './types';
import Layout from './components/Layout';
import ExaminerDashboard from './components/ExaminerDashboard';
import StudentExam from './components/StudentExam';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { gradeSubmission } from './services/geminiService';
import { BRANDING } from './constants/branding';

const CENTRAL_ADMIN_EMAIL = 'ladtemcommision@gmail.com';
const CENTRAL_ADMIN_PASSWORD = 'ladtem';

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

// Enhanced Branding Logo with improved retry logic for different asset paths
export const BrandingLogo: React.FC<{ className?: string }> = ({ className }) => {
  const [error, setError] = useState(false);
  const [src, setSrc] = useState(BRANDING.LOGO_SRC);
  
  const handleLogoError = () => {
    // Try different common pathing conventions if the primary one fails
    if (src === BRANDING.LOGO_SRC) {
      // If 'logo.jpg' failed, try './logo.jpg'
      setSrc(`./${BRANDING.LOGO_SRC}`);
    } else if (src === `./${BRANDING.LOGO_SRC}`) {
      // If './logo.jpg' failed, try root absolute '/logo.jpg'
      setSrc(`/${BRANDING.LOGO_SRC}`);
    } else {
      // All standard attempts failed
      console.warn("LADTEM: Failed to load logo from all standard paths.");
      setError(true);
    }
  };

  if (error) {
    return (
      <div className={`${className} bg-slate-100 flex flex-col items-center justify-center text-slate-400 border-2 border-slate-200 rounded-3xl`}>
        <svg className="w-1/2 h-1/2 opacity-20" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">LADTEM</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={BRANDING.NAME} 
      className={`${className} transition-opacity duration-300`} 
      onError={handleLogoError} 
    />
  );
};

const App: React.FC = () => {
  const [portal, setPortal] = useState<UserRole | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingResults, setGradingResults] = useState<GradingResult[]>([]);
  const [isExamActive, setIsExamActive] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>('slate');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  const handleLogin = ({ email, password, role }: { email: string; password: string; role: UserRole }) => {
    if (role === UserRole.ADMIN) {
      if (email.toLowerCase() === CENTRAL_ADMIN_EMAIL.toLowerCase() && password === CENTRAL_ADMIN_PASSWORD) {
         setActiveUser({ id: 'admin-001', name: 'Central Admin', email: CENTRAL_ADMIN_EMAIL, role: UserRole.ADMIN, isApproved: true });
         notify("Administrative Access Granted", "success");
         return;
      }
      notify("Access Denied: Unrecognized Administrative Credential.", "error");
      return;
    }
    
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!existingUser) {
      notify("Portal Error: Identity not found. Please register.", "error");
      return;
    }
    if (existingUser.password && existingUser.password !== password) {
      notify("Authentication Failed: Invalid credentials provided.", "error");
      return;
    }
    if (role === UserRole.EXAMINER && !existingUser.isApproved) {
      notify("Faculty Status: Awaiting Central Commission verification.", "info");
      return;
    }
    setActiveUser(existingUser);
    notify(`Welcome back, ${existingUser.name}`, "success");
  };

  const handleSignUp = ({ name, email, password, role, departmentId }: { name: string; email: string; password?: string; role: UserRole; departmentId: string }) => {
    if (role === UserRole.ADMIN) return;
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role)) {
      notify("Registration Error: Email already registered.", "error");
      return;
    }
    const newUser: User = { id: `u-${Date.now()}`, name, email, password, role, departmentId, isApproved: role === UserRole.STUDENT };
    setUsers(prev => [...prev, newUser]);
    notify(role === UserRole.EXAMINER ? "Faculty application received." : "Identity Registered Successfully", "success");
  };

  const handleResetPassword = (email: string, role: UserRole, newPassword: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!user) {
      notify("Reset Failed: User record not found.", "error");
      return;
    }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, password: newPassword } : u));
    notify("Password successfully updated. Please sign in.", "success");
  };

  const handleLogout = () => { setActiveUser(null); setIsExamActive(false); notify("Identity Logged Out", "info"); };
  const handleExitPortal = () => { setPortal(null); setActiveUser(null); setIsExamActive(false); };

  const handleStudentSubmit = async (answers: Answer[]) => {
    const studentExamsList = exams.filter(e => e.departmentId === activeUser?.departmentId && !submissions.some(s => s.examId === e.id && s.studentId === activeUser?.id));
    if (studentExamsList.length === 0) return;
    
    const exam = studentExamsList[0];
    const newSubmission: Submission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      studentId: activeUser?.id || 'anonymous',
      studentName: activeUser?.name || 'Anonymous Student',
      submittedAt: new Date().toLocaleString(),
      status: 'PENDING',
      answers
    };
    
    setSubmissions(prev => [newSubmission, ...prev]);
    setIsExamActive(false);
    notify("Assessment Transmitted Successfully", "success");

    try {
      const result = await gradeSubmission(exam, newSubmission);
      const gradingResult: GradingResult = { ...result, isPublished: false };
      setGradingResults(prev => [...prev, gradingResult]);
      setSubmissions(prev => prev.map(s => s.id === newSubmission.id ? { ...s, status: 'GRADED' } : s));
    } catch (e) {
      notify("AI evaluation failed, examiner will grade manually.", "error");
    }
  };

  const handlePublishResult = (submissionId: string) => {
    setGradingResults(prev => prev.map(res => res.submissionId === submissionId ? { ...res, isPublished: true } : res));
    notify("Grade released to student portal.", "success");
  };

  const handleDeleteExam = (examId: string) => {
    setExams(prev => prev.filter(e => e.id !== examId));
    notify("Exam decommissioned from infrastructure.", "info");
  };

  const handleDeleteDepartment = (deptId: string) => {
    setDepartments(prev => prev.filter(d => d.id !== deptId));
    setUsers(prev => prev.map(u => u.departmentId === deptId ? { ...u, departmentId: undefined } : u));
    notify("Department unit purged from infrastructure.", "info");
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    notify("Identity record terminated.", "info");
  };

  const studentExams = activeUser?.role === UserRole.STUDENT 
    ? exams.filter(e => e.departmentId === activeUser.departmentId && !submissions.some(s => s.examId === e.id && s.studentId === activeUser.id))
    : [];

  const studentGrades = activeUser?.role === UserRole.STUDENT
    ? gradingResults.filter(r => r.isPublished && submissions.find(s => s.id === r.submissionId && s.studentId === activeUser.id))
    : [];

  const bgClasses = { slate: 'bg-slate-50', blue: 'bg-blue-50', emerald: 'bg-emerald-50', rose: 'bg-rose-50' };

  return (
    <>
      {notification && <Notification notification={notification} onClose={() => setNotification(null)} />}
      {!portal ? (
        <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${bgClasses[appTheme]}`}>
          <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="md:col-span-3 mb-12">
               <div className="inline-block p-4 bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 mb-6">
                  <BrandingLogo className="w-24 h-24 object-contain" />
               </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">{BRANDING.NAME.split(' ')[0]} <span className="text-indigo-600">{BRANDING.NAME.split(' ').slice(1).join(' ')}</span></h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">{BRANDING.SLOGAN}</p>
            </div>
            <button onClick={() => setPortal(UserRole.STUDENT)} className="group bg-white p-12 rounded-[3rem] border-2 border-slate-200 shadow-xl hover:border-emerald-500 transition-all text-center transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg shadow-emerald-50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Student</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Testing Portal</p>
            </button>
            <button onClick={() => setPortal(UserRole.EXAMINER)} className="group bg-white p-12 rounded-[3rem] border-2 border-slate-200 shadow-xl hover:border-indigo-500 transition-all text-center transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Examiner</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Faculty Access</p>
            </button>
            <button onClick={() => setPortal(UserRole.ADMIN)} className="group bg-white p-12 rounded-[3rem] border-2 border-slate-200 shadow-xl hover:border-slate-900 transition-all text-center transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-slate-100 text-slate-600 rounded-3xl mx-auto flex items-center justify-center mb-8 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-lg shadow-slate-100">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Admin</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Commission Oversight</p>
            </button>
          </div>
        </div>
      ) : !activeUser ? (
        <Login 
          portalType={portal} 
          departments={departments} 
          users={users}
          onLogin={handleLogin} 
          onSignUp={handleSignUp} 
          onResetPassword={handleResetPassword}
          onBack={handleExitPortal} 
          notify={notify} 
        />
      ) : (
        <Layout role={activeUser.role} onRoleSwitch={handleLogout} appTheme={appTheme} onSetTheme={setAppTheme}>
          {activeUser.role === UserRole.ADMIN && (
            <AdminDashboard 
              departments={departments} 
              users={users} 
              onAddDepartment={(d) => { setDepartments([...departments, d]); notify("Department Deployed", "success"); }} 
              onDeleteDepartment={handleDeleteDepartment}
              onApproveUser={(id) => { setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u)); notify("Faculty Approved", "success"); }} 
              onDeclineUser={(id) => { setUsers(prev => prev.filter(u => u.id !== id)); notify("Faculty Record Discarded", "info"); }} 
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeUser.role === UserRole.EXAMINER && (
            <ExaminerDashboard 
              examiner={activeUser}
              exams={exams.filter(e => e.examinerId === activeUser.id)} 
              submissions={submissions.filter(s => exams.find(e => e.id === s.examId && e.examinerId === activeUser.id))}
              onGradeRequest={() => {}} 
              onSaveExam={(e) => { setExams([...exams, e]); notify("Examination Published", "success"); }}
              onDeleteExam={handleDeleteExam}
              onPublishResult={handlePublishResult}
              results={gradingResults}
            />
          )}

          {activeUser.role === UserRole.STUDENT && (
            !isExamActive ? (
              <div className="max-w-4xl mx-auto py-10 space-y-12">
                 <div className="text-center space-y-6">
                    <div className="bg-white h-32 w-32 rounded-[32px] mx-auto flex items-center justify-center shadow-2xl transform -rotate-6 border-2 border-slate-200 p-4">
                      <BrandingLogo className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Greetings, <span className="text-emerald-600">{activeUser.name}</span></h1>
                      <p className="text-slate-400 text-sm font-black uppercase tracking-[0.3em]">{departments.find(d => d.id === activeUser.departmentId)?.name || 'General Admission'}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border-2 border-slate-200 shadow-xl space-y-8 h-full">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Assignment Queue</h3>
                       {studentExams.length > 0 ? (
                         <div className="space-y-6">
                           <div className="space-y-2">
                             <p className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{studentExams[0].title}</p>
                             <p className="text-xs text-slate-500 font-bold">{studentExams[0].description}</p>
                           </div>
                           <button onClick={() => setIsExamActive(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-3xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">Enter Exam Hall</button>
                         </div>
                       ) : <p className="text-slate-400 font-bold italic text-sm">No active assessments pending.</p>}
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border-2 border-slate-200 shadow-xl space-y-8 h-full">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Academic Records</h3>
                       <div className="space-y-4">
                         {studentGrades.length > 0 ? studentGrades.map(res => {
                           const exam = exams.find(e => e.id === res.examId);
                           return (
                             <div key={res.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                               <div>
                                 <p className="font-bold text-slate-900 text-sm">{exam?.title}</p>
                                 <p className="text-[10px] text-slate-400 font-black uppercase">Released by Faculty</p>
                               </div>
                               <div className="text-right">
                                 <span className="text-xl font-black text-emerald-600">{res.finalGrade}%</span>
                               </div>
                             </div>
                           )
                         }) : <p className="text-slate-400 font-bold italic text-sm">No released grades found.</p>}
                       </div>
                    </div>
                 </div>
              </div>
            ) : (
              studentExams.length > 0 ? <StudentExam exam={studentExams[0]} onSubmit={handleStudentSubmit} notify={notify} /> : <div>Exam missing.</div>
            )
          )}
        </Layout>
      )}
    </>
  );
};

export default App;