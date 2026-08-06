import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Shield, Clock, BookOpen, CheckCircle, AlertCircle, PlayCircle, Monitor, User } from 'lucide-react';
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
      try {
        const res = await fetch(getApiUrl('/exams'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const allExams: Exam[] = await res.json();
          if (examId === 'unified' && profile) {
            const subjectNames = profile.subjectCombination || [];
            const filtered = allExams.filter(e =>
              subjectNames.some(s => s.toLowerCase() === e.subject.toLowerCase())
            );
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

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse uppercase">Loading</div>;
  if (exams.length === 0) return <div className="p-20 text-center uppercase font-black">No Session Data Found.</div>;

  const totalDuration = exams.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalQuestions = exams.reduce((acc, curr) => acc + curr.totalQuestions, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center uppercase selection:bg-primary/10 relative">
      <div className="cbt-background opacity-[0.05]" />
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b-2 border-primary/10 px-8 py-4 flex justify-between items-center z-[100] shadow-sm mb-12">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
            <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
          </div>
          <div className="h-8 w-[1px] bg-primary/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-primary/40">
            <div className="relative">
              <Monitor className="w-6 h-6" />
              <User className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-left">JAMB Standard<br/>Examination Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-primary/40 leading-none">CANDIDATE</p>
              <p className="font-bold text-xs">{profile?.displayName}</p>
           </div>
        </div>
      </nav>

      <div className="max-w-2xl w-full space-y-8 px-6 pb-20">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border-2 border-primary/10 shadow-sm mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-primary tracking-widest">SECURE EXAMINATION MODULE</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-primary leading-none">
            {examId === 'unified' ? 'UNIFIED ASSESSMENT' : exams[0].subject}
          </h1>
          <p className="text-[10px] font-black text-primary/30 tracking-[0.4em]">
            {examId === 'unified' ? 'MULTI-MODULE SESSION' : exams[0].title}
          </p>
        </div>

        <Card className="rounded-[40px] border-2 border-primary/10 bg-white shadow-2xl overflow-hidden p-10">
          <div className="grid grid-cols-2 gap-8 mb-10 border-b-2 border-primary/5 pb-10">
             <div className="space-y-1">
                <p className="text-[10px] font-black opacity-30 flex items-center gap-2"><Clock className="w-3 h-3" /> DURATION</p>
                <p className="text-2xl font-black">{totalDuration} MINUTES</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black opacity-30 flex items-center gap-2"><BookOpen className="w-3 h-3" /> TOTAL ITEMS</p>
                <p className="text-2xl font-black">{totalQuestions} QUESTIONS</p>
             </div>
          </div>

          <div className="space-y-8">
             {examId === 'unified' && (
                <div className="space-y-3">
                   <p className="text-[10px] font-black opacity-30 tracking-widest">ENROLLED MODULES</p>
                   <div className="flex flex-wrap gap-2">
                      {exams.map(e => (
                         <Badge key={e.id} className="bg-primary/5 text-primary border-none px-4 py-2 font-black text-[10px]">
                            {e.subject} ({e.totalQuestions} Q)
                         </Badge>
                      ))}
                   </div>
                </div>
             )}
             <div className="space-y-4">
                <h3 className="text-xs font-black tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" /> CANDIDATE INSTRUCTIONS</h3>
                <div className="space-y-3">
                   {[
                     "DO NOT minimize the browser window or switch tabs. Any exit from fullscreen mode will be logged as a violation.",
                     "Ensure your webcam remains unobstructed for continuous proctoring.",
                     "Once you click 'BEGIN EXAMINATION', the timer will start and cannot be paused.",
                     "All responses are automatically saved in real-time. If the system crashes, your progress will be restored upon reconnection.",
                     "Click the 'SUBMIT' button only when you are completely finished with all modules."
                   ].map((text, i) => (
                     <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-primary/5">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-black text-[10px] text-primary">{i+1}</div>
                        <p className="text-[10px] font-bold leading-relaxed">{text}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <p className="text-[10px] font-black text-emerald-600 tracking-tight leading-relaxed">
                  SYSTEM STATUS: GREEN. NETWORK LATENCY: OPTIMAL. <br/>
                  SECURE BROWSER ENVIRONMENT INITIALIZED.
                </p>
             </div>

             <Button
                onClick={() => navigate(`/exam/${examId}`)}
                className="w-full h-20 bg-primary text-white rounded-3xl font-black text-xl tracking-widest shadow-2xl shadow-primary/20 flex gap-4 hover:bg-primary/90 transition-all border-none active:scale-95"
             >
               <PlayCircle className="w-8 h-8" /> BEGIN EXAMINATION
             </Button>
          </div>
        </Card>

        <p className="text-center text-[10px] font-bold text-primary/20 tracking-[0.3em]">
          &copy; {new Date().getFullYear()} VIVI CBT SYSTEMS &bull; ACADEMIC INTEGRITY ENFORCED
        </p>
      </div>
    </div>
  );
}
