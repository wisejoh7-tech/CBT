import { useEffect, useState, useCallback } from 'react';
import { Exam, Attempt } from '@/src/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import {
  LogOut,
  GraduationCap,
  PlayCircle,
  Shield,
  Printer,
  Award,
  Monitor,
  User,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { getApiUrl, safeJsonResponse, apiFetch } from '@/src/lib/api-config';

export default function ExamDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [unifiedAttempt, setUnifiedAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, user, logOut } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Robust field mapping for profile display
  const displayName = profile?.displayName || profile?.fullName || "Candidate";
  const examNumber = profile?.examNumber || profile?.uid || "N/A";
  const faceUrl = profile?.faceUrl || null;
  const hasWaecResult = !!(profile?.waecResultUrl);

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchData = async () => {
      try {
        const examRes = await apiFetch(getApiUrl('/exams'), { headers: getHeaders() });
        const allExams: Exam[] = await safeJsonResponse(examRes);
        const subjectNames = profile.subjectCombination || [];

        let filteredExams: Exam[] = [];
        if (Array.isArray(allExams)) {
          filteredExams = allExams.filter(e =>
            subjectNames.some(s => {
              if (!s || !e.subject) return false;
              const s1 = s.trim().toLowerCase();
              const s2 = e.subject.trim().toLowerCase();
              return s1 === s2 || s1.includes(s2) || s2.includes(s1);
            })
          );
          if (filteredExams.length === 0) {
            filteredExams = allExams.filter(e => e.isActive !== false);
          }
          if (filteredExams.length === 0) {
            filteredExams = allExams;
          }
        }
        setExams(filteredExams);

        const attemptRes = await apiFetch(getApiUrl('/exams/attempts/my'), { headers: getHeaders() });
        const myAttempts = await safeJsonResponse(attemptRes);

        setAttempts(Array.isArray(myAttempts) ? myAttempts : []);

        const unified = Array.isArray(myAttempts) ? myAttempts.find((a: any) => a.examId === 'unified') : null;
        setUnifiedAttempt(unified || null);
      } catch (e) {
        console.error("Exam dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (socket) {
      socket.on('exam-state-updated', (data) => {
        // Handle real-time updates if needed
        if (data.userId === (profile.examNumber || user.uid)) {
           // Refresh data
           fetchData();
        }
      });
    }

    return () => { if (socket) socket.off('exam-state-updated'); };
  }, [profile, user, getHeaders, socket]);

  const isExamFinished = unifiedAttempt?.status === 'completed';

  if (loading) return <div className="p-20 text-center font-black">Loading</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/50 relative overflow-hidden">
      <div className="cbt-background cbt-background-dark" />
      {/* Intense futuristic background for exam terminal */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0EA5E910,transparent)]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <header className="h-12 border-b border-white/10 px-6 flex justify-between items-center relative z-10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]"><GraduationCap className="w-3.5 h-3.5" /></div>
             <h1 className="font-black text-xs tracking-tighter text-white">EXAM TERMINAL</h1>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[8px] px-2 py-0.5 animate-pulse">SECURE LINK ACTIVE</Badge>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black text-white/40 leading-none">CANDIDATE ID</p>
              <p className="text-xs font-black text-white">{profile?.examNumber}</p>
           </div>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => { logOut?.(); navigate('/'); }}><LogOut className="w-3.5 h-3.5" /></Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl text-center"
        >
          <div className="mb-8 space-y-2">
             <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">READY TO<br/><span className="text-primary">BEGIN?</span></h2>
             <p className="text-white/40 font-bold tracking-[0.2em] text-[9px]">VIVI Standard Examination Protocol v2.0</p>
          </div>

          <Card className="p-8 rounded-3xl border-2 border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {profile?.subjectCombination?.map(s => (
                     <div key={s} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[8px] font-black text-white/40 mb-0.5">Subject</p>
                        <p className="text-[10px] font-black text-white">{s}</p>
                     </div>
                   ))}
                </div>

                <div className="flex flex-col gap-3">
                  {!isExamFinished ? (
                    <Button
                      onClick={() => navigate('/instructions/unified')}
                      className="h-16 bg-primary hover:bg-sky-400 text-white rounded-2xl font-black text-lg tracking-[0.1em] shadow-[0_0_30px_rgba(14,165,233,0.2)] transition-all active:scale-95 group"
                    >
                      START SESSION <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl text-center">
                       <Award className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                       <h3 className="text-lg font-black text-white mb-1">SESSION COMPLETED</h3>
                       <p className="text-emerald-500/60 font-bold text-xs">Your responses have been securely transmitted.</p>
                       <Button onClick={() => navigate('/dashboard')} variant="link" className="mt-3 h-auto p-0 text-primary font-black tracking-widest text-[8px]">Go to Profile for Results</Button>
                    </div>
                  )}

                  <p className="text-white/20 text-[8px] font-bold tracking-widest">
                    By clicking start, you agree to the examination code of conduct.
                  </p>
                </div>
             </div>
             <Shield className="absolute -bottom-16 -left-16 w-64 h-64 text-white/5 pointer-events-none" />
          </Card>
        </motion.div>
      </main>

      <footer className="p-4 text-center relative z-10">
         <p className="text-[8px] font-bold text-white/20 tracking-[0.3em]">Secure Terminal ID: {Math.random().toString(36).substring(7)}</p>
      </footer>
    </div>
  );
}
