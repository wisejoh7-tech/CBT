import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Exam, Question, Attempt } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/lib/ui/button';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  HelpCircle, 
  Send, 
  AlertTriangle,
  CheckCircle2,
  Calculator as CalcIcon,
  LogOut,
  Volume2,
  Eye,
  CameraOff,
  Monitor,
  User
} from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { GoogleGenAI } from "@google/genai";
import { getApiUrl } from '@/src/lib/api-config';

export default function ExamPlayer() {
  const { examId } = useParams<{ examId: string }>();
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeExamIndex, setActiveExamIndex] = useState(0);
  const [questionsByExam, setQuestionsByExam] = useState<Record<string, Question[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [acceptedInstructions, setAcceptedInstructions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const { profile, user, logOut } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  // Socket.io real-time reporting
  useEffect(() => {
    if (socket && user && examId) {
      socket.emit('join-exam', examId || 'unified');
    }
  }, [socket, user, examId]);

  const reportProgress = useCallback((currentAnswers: Record<string, number>) => {
    if (socket && user && profile) {
      socket.emit('update-progress', {
        userId: profile.examNumber || user.uid,
        examId: examId || 'unified',
        progress: {
          answeredCount: Object.keys(currentAnswers).length,
          lastUpdated: new Date()
        }
      });
    }
  }, [socket, user, profile, examId]);

  const saveStateToBackend = useCallback(async (currentAnswers: Record<string, number>, currentExamIdx: number, currentQIdx: number, currentFlags: Set<string>, currentTimer: number) => {
    // ALWAYS save to local storage first for offline resilience
    const state = {
      answers: currentAnswers,
      currentQuestionIndex: currentQIdx,
      flagged: Array.from(currentFlags),
      timeLeft: currentTimer,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`exam_state_${currentAttemptId}`, JSON.stringify(state));

    if (!currentAttemptId || isCompleted) return;
    setIsSaving(true);

    try {
      await fetch(getApiUrl(`/exams/attempt/${currentAttemptId}`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(state)
      });
    } catch (e) {
      console.error("Save to cloud failed, cached locally", e);
    } finally {
      setIsSaving(false);
    }
  }, [currentAttemptId, isCompleted, getHeaders]);

  const handleSuspendSession = async () => {
    if (!confirm("SUSPEND SESSION: Your progress will be saved. You can log back in later to resume. Proceed?")) return;
    await saveStateToBackend(answers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft || 0);
    if (logOut) await logOut();
    navigate('/');
  };

  const videoRefProctor = useRef<HTMLVideoElement | null>(null);

  // AI Proctoring: Periodic Webcam Capture
  useEffect(() => {
    if (!hasStarted || isCompleted || !user || !currentAttemptId) return;

    let proctorInterval: NodeJS.Timeout;

    const setupProctoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } });
        if (videoRefProctor.current) {
          videoRefProctor.current.srcObject = stream;
        }
        setProctoringActive(true);

        proctorInterval = setInterval(async () => {
          if (videoRefProctor.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRefProctor.current, 0, 0, 160, 120);
              const snap = canvas.toDataURL('image/jpeg', 0.5);

              await fetch(getApiUrl(`/exams/attempt/${currentAttemptId}/snapshots`), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ snapshot: snap })
              });
            }
          }
        }, 120000); // Every 2 minutes
      } catch (err) {
        console.error("Proctoring failed:", err);
        toast.error("Security violation: Camera access is mandatory.");
        setProctoringActive(false);
      }
    };

    setupProctoring();

    return () => {
      if (proctorInterval) clearInterval(proctorInterval);
      if (videoRefProctor.current && videoRefProctor.current.srcObject) {
        const stream = videoRefProctor.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasStarted, isCompleted, user, currentAttemptId, getHeaders]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isCompleted || !currentAttemptId) return;
    setIsSubmitting(true);

    try {
      let totalScore = 0;
      let totalPossible = 0;
      const results: any[] = [];

      exams.forEach(exam => {
        const qs = questionsByExam[exam.id] || [];
        let examScore = 0;
        qs.forEach(q => {
          if (answers[q.id] === q.correctOptionIndex) {
            examScore++;
          }
        });
        totalScore += examScore;
        totalPossible += qs.length;
        results.push({
          examId: exam.id,
          subject: exam.subject,
          score: examScore,
          totalPossible: qs.length
        });
      });

      await fetch(getApiUrl(`/exams/attempt/${currentAttemptId}`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          score: totalScore,
          totalPossible,
          status: 'completed',
          answers
        })
      });

      setSessionResults(results);
      setIsCompleted(true);
      toast.success("Examination submitted successfully!");
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isCompleted, currentAttemptId, exams, questionsByExam, answers, getHeaders]);

  // Load exams and questions
  useEffect(() => {
    async function initExam() {
      if (!user || !profile) return;
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/exams'), { headers: getHeaders() });
        const allExams: Exam[] = await res.json();

        const subjectNames = profile.subjectCombination || [];
        let filteredExams = allExams.filter(e =>
          subjectNames.some(s => s.toLowerCase() === e.subject.toLowerCase()) || e.id === examId
        );

        if (filteredExams.length === 0) {
          toast.error("No matching exams found.");
          navigate('/dashboard');
          return;
        }

        filteredExams.sort((a, b) => {
          if (a.subject.toLowerCase() === 'use of english') return -1;
          return 0;
        });

        setExams(filteredExams);

        const qMap: Record<string, Question[]> = {};
        for (const exam of filteredExams) {
          const qRes = await fetch(getApiUrl(`/exams/${exam.id}`), { headers: getHeaders() });
          const examData = await qRes.json();
          qMap[exam.id] = examData.questions || [];
        }
        setQuestionsByExam(qMap);

        // Fetch or create attempt
        const attRes = await fetch(getApiUrl(`/exams/${examId || 'unified'}/attempt`), {
          method: 'POST',
          headers: getHeaders()
        });
        const attempt: Attempt = await attRes.json();
        setCurrentAttemptId(attempt.id);

        if (attempt.status === 'completed') {
          setIsCompleted(true);
        } else {
          setAnswers(attempt.answers || {});
          setFlaggedQuestions(new Set(attempt.flagged || []));
          setCurrentQuestionIndex(attempt.currentQuestionIndex || 0);
          if (attempt.timeLeft) setTimeLeft(attempt.timeLeft);
          else {
            const totalMinutes = filteredExams.reduce((acc, curr) => acc + (curr.durationMinutes || 30), 0);
            setTimeLeft(totalMinutes * 60);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Init error", error);
        toast.error("Failed to load examination.");
        navigate('/dashboard');
      }
    }
    initExam();
  }, [examId, profile, user, navigate, getHeaders]);

  const [warningCount, setWarningCount] = useState(0);

  // Security: Window focus detection
  useEffect(() => {
    if (!hasStarted || isCompleted) return;

    const handleBlur = () => {
      setWarningCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
          toast.error("SECURITY VIOLATION: Excessive tab switching. Session terminated.");
          handleSubmit();
        } else {
          toast.warning(`SECURITY WARNING: DO NOT switch tabs or windows! (${next}/3)`);
        }
        return next;
      });
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u')) || e.key === 'F12') {
        e.preventDefault();
        toast.error("Restricted key combination.");
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasStarted, isCompleted, handleSubmit]);

  const startExam = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
    } catch (e) {
      toast.error("Fullscreen needed to start the exam.");
    }
  };

  const questions = questionsByExam[exams[activeExamIndex]?.id] || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted || !currentQuestion) return;
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: optionIndex
    };
    setAnswers(newAnswers);
    saveStateToBackend(newAnswers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft || 0);
    reportProgress(newAnswers);
  };

  useEffect(() => {
    if (timeLeft === null || isCompleted || !hasStarted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, isCompleted, hasStarted, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredPercentage = exams.length > 0 ? (Object.keys(answers).length / exams.reduce((acc, e) => acc + (questionsByExam[e.id]?.length || 0), 0)) * 100 : 0;

  if (loading) return <div className="flex items-center justify-center h-screen text-primary font-bold">LOADING...</div>;

  if (!hasStarted && !isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full bg-white p-12 rounded-[48px] shadow-2xl border-2 border-primary/20 text-center">
          <h2 className="text-3xl font-black mb-6 text-primary">EXAMINATION PROTOCOL</h2>
          <div className="text-left space-y-4 mb-10 text-primary/70">
            <p className="font-bold flex items-center gap-2"><Shield className="w-4 h-4" /> Fullscreen is mandatory.</p>
            <p className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Time limit: {Math.floor((timeLeft || 0) / 60)} minutes.</p>
            <p className="font-bold flex items-center gap-2 text-red-500"><AlertTriangle className="w-4 h-4" /> Tab-switching or minimizing will result in session termination after 3 warnings.</p>
            <p className="font-bold flex items-center gap-2"><CameraOff className="w-4 h-4" /> Webcam monitoring is active for the duration of the exam.</p>
          </div>
          <Button onClick={startExam} className="w-full h-16 bg-primary text-white font-black rounded-2xl tracking-widest text-lg shadow-xl shadow-primary/20">
            I Understand, Start Exam
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full bg-white p-12 rounded-[48px] shadow-2xl border border-primary/10 text-center">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-4">EXAM COMPLETED</h2>
          <div className="space-y-3 mb-10">
            {sessionResults.map((r, i) => (
              <div key={i} className="flex justify-between p-4 bg-primary/5 rounded-2xl font-bold">
                <span>{r.subject}</span>
                <span>{r.score} / {r.totalPossible}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => { logOut?.(); navigate('/'); }} className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-xl">
            Logout and Exit
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-primary selection:bg-primary/10">
      <header className="h-20 px-8 flex items-center justify-between border-b-2 border-primary/10 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl">V</div>
            <div>
              <h1 className="font-black tracking-tight leading-none">CBT PLAYER</h1>
              <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mt-1">Session: {profile?.displayName}</p>
            </div>
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

        <div className="flex gap-8 items-center">
          {proctoringActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-full border border-rose-100">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                <Eye className="w-3 h-3" /> Proctoring Active
              </span>
              <video ref={videoRefProctor} autoPlay muted playsInline className="hidden" />
            </div>
          )}
          <div className="flex items-center gap-3 text-right pr-4 border-r border-primary/10">
            <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">Time Remaining</p>
            <p className={cn("text-2xl font-mono font-black", timeLeft! < 300 ? "text-red-500 animate-pulse" : "")}>{formatTime(timeLeft || 0)}</p>
          </div>
          <Button variant="ghost" onClick={handleSuspendSession} className="text-primary/30 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="h-1 bg-primary/5 w-full">
        <motion.div initial={{ width: 0 }} animate={{ width: `${answeredPercentage}%` }} className="h-full bg-primary shadow-[0_0_10px_var(--primary)]" />
      </div>

      <nav className="h-12 bg-primary/5 border-b-2 border-primary/10 flex items-center px-8 overflow-x-auto no-scrollbar">
        {exams.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => { setActiveExamIndex(idx); setCurrentQuestionIndex(0); }}
            className={cn(
              "h-full px-6 text-[10px] font-black uppercase tracking-widest transition-all",
              activeExamIndex === idx ? "bg-primary text-white" : "text-primary/40 hover:bg-primary/10"
            )}
          >
            {ex.subject}
          </button>
        ))}
      </nav>

      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 p-12 overflow-y-auto flex justify-center">
          <div className="max-w-3xl w-full">
            {currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-primary/10 text-primary font-black px-4 py-2 rounded-lg border-none">{exams[activeExamIndex].subject} • Question {currentQuestionIndex + 1}</Badge>
                    <Button variant="ghost" onClick={() => {
                      const newFlags = new Set(flaggedQuestions);
                      if (newFlags.has(currentQuestion.id)) newFlags.delete(currentQuestion.id);
                      else newFlags.add(currentQuestion.id);
                      setFlaggedQuestions(newFlags);
                    }} className={cn("font-black text-[10px] tracking-widest", flaggedQuestions.has(currentQuestion.id) ? "text-amber-500" : "text-primary/20")}>
                      <AlertTriangle className="w-4 h-4 mr-2" /> {flaggedQuestions.has(currentQuestion.id) ? 'FLAGGED' : 'FLAG'}
                    </Button>
                  </div>

                  <h3 className="text-4xl font-black leading-tight tracking-tight">{currentQuestion.text}</h3>

                  <div className="grid gap-4">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = answers[currentQuestion.id] === idx;
                      return (
                        <button key={idx} onClick={() => handleSelectOption(idx)} className={cn(
                          "flex items-center p-6 rounded-[24px] border-2 transition-all text-left",
                          isSelected ? "border-primary bg-primary/[0.03]" : "border-primary/10 bg-white hover:border-primary/30"
                        )}>
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl mr-6", isSelected ? "bg-primary text-white" : "bg-primary/5")}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-xl font-bold">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>

        <aside className="w-80 border-l-2 border-primary/10 bg-white p-8 overflow-y-auto">
          <h4 className="text-[10px] font-black text-primary/20 uppercase tracking-[0.2em] mb-6">Question Palette</h4>
          <div className="grid grid-cols-4 gap-3">
            {questions.map((q, idx) => (
              <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)} className={cn(
                "aspect-square rounded-xl flex items-center justify-center font-black transition-all border-2",
                idx === currentQuestionIndex ? "bg-primary text-white border-primary shadow-lg scale-110" :
                answers[q.id] !== undefined ? "bg-primary/5 text-primary border-primary/10" :
                "bg-white border-primary/5 text-primary/20"
              )}>
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>
      </main>

      <footer className="h-24 px-12 border-t-2 border-primary/10 flex items-center justify-between bg-white">
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="h-14 px-8 rounded-2xl font-black tracking-widest border-2">PREVIOUS</Button>
          <Button onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))} disabled={currentQuestionIndex === questions.length - 1} className="h-14 px-12 bg-primary text-white rounded-2xl font-black tracking-widest shadow-xl shadow-primary/20">NEXT ITEM</Button>
        </div>

        <Button onClick={() => { if(confirm("Submit all answers?")) handleSubmit(); }} className="h-14 px-8 bg-red-500 text-white rounded-2xl font-black tracking-widest hover:bg-red-600 shadow-xl shadow-red-100 border-none">FINAL SUBMIT</Button>
      </footer>
    </div>
  );
}
