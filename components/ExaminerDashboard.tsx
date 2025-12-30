
import React, { useState } from 'react';
import { Exam, Submission, GradingResult, User } from '../types';
import Analytics from './Analytics';
import ExamCreator from './ExamCreator';
import ManualGradingTerminal from './ManualGradingTerminal';

interface ExaminerDashboardProps {
  examiner: User;
  exams: Exam[];
  submissions: Submission[];
  onGradeRequest: (submission: Submission) => void;
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onPublishResult: (submissionId: string) => void;
  onSaveManualGrade: (result: GradingResult) => void;
  results: GradingResult[];
}

const ExaminerDashboard: React.FC<ExaminerDashboardProps> = ({ examiner, exams, submissions, onSaveExam, onDeleteExam, onPublishResult, onSaveManualGrade, results }) => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'analytics' | 'exams'>('submissions');
  const [isCreating, setIsCreating] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<{exam: Exam, sub: Submission} | null>(null);

  if (isCreating) {
    return (
      <ExamCreator 
        examiner={examiner}
        onSave={(exam) => { onSaveExam(exam); setIsCreating(false); setActiveTab('exams'); }}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  if (gradingSubmission) {
    return (
      <ManualGradingTerminal 
        exam={gradingSubmission.exam}
        submission={gradingSubmission.sub}
        onSave={(res) => {
          onSaveManualGrade(res);
          setGradingSubmission(null);
        }}
        onCancel={() => setGradingSubmission(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Welcome, {examiner.name}</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Faculty Management Node</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('submissions')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Submissions</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Analytics</button>
          <button onClick={() => setActiveTab('exams')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'exams' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Manage Exams</button>
        </div>
      </div>

      {activeTab === 'submissions' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Exam</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Grading Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {submissions.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold uppercase italic text-xs">No activity recorded.</td></tr>
                ) : (
                  submissions.map((sub) => {
                    const exam = exams.find(e => e.id === sub.examId);
                    const result = results.find(r => r.submissionId === sub.id);
                    const isUncertain = result?.questionGrades.some(q => q.uncertaintyFlag);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">
                              {sub.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base tracking-tight">{sub.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase">ID: {sub.id.substring(4, 12)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700">{exam?.title || 'Unknown Exam'}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase">{sub.submittedAt}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                             {result ? (
                               <div className="flex flex-col space-y-1">
                                 <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                                   Grade: {result.finalGrade}%
                                 </span>
                                 <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                                   Source: {result.gradingSource || 'AI'}
                                 </span>
                               </div>
                             ) : (
                               <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                                 AI Evaluating...
                               </span>
                             )}
                             {isUncertain && (
                               <span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-1 border border-red-200">
                                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                 <span>Flagged</span>
                               </span>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end space-y-2">
                            {result && !result.isPublished && (
                              <button 
                                onClick={() => onPublishResult(sub.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 w-32"
                              >
                                Release Grade
                              </button>
                            )}
                            {result?.isPublished && (
                              <div className="flex items-center space-x-2 text-emerald-600 px-4 py-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Released</span>
                              </div>
                            )}
                            <button 
                              onClick={() => exam && setGradingSubmission({exam, sub})}
                              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg w-32"
                            >
                              {result ? 'Edit Manual' : 'Grade Manually'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
             <div key={exam.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 hover:border-indigo-300 transition-all group shadow-sm flex flex-col justify-between h-56 relative">
                <button 
                  onClick={() => { if(confirm("Decommission this assessment from infrastructure?")) onDeleteExam(exam.id) }}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors p-2"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight pr-8">{exam.title}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(exam.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase pt-4 border-t-2 border-slate-50">
                  <span>{exam.questions.length} Items</span>
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100">Live</span>
                </div>
             </div>
          ))}
          <button 
            onClick={() => setIsCreating(true)}
            className="border-2 border-dashed border-slate-300 rounded-[2rem] p-8 hover:bg-slate-50 hover:border-indigo-400 transition-all group flex flex-col items-center justify-center text-center h-56"
          >
             <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
               <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             </div>
             <p className="font-black text-slate-600 group-hover:text-indigo-600 uppercase text-[10px] tracking-widest">New Assessment</p>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExaminerDashboard;
