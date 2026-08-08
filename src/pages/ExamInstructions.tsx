import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Shield, Clock, BookOpen, CheckCircle, AlertCircle, PlayCircle, Monitor, User, ArrowLeft } from 'lucide-react';
import { Exam } from '@/src/types';
import { getApiUrl } from '@/src/lib/api-config';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/lib/ui/badge';

export default function ExamInstructions() {
  const { examId } = useParams<{ examId: string }>();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInstructions() {
      if (examId === 'unified' && !profile) return;

      try {
        const res = await fetch(getApiUrl('/exams'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const allExams: Exam[] = await res.json();
          if (examId === 'unified') {
            const subjectNames = profile?.subjectCombination || [];
            let filtered = allExams.filter(e =>
              subjectNames.some(s => s.trim().toLowerCase() === e.subject.trim().toLowerCase())
            );

            // If nothing matched combination, show ALL active exams as fallback
            // This ensures candidates can still start even if combination is "incomplete" or misconfigured
            if (filtered.length === 0) {
              filtered = allExams.filter(e => e.isActive);
            }

            setExams(filtered);
          } else {
            const single = allExams.find(e => e.id === examId);
            if (single) setExams([single]);
          }
        } else {
          toast.error("Security parameters not found.");
        }
      } catch (e) {
        toast.error("Network error.");
      } finally {
        setLoading(false);
      }
    }
    fetchInstructions();
  }, [examId, profile]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse uppercase">Loading...</div>;

  if (exams.length === 0) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-black uppercase font-black">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl tracking-tighter">No Active Exams Found</h2>
          <div className="space-y-2 text-xs text-slate-500 leading-relaxed font-bold">
            <p>The examination terminal could not find any active modules matching your profile.</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left normal-case font-medium">
               <p className="font-black text-[9px] uppercase mb-2 text-primary">Troubleshooting Steps:</p>
               <ul className="list-disc list-inside space-y-1">
                 <li>Ensure exams have been created in the <b>Admin Panel</b>.</li>
                 <li>Check if the exams are marked as <b>Active</b> (Green indicator).</li>
                 <li>Verify your subject combination: <b>{profile?.subjectCombination?.join(', ') || 'None Selected'}</b>.</li>
               </ul>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12 border-slate-200 text-black rounded-xl font-black text-[10px] hover:bg-slate-50">
          RETURN TO HOME
        </Button>
      </div>
    </div>
  );

  const totalDuration = exams.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalQuestions = exams.reduce((acc, curr) => acc + curr.totalQuestions, 0);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center uppercase selection:bg-slate-100 relative text-black">
      <nav className="sticky top-0 w-full bg-white border-b-2 border-slate-100 px-8 py-4 flex justify-between items-center z-[100] shadow-sm mb-12">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/10">V</div>
            <span className="font-black text-xl tracking-tighter text-black">VIVI CBT</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-slate-400 hover:text-black transition-colors uppercase flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <div className="flex items-center gap-4 border-l pl-8 border-slate-100">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 leading-none">CANDIDATE</p>
                <p className="font-bold text-xs text-black">{profile?.displayName}</p>
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl w-full space-y-8 px-6 pb-20">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-50 border-2 border-slate-100 shadow-sm mb-4">
            <span className="text-[10px] font-black text-black tracking-widest uppercase">EXAMINATION Subjects</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-black leading-none">
            {examId === 'unified' ? 'UNIFIED Examination' : exams[0].subject}
          </h1>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.4em]">
            {examId === 'unified' ? 'MULTI-SUBJECTS SESSION' : exams[0].title}
          </p>
        </div>

        <Card className="rounded-[40px] border-2 border-slate-100 bg-white shadow-2xl overflow-hidden p-10">
          <div className="grid grid-cols-2 gap-8 mb-10 border-b-2 border-slate-50 pb-10">
             <div className="space-y-1">
                <p className="text-[9px] font-black opacity-30 uppercase">DURATION</p>
                <p className="text-1xl font-black text-black">{totalDuration} MINUTES</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black opacity-30 uppercase">TOTAL ITEMS</p>
                <p className="text-1xl font-black text-black">{totalQuestions} QUESTIONS</p>
             </div>
          </div>

          <div className="space-y-8">
             {examId === 'unified' && (
                <div className="space-y-3">
                   <p className="text-[14px] font-black opacity-30 tracking-widest">ENROLLED SUBJECTS</p>
                   <div className="flex flex-wrap gap-2">
                      {exams.map(e => (
                         <Badge key={e.id} className="bg-slate-100 text-black border-none px-4 py-2 font-black text-[14px] rounded-lg">
                            {e.subject} ({e.totalQuestions} Q)
                         </Badge>
                      ))}
                   </div>
                </div>
             )}
             <div className="space-y-4">
                <h3 className="text-sm font-black tracking-widest uppercase text-black">CANDIDATE INSTRUCTIONS</h3>
                <div className="space-y-3">
                   {[
                     "DO NOT minimize the browser window or switch tabs. Any exit from fullscreen mode will be logged as a violation.",
                     "Ensure your webcam remains unobstructed for continuous proctoring.",
                     "Once you click 'BEGIN EXAMINATION', the timer will start and cannot be paused.",
                     "All responses are automatically saved in real-time. If the system crashes, your progress will be restored upon reconnection.",
                     "Click the 'SUBMIT' button only when you are completely finished with all modules."
                   ].map((text, i) => (
                     <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center shrink-0 font-black text-[10px] text-white">{i+1}</div>
                        <p className="text-xs font-bold leading-relaxed text-slate-700">{text}</p>
                     </div>
                   ))}
                </div>
             </div>



             <div className="flex flex-col gap-4">
                <Button
                    onClick={() => navigate(`/exam/${examId}`)}
                    className="w-full h-15 bg-black text-white rounded-2xl font-black text-xl tracking-widest shadow-2xl shadow-black/20 flex gap-4 hover:bg-slate-800 transition-all border-none active:scale-95 uppercase"
                >
                  BEGIN EXAMINATION
                </Button>
                <Button
                  onClick={() => {
                    if (profile?.loginMethod === 'examNumber') {
                      logOut?.();
                      navigate('/candidate-login');
                    } else {
                      navigate('/');
                    }
                  }}
                  variant="ghost"
                  className="w-full h-12 text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase hover:text-black hover:bg-transparent"
                >
                  Return
                </Button>
             </div>
          </div>
        </Card>

        <p className="text-center text-[10px] font-bold text-slate-300 tracking-[0.3em]">
          &copy; {new Date().getFullYear()} VIVI CBT SYSTEMS &bull; ACADEMIC INTEGRITY ENFORCED
        </p>
      </div>
    </div>
  );
}
