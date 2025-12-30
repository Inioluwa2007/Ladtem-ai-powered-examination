
import React, { useState, useEffect, useRef } from 'react';
import { Exam, Answer, QuestionType } from '../types';

interface StudentExamProps {
  exam: Exam;
  onSubmit: (answers: Answer[]) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const StudentExam: React.FC<StudentExamProps> = ({ exam, onSubmit, notify }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [audioAnswers, setAudioAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [warnings, setWarnings] = useState(0);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(prev => prev + 1);
        notify("Warning: Tab switching detected. Event logged to Commission.", "error");
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(timer);
    };
  }, [notify]);

  const startRecording = async (questionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioAnswers(prev => ({ ...prev, [questionId]: base64Audio }));
          setIsRecording(null);
          notify("Voice response captured successfully.", "success");
        };
      };

      mediaRecorder.start();
      setIsRecording(questionId);
    } catch (err) {
      notify("Microphone access denied. Voice response unavailable.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isQuestionAnswered = (qId: string) => {
    const q = exam.questions.find(x => x.id === qId);
    if (!q) return false;
    if (q.type === QuestionType.VOICE) {
      return !!audioAnswers[qId];
    }
    return !!answers[qId] && answers[qId].trim().length > 0;
  };

  const scrollToQuestion = (qId: string) => {
    const element = questionRefs.current[qId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFinalSubmit = () => {
    const missing = exam.questions.filter(q => !isQuestionAnswered(q.id));
    if (missing.length > 0) {
      notify(`Attention: ${missing.length} questions remain unanswered.`, "info");
    }
    const submissionAnswers: Answer[] = exam.questions.map(q => ({
      questionId: q.id,
      text: answers[q.id] || (audioAnswers[q.id] ? '[Voice Recording Attached]' : ''),
      audioData: audioAnswers[q.id]
    }));
    onSubmit(submissionAnswers);
  };

  const answeredCount = exam.questions.filter(q => isQuestionAnswered(q.id)).length;

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 pb-32 relative select-none animate-in fade-in duration-700">
      
      {/* LEFT: Main Content */}
      <div className="flex-1 space-y-10">
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] flex items-center justify-between shadow-lg shadow-red-100/50">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-3 rounded-2xl">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m8-3V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div>
              <p className="text-red-900 font-black text-sm uppercase tracking-widest">Secure Node Active</p>
              <p className="text-red-700 text-[10px] font-bold uppercase tracking-widest mt-0.5">Proctoring Protocol Engaged.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Warnings</p>
            <p className="text-red-600 font-black text-2xl">{warnings}</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-300 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{exam.title}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{exam.description}</p>
          </div>
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-mono text-2xl flex items-center space-x-3 shadow-xl">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="space-y-10">
          {exam.questions.map((q, idx) => (
            <div 
              key={q.id} 
              // Added explicit block braces to ensure the ref callback returns void, fixing TypeScript assignment error
              ref={el => { questionRefs.current[q.id] = el; }}
              className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-300 shadow-2xl space-y-6 scroll-mt-24"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Question #0{idx + 1}</h3>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {q.maxPoints} pts
                </span>
              </div>
              <p className="text-slate-800 text-lg leading-relaxed font-bold">{q.text}</p>
              
              {q.type === QuestionType.ESSAY && (
                <textarea
                  className="w-full min-h-[300px] p-8 bg-slate-50 border-2 border-slate-400 rounded-[2.5rem] focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold leading-relaxed text-lg"
                  placeholder="Construct your response here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                  onPaste={(e) => { e.preventDefault(); notify("External data injection blocked.", "error"); }}
                />
              )}

              {q.type === QuestionType.MCQ && (
                <div className="space-y-4 pt-4">
                  {q.options?.map((opt) => (
                    <label 
                      key={opt.id} 
                      className={`flex items-center space-x-4 p-6 rounded-3xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${answers[q.id] === opt.text ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-300'}`}
                    >
                      <input 
                        type="radio" 
                        name={`answer-${q.id}`} 
                        value={opt.text}
                        checked={answers[q.id] === opt.text}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                        className="w-5 h-5 text-indigo-600 border-slate-400 focus:ring-indigo-500"
                      />
                      <span className="text-lg font-bold text-slate-800">{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === QuestionType.VOICE && (
                <div className="space-y-6 pt-4">
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
                    {audioAnswers[q.id] ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Audio Signal Captured</p>
                        <button onClick={() => startRecording(q.id)} className="text-[9px] font-black text-slate-400 uppercase underline">Re-record Signal</button>
                      </div>
                    ) : isRecording === q.id ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-12 flex items-end space-x-1">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-1.5 bg-rose-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                          ))}
                        </div>
                        <button onClick={stopRecording} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100 animate-bounce">Stop Recording</button>
                      </div>
                    ) : (
                      <button onClick={() => startRecording(q.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-10 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                    )}
                    {!audioAnswers[q.id] && !isRecording && (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hold space or click to record voice response.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Question Map (Sticky Sidebar) */}
      <div className="lg:w-72">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-300 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Map</h3>
              <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                {answeredCount}/{exam.questions.length} DONE
              </div>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-4 gap-3">
              {exam.questions.map((q, idx) => {
                const answered = isQuestionAnswered(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl text-xs font-black transition-all transform active:scale-90 shadow-sm ${
                      answered 
                        ? 'bg-indigo-600 text-white border-none' 
                        : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <div className="flex items-center space-x-3 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-md"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-white border border-slate-200 rounded-md"></div>
                  <span>Pending</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl space-y-4">
             <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Link Valid</span>
             </div>
             <p className="text-white font-bold text-xs">Ready to submit? Ensure all items are reviewed.</p>
             <button 
              onClick={handleFinalSubmit} 
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 text-[10px] uppercase tracking-widest"
             >
               Submit Terminal
             </button>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR (Fallback for small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t-2 border-slate-200 p-4 shadow-2xl z-[100] flex justify-between items-center px-6">
        <div className="flex items-center space-x-3">
           <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
             Progress: {answeredCount}/{exam.questions.length}
           </div>
           <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-indigo-600 transition-all duration-500" 
               style={{ width: `${(answeredCount / exam.questions.length) * 100}%` }}
             ></div>
           </div>
        </div>
        <button onClick={handleFinalSubmit} className="bg-slate-900 text-white font-black py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest shadow-lg">
          Submit
        </button>
      </div>
    </div>
  );
};

export default StudentExam;
