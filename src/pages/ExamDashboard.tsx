import { useEffect, useState, useCallback } from 'react';
import { Exam, Attempt } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { 
  LogOut,
  GraduationCap,
  PlayCircle,
  Shield,
  Printer,
  Award,
  Monitor,
  User
} from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';

export default function ExamDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [unifiedAttempt, setUnifiedAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, user, logOut } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchData = async () => {
      try {
        const examRes = await fetch(getApiUrl('/exams'), { headers: getHeaders() });
        const allExams: Exam[] = await examRes.json();
        const subjectNames = profile.subjectCombination || [];
        const filteredExams = allExams.filter(e =>
          subjectNames.some(s => s.toLowerCase() === e.subject.toLowerCase())
        );
        setExams(filteredExams);

        const attemptRes = await fetch(getApiUrl('/exams/attempts/all'), { headers: getHeaders() });
        const allAttempts: Attempt[] = await attemptRes.json();
        const myAttempts = allAttempts.filter(a => a.userId === (profile.examNumber || user.uid));
        setAttempts(myAttempts);

        const unified = myAttempts.find(a => a.examId === 'unified');
        setUnifiedAttempt(unified || null);

        setLoading(false);
      } catch (e) {
        console.error(e);
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

  if (loading) return <div className="p-20 text-center font-black">ACCESSING TERMINAL...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 uppercase relative">
      <div className="cbt-background opacity-[0.05]" />
      <header className="h-16 bg-white border-b-2 border-primary/10 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><GraduationCap className="w-5 h-5" /></div>
            <h1 className="font-black tracking-tighter text-primary">CBT DASHBOARD</h1>
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
        <Button variant="ghost" size="icon" onClick={() => { logOut?.(); navigate('/'); }}><LogOut className="w-4 h-4" /></Button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-8">
        <Card className="p-10 rounded-[40px] border-2 border-primary/10 bg-white shadow-2xl">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="w-40 h-40 rounded-[32px] bg-primary/5 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
               {profile?.faceUrl ? <img src={profile.faceUrl} className="w-full h-full object-cover" /> : <GraduationCap className="w-16 h-16 opacity-10" />}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-5xl font-black tracking-tighter mb-4">{profile?.displayName}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Badge className="bg-primary/5 text-primary border-none px-4 py-2 font-black">ID: {profile?.examNumber}</Badge>
                {profile?.subjectCombination?.map(s => <Badge key={s} className="bg-sky-500 text-white border-none px-4 py-2 font-black">{s}</Badge>)}
              </div>
            </div>
          </div>
        </Card>

        {!isExamFinished ? (
          <Card className="p-10 rounded-[40px] border-2 border-primary bg-white shadow-2xl overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-2">READY FOR EXAMINATION?</h3>
              <p className="text-primary/40 font-bold mb-8">{exams.length} SUBJECTS CONFIGURED FOR YOUR SESSION</p>

              {exams.some(e => {
                const now = new Date();
                if (e.startTime && new Date(e.startTime) > now) return true;
                if (e.endTime && new Date(e.endTime) < now) return true;
                return false;
              }) ? (
                <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 mb-8">
                  <p className="text-amber-700 font-black text-xs uppercase tracking-widest">Access Restricted: Session not yet active or has expired.</p>
                </div>
              ) : (
                <Button onClick={() => navigate('/instructions/unified')} className="w-full h-20 bg-primary text-white rounded-3xl font-black text-xl tracking-widest shadow-2xl shadow-primary/20 flex gap-4">
                  <PlayCircle className="w-8 h-8" /> START SESSION NOW
                </Button>
              )}
            </div>
            <Shield className="absolute -bottom-10 -right-10 w-64 h-64 opacity-[0.03] text-primary pointer-events-none" />
          </Card>
        ) : (
          <Card className="p-10 rounded-[40px] border-2 border-primary/10 bg-white shadow-2xl text-center">
             <Award className="w-16 h-16 text-primary mx-auto mb-6" />
             <h3 className="text-3xl font-black mb-4 uppercase">SESSION CONCLUDED</h3>
             <p className="text-primary/40 font-bold mb-10 max-w-md mx-auto">YOUR RESPONSES HAVE BEEN TRANSMITTED TO THE CENTRAL REPOSITORY. OFFICIAL TRANSCRIPTS WILL BE AVAILABLE ONCE VERIFIED BY ADMINS.</p>
             <div className="flex justify-center gap-4">
               <Button onClick={() => navigate(`/result-slip/${profile?.examNumber}`)} className="h-16 px-12 bg-primary text-white rounded-2xl font-black tracking-widest flex gap-3 shadow-xl">
                 <Printer className="w-5 h-5" /> VIEW TRANSCRIPT
               </Button>
             </div>
          </Card>
        )}
      </main>
    </div>
  );
}
