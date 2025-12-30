
import React, { useState } from 'react';
import { Exam, Question, RubricCriterion, User, QuestionType, QuestionOption } from '../types';

interface ExamCreatorProps {
  examiner: User;
  onSave: (exam: Exam) => void;
  onCancel: () => void;
}

const ExamCreator: React.FC<ExamCreatorProps> = ({ examiner, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', text: '', maxPoints: 50, type: QuestionType.ESSAY }
  ]);
  const [rubrics, setRubrics] = useState<RubricCriterion[]>([
    { id: 'r1', name: 'Critical Thinking', description: 'Evaluate clarity and depth.', maxPoints: 20 },
    { id: 'r2', name: 'Logic', description: 'Evaluate structural coherence.', maxPoints: 20 }
  ]);

  const addQuestion = () => setQuestions([...questions, { id: `q-${Date.now()}`, text: '', maxPoints: 10, type: QuestionType.ESSAY }]);
  const deleteQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== idx));
    }
  };

  const addRubric = () => setRubrics([...rubrics, { id: `r-${Date.now()}`, name: '', description: '', maxPoints: 10 }]);
  const deleteRubric = (idx: number) => {
    setRubrics(rubrics.filter((_, i) => i !== idx));
  };

  const updateQuestionType = (idx: number, type: QuestionType) => {
    const newQs = [...questions];
    newQs[idx].type = type;
    if (type === QuestionType.MCQ && !newQs[idx].options) {
      newQs[idx].options = [
        { id: 'opt-1', text: '', isCorrect: true },
        { id: 'opt-2', text: '', isCorrect: false }
      ];
    }
    setQuestions(newQs);
  };

  const addOption = (qIdx: number) => {
    const newQs = [...questions];
    if (newQs[qIdx].options) {
      newQs[qIdx].options!.push({ id: `opt-${Date.now()}`, text: '', isCorrect: false });
      setQuestions(newQs);
    }
  };

  const setCorrectOption = (qIdx: number, optIdx: number) => {
    const newQs = [...questions];
    if (newQs[qIdx].options) {
      newQs[qIdx].options = newQs[qIdx].options!.map((opt, i) => ({
        ...opt,
        isCorrect: i === optIdx
      }));
      setQuestions(newQs);
    }
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    const newQs = [...questions];
    if (newQs[qIdx].options) {
      newQs[qIdx].options![optIdx].text = text;
      setQuestions(newQs);
    }
  };

  const handleSave = () => {
    if (!title || questions.some(q => !q.text)) {
      alert("Please provide a title and text for all questions.");
      return;
    }
    onSave({
      id: `exam-${Date.now()}`,
      title,
      description,
      departmentId: examiner.departmentId || 'unknown',
      examinerId: examiner.id,
      questions,
      rubric: rubrics,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">New Assessment</h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Define questions and grading logic.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onCancel} className="px-6 py-3 rounded-2xl border-2 border-slate-400 font-black text-slate-600 hover:bg-white transition-all text-[10px] uppercase tracking-widest">Discard</button>
          <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest">Publish</button>
        </div>
      </div>

      <div className="space-y-8">
        <section className="bg-white p-10 rounded-[3rem] border-2 border-slate-300 shadow-xl space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Examination Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-400 rounded-2xl px-6 py-4 text-xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600" placeholder="e.g. Digital Sovereignty Finals" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Contextual Guidelines</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-400 rounded-2xl px-6 py-4 min-h-[120px] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600" placeholder="Instructions for candidates..." />
            </div>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border-2 border-slate-300 shadow-xl space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Items ({questions.length})</h2>
            <button onClick={addQuestion} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ Add New Question</button>
          </div>
          <div className="space-y-10">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-400 space-y-6 relative group">
                <button 
                  onClick={() => deleteQuestion(idx)}
                  className="absolute -top-3 -right-3 bg-rose-600 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Question #0{idx + 1}</span>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-300">
                      <button onClick={() => updateQuestionType(idx, QuestionType.ESSAY)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${q.type === QuestionType.ESSAY ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Essay</button>
                      <button onClick={() => updateQuestionType(idx, QuestionType.MCQ)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${q.type === QuestionType.MCQ ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>MCQ</button>
                      <button onClick={() => updateQuestionType(idx, QuestionType.VOICE)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${q.type === QuestionType.VOICE ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Voice</button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Weight</span>
                      <input type="number" value={q.maxPoints} onChange={e => { const n = [...questions]; n[idx].maxPoints = parseInt(e.target.value); setQuestions(n); }} className="w-16 bg-white border-2 border-slate-400 rounded-xl px-2 py-1.5 text-xs font-black text-indigo-600 text-center" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text</label>
                  <textarea value={q.text} onChange={e => { const n = [...questions]; n[idx].text = e.target.value; setQuestions(n); }} className="w-full bg-white border-2 border-slate-400 rounded-2xl px-6 py-4 font-bold text-slate-800 min-h-[80px] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600" placeholder="Ask your question..." />
                </div>

                {q.type === QuestionType.MCQ && q.options && (
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Options (Mark correct answer)</label>
                      <button onClick={() => addOption(idx)} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">+ Add Option</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id} className={`flex items-center space-x-3 p-3 bg-white rounded-xl border-2 transition-all ${opt.isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'}`}>
                          <input type="radio" name={`correct-${q.id}`} checked={opt.isCorrect} onChange={() => setCorrectOption(idx, optIdx)} className="w-4 h-4 text-emerald-600 border-2 border-slate-300 focus:ring-emerald-500" />
                          <input value={opt.text} onChange={(e) => updateOptionText(idx, optIdx, e.target.value)} className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-800 outline-none" placeholder={`Option ${optIdx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === QuestionType.VOICE && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center space-x-3">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Student will be required to record audio response.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border-2 border-slate-300 shadow-xl space-y-8">
           <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Grading Logic</h2>
            <button onClick={addRubric} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ New Criterion</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rubrics.map((r, idx) => (
              <div key={r.id} className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-400 space-y-4 relative">
                <button onClick={() => deleteRubric(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center space-x-3">
                  <input value={r.name} onChange={e => { const n = [...rubrics]; n[idx].name = e.target.value; setRubrics(n); }} className="flex-1 bg-white border-2 border-slate-400 rounded-xl px-4 py-3 text-sm font-black text-slate-900" placeholder="Criterion Name" />
                  <input type="number" value={r.maxPoints} onChange={e => { const n = [...rubrics]; n[idx].maxPoints = parseInt(e.target.value); setRubrics(n); }} className="w-20 bg-white border-2 border-slate-400 rounded-xl px-2 py-3 text-[10px] font-black text-indigo-600 text-center" />
                </div>
                <textarea value={r.description} onChange={e => { const n = [...rubrics]; n[idx].description = e.target.value; setRubrics(n); }} className="w-full bg-white border-2 border-slate-400 rounded-xl px-4 py-3 text-xs font-medium text-slate-600 min-h-[80px]" placeholder="Specific evaluation criteria..." />
              </div>
            ))}
            {rubrics.length === 0 && (
              <div className="col-span-full bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No detailed rubric. System will default to "Correct Answer" logic for grading.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExamCreator;
