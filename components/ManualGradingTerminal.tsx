
import React, { useState } from 'react';
import { Exam, Submission, QuestionGrade, GradingResult, QuestionType } from '../types';

interface ManualGradingTerminalProps {
  exam: Exam;
  submission: Submission;
  onSave: (result: GradingResult) => void;
  onCancel: () => void;
}

const ManualGradingTerminal: React.FC<ManualGradingTerminalProps> = ({ exam, submission, onSave, onCancel }) => {
  const [questionScores, setQuestionScores] = useState<Record<string, number>>(
    submission.answers.reduce((acc, ans) => ({ ...acc, [ans.questionId]: 0 }), {})
  );
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, string>>(
    submission.answers.reduce((acc, ans) => ({ ...acc, [ans.questionId]: '' }), {})
  );

  const calculateFinalGrade = () => {
    const totalPossible = exam.questions.reduce((sum, q) => sum + q.maxPoints, 0);
    const totalEarned = Object.values(questionScores).reduce((sum, s) => sum + s, 0);
    return Math.round((totalEarned / totalPossible) * 100);
  };

  const handleSubmit = () => {
    const questionGrades: QuestionGrade[] = exam.questions.map(q => ({
      questionId: q.id,
      totalScore: questionScores[q.id] || 0,
      overallFeedback: questionFeedback[q.id] || '',
      uncertaintyFlag: false,
      criteriaGrades: [] // Manual grading uses a simplified per-question model
    }));

    const result: GradingResult = {
      id: `grade-manual-${Date.now()}`,
      submissionId: submission.id,
      examId: exam.id,
      questionGrades,
      finalGrade: calculateFinalGrade(),
      isPublished: false,
      reviewedBy: 'Examiner',
      gradingSource: 'MANUAL'
    };

    onSave(result);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-in fade-in duration-300">
      <header className="bg-white border-b-2 border-slate-200 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Manual Assessment Terminal</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate: {submission.studentName} • {exam.title}</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Score</p>
            <p className="text-2xl font-black text-indigo-600">{calculateFinalGrade()}%</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={onCancel} className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20">Commit Grade</button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-12 max-w-5xl mx-auto w-full">
        {exam.questions.map((q, idx) => {
          const answer = submission.answers.find(a => a.questionId === q.id);
          return (
            <div key={q.id} className="bg-white rounded-[2.5rem] border-2 border-slate-700/10 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 border-r border-slate-100 bg-slate-50/30">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">Question {idx + 1}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight: {q.maxPoints} pts</span>
                </div>
                <p className="text-slate-900 font-bold text-lg mb-6 leading-tight">{q.text}</p>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Response</p>
                  <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl min-h-[100px] text-slate-700 font-medium whitespace-pre-wrap italic">
                    {answer?.text || (answer?.audioData ? '[Voice Data Provided]' : 'No response recorded.')}
                  </div>
                  {answer?.audioData && (
                    <audio controls src={answer.audioData} className="w-full mt-4" />
                  )}
                </div>
              </div>

              <div className="md:w-1/2 p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assign Score (Max {q.maxPoints})</label>
                  <input 
                    type="number" 
                    max={q.maxPoints} 
                    min={0}
                    value={questionScores[q.id]}
                    onChange={(e) => setQuestionScores({...questionScores, [q.id]: Math.min(q.maxPoints, Math.max(0, parseInt(e.target.value) || 0))})}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl px-5 py-4 text-2xl font-black text-indigo-600 outline-none focus:border-indigo-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Examiner Feedback</label>
                  <textarea 
                    value={questionFeedback[q.id]}
                    onChange={(e) => setQuestionFeedback({...questionFeedback, [q.id]: e.target.value})}
                    placeholder="Provide justification for the score..."
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default ManualGradingTerminal;
