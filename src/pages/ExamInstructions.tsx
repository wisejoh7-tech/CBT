import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Shield, Clock, BookOpen, CheckCircle, AlertCircle, PlayCircle, Monitor, User, ArrowLeft } from 'lucide-react';
import { Exam } from '@/src/types';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/lib/ui/badge';

function isSubjectMatch(sub1: string, sub2: string): boolean {
  if (!sub1 || !sub2) return false;
  const s1 = sub1.trim().toLowerCase();
  const s2 = sub2.trim().toLowerCase();
  if (s1 === s2) return true;
  if (s1.includes(s2) || s2.includes(s1)) return true;
  if ((s1.includes('english') || s1.includes('eng')) && (s2.includes('english') || s2.includes('eng'))) return true;
  if ((s1.includes('math') || s1.includes('mat')) && (s2.includes('math') || s2.includes('mat'))) return true;
  return false;
}

export default function ExamInstructions() {
  const { examId } = useParams<{ examId: string }>();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, logOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInstructions() {
      try {
        setLoading(true);
        const res = await apiFetch(getApiUrl('/exams'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const allExams: Exam[] = await safeJsonResponse(res);
        if (Array.isArray(allExams) && allExams.length > 0) {
          let filtered: Exam[] = [];

          if (examId && examId !== 'unified') {
            const single = allExams.find(e => e.id === examId);
            if (single) filtered = [single];
          }

          if (filtered.length === 0) {
            const subjectNames = profile?.subjectCombination || [];
            if (subjectNames.length > 0) {
              const matchedExams: Exam[] = [];
              for (const s of subjectNames) {
                const matched = allExams.find(e => isSubjectMatch(s, e.subject));
                if (matched) {
                  if (!matchedExams.some(e => e.id === matched.id)) {
                    matchedExams.push(matched);
                  }
                } else {
                  matchedExams.push({
                    id: `virtual-${encodeURIComponent(s)}`,
                    title: `${s} Module`,
                    description: `${s} Examination Module`,
                    subject: s,
                    durationMinutes: 30,
                    totalQuestions: 0,
                    isActive: true,
                    createdBy: 'system',
                    createdAt: new Date().toISOString()
                  });
                }
              }
              filtered = matchedExams;
            }
          }

          // Fallback 1: Active exams
          if (filtered.length === 0) {
            filtered = allExams.filter(e => e.isActive !== false);
          }

          // Fallback 2: All exams in system
          if (filtered.length === 0) {
            filtered = allExams;
          }

          setExams(filtered);
        } else {
          toast.error("No active examination modules available.");
        }
      } catch (e) {
        toast.error(getFriendlyErrorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    fetchInstructions();
  }, [examId, profile]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">Loading...</div>;

  if (exams.length === 0) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-black font-black">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl tracking-tighter">No Active Exams Found</h2>
          <div className="space-y-2 text-xs text-slate-500 leading-relaxed font-bold">
            <p>The examination terminal could not find any active modules matching your profile.</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left normal-case font-medium">
               <p className="font-black text-[9px] mb-2 text-primary">Troubleshooting Steps:</p>
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
    <div className="min-h-screen bg-slate-50/20 flex flex-col items-center selection:bg-slate-100 relative text-black">
      <div className="cbt-background" />
      <nav className="sticky top-0 w-full bg-white border-b border-slate-100 px-6 py-3 flex justify-between items-center z-[100] shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md shadow-black/10">V</div>
            <span className="font-black text-base tracking-tight text-black">VIVI CBT</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-100 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span className="text-[8px] font-black tracking-[0.15em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="text-xs font-black tracking-wider text-slate-400 hover:text-black transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </button>
          <div className="flex items-center gap-3 border-l pl-6 border-slate-100">
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 leading-none">CANDIDATE</p>
                <p className="font-bold text-xs text-black">{profile?.displayName}</p>
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-xl w-full space-y-6 px-4 pb-16">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-50 border border-slate-100 shadow-sm mb-2">
            <span className="text-[9px] font-black text-black tracking-wider">EXAMINATION Subjects</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-black leading-none">
            {examId === 'unified' ? 'UNIFIED Examination' : exams[0].subject}
          </h1>
          <p className="text-[9px] font-black text-slate-400 tracking-[0.3em]">
            {examId === 'unified' ? 'MULTI-SUBJECTS SESSION' : exams[0].title}
          </p>
        </div>

        <Card className="rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden p-6">
          <div className="grid grid-cols-2 gap-6 mb-6 border-b border-slate-100 pb-6">
             <div className="space-y-0.5">
                <p className="text-[9px] font-black opacity-40">DURATION</p>
                <p className="text-base font-black text-black">{totalDuration} MINUTES</p>
             </div>
             <div className="space-y-0.5">
                <p className="text-[9px] font-black opacity-40">TOTAL ITEMS</p>
                <p className="text-base font-black text-black">{totalQuestions} QUESTIONS</p>
             </div>
          </div>

          <div className="space-y-6">
             {examId === 'unified' && (
                <div className="space-y-2">
                   <p className="text-xs font-black opacity-40 tracking-wider">ENROLLED SUBJECTS</p>
                   <div className="flex flex-wrap gap-1.5">
                      {exams.map(e => (
                         <Badge key={e.id} className="bg-slate-100 text-black border-none px-3 py-1 font-black text-xs rounded-md">
                            {e.subject} ({e.totalQuestions} Q)
                         </Badge>
                      ))}
                   </div>
                </div>
             )}
             <div className="space-y-3">
                <h3 className="text-xs font-black tracking-wider text-black">CANDIDATE INSTRUCTIONS</h3>
                <div className="space-y-2">
                   {[
                     "DO NOT minimize the browser window or switch tabs. Any exit from fullscreen mode will be logged as a violation.",
                     "Ensure your webcam remains unobstructed for continuous proctoring.",
                     "Once you click 'BEGIN EXAMINATION', the timer will start and cannot be paused.",
                     "All responses are automatically saved in real-time. If the system crashes, your progress will be restored upon reconnection.",
                     "Click the 'SUBMIT' button only when you are completely finished with all modules."
                   ].map((text, i) => (
                     <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 items-start">
                        <div className="w-5 h-5 rounded-md bg-black flex items-center justify-center shrink-0 font-black text-[9px] text-white mt-0.5">{i+1}</div>
                        <p className="text-[11px] font-medium leading-relaxed text-slate-700">{text}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="flex flex-col gap-3 pt-2">
                <Button
                    onClick={() => navigate(`/exam/${examId}`)}
                    className="w-full h-11 bg-black text-white rounded-xl font-black text-sm tracking-wider shadow-lg shadow-black/10 flex gap-2 hover:bg-slate-800 transition-all border-none active:scale-95"
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
                  className="w-full h-9 text-slate-400 font-black text-[9px] tracking-[0.2em] hover:text-black hover:bg-transparent"
                >
                  Return
                </Button>
             </div>
          </div>
        </Card>

        <p className="text-center text-[9px] font-bold text-slate-300 tracking-[0.2em]">
          &copy; {new Date().getFullYear()} VIVI CBT SYSTEMS &bull; ACADEMIC INTEGRITY ENFORCED
        </p>
      </div>
    </div>
  );
}
