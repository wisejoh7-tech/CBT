import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Exam, Question, Attempt } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/lib/ui/button';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  LogOut,
  Monitor,
  User,
  Shield,
  CameraOff,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { shuffleArray } from '@/src/lib/utils/shuffle';
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
  const [messages, setMessages] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { profile, user, logOut } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefProctor = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    if (socket && profile) {
      socket.emit('join-candidate-chat', profile.examNumber);
      socket.on('new-message', (msg: any) => {
        setMessages(prev => [...prev, msg]);
        if (!chatOpen) toast.info(`Message from Proctor: ${msg.message.substring(0, 30)}...`);
      });
      return () => { socket.off('new-message'); };
    }
  }, [socket, profile, chatOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !profile) return;
    const msg = {
      to: 'admin',
      from: profile.examNumber,
      fromName: profile.fullName,
      message: newMessage
    };
    socket.emit('send-message', msg);
    setMessages(prev => [...prev, { ...msg, timestamp: new Date(), from: 'me' }]);
    setNewMessage('');
  };

  // AI Proctoring: Periodic Webcam Capture
  useEffect(() => {
    if (!hasStarted || isCompleted || !user || !currentAttemptId) return;

    let proctorInterval: NodeJS.Timeout;

    const setupProctoring = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Webcam API unavailable.");
        }
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } }
          });
        } catch (e1) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

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
      const res = await fetch(getApiUrl(`/exams/attempt/${currentAttemptId}/submit`), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ answers })
      });

      if (res.ok) {
        setIsCompleted(true);
        toast.success("Examination submitted successfully!");
      } else {
        throw new Error("Marking service failure");
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isCompleted, currentAttemptId, answers, getHeaders]);

  // Load exams and questions
  useEffect(() => {
    async function initExam() {
      if (!user || !profile) return;
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/exams'), { headers: getHeaders() });
        if (!res.ok) throw new Error("Could not fetch examination list");
        const allExams: any = await res.json();

        if (!Array.isArray(allExams)) {
           throw new Error("Invalid response from server");
        }

        const subjectNames = profile.subjectCombination || [];
        let filteredExams = allExams.filter((e: any) =>
          subjectNames.some(s => s.trim().toLowerCase() === e.subject.trim().toLowerCase()) || e.id === examId
        );

        // Fallback: If nothing matched profile, show all active exams to ensure candidate can see questions
        if (filteredExams.length === 0) {
          filteredExams = allExams.filter((e: any) => e.isActive);
        }

        if (filteredExams.length === 0) {
          toast.error("No matching exams found.");
          navigate('/dashboard');
          return;
        }

        filteredExams.sort((a: any, b: any) => {
          if (a.subject.toLowerCase() === 'use of english') return -1;
          return 0;
        });

        setExams(filteredExams);

        const qMap: Record<string, Question[]> = {};
        for (const exam of filteredExams) {
          const qRes = await fetch(getApiUrl(`/exams/${exam.id}`), { headers: getHeaders() });
          if (qRes.ok) {
            const examData = await qRes.json();
            // Randomization: Shuffle questions for each student
            const randomizedQuestions = shuffleArray(examData.questions || []);
            qMap[exam.id] = randomizedQuestions;
          }
        }
        setQuestionsByExam(qMap);

        // Fetch or create attempt
        const attRes = await fetch(getApiUrl(`/exams/${examId || 'unified'}/attempt`), {
          method: 'POST',
          headers: getHeaders()
        });

        if (!attRes.ok) {
           const errData = await attRes.json().catch(() => ({}));
           throw new Error(errData.message || "Failed to initialize examination session");
        }

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
      <div className="min-h-screen bg-slate-50/20 flex items-center justify-center p-6 relative">
        <div className="cbt-background" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full bg-white/90 backdrop-blur-md p-12 rounded-[48px] shadow-2xl border-2 border-primary/20 text-center relative z-10">
          <h2 className="text-1xl font-black mb-6 text-primary">EXAMINATION PROTOCOLS</h2>
          <div className="text-left space-y-4 mb-10 text-primary/70">
            <p className="font-bold flex items-center gap-2">1. Fullscreen is mandatory.</p>
            <p className="font-bold flex items-center gap-2">2. Time limit: {Math.floor((timeLeft || 0) / 60)} minutes.</p>
            <p className="font-bold flex items-center gap-2 text-red-500">3. Tab-switching or minimizing will result in session termination.</p>
            <p className="font-bold flex items-center gap-2">4. Webcam monitoring is active for the duration of the exam.</p>
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
      <div className="min-h-screen bg-slate-50/20 flex items-center justify-center p-6 text-black selection:bg-slate-100 relative">
        <div className="cbt-background" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full bg-white/90 backdrop-blur-md p-12 rounded-[48px] shadow-2xl border border-primary/10 text-center relative z-10">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-4 tracking-tighter">Session Terminated Successfully</h2>
          <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed">
            Your responses have been securely uploaded to the central server. <br/>
            Results will be released to your candidate dashboard <br/>
            following final administrative verification.
          </p>
          <Button onClick={() => { logOut?.(); navigate('/'); }} className="w-full h-16 bg-black text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all border-none">
            LOGOUT AND EXIT PORTAL
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50/20 text-primary selection:bg-primary/10 relative">
      <div className="cbt-background" />
      <header className="h-20 px-8 flex items-center justify-between border-b-2 border-primary/10 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl">V</div>
            <div>
              <h1 className="font-black tracking-tight leading-none">CBT PLAYER</h1>
              <p className="text-[10px] font-bold text-primary/40 tracking-widest mt-1">Session: {profile?.displayName}</p>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-primary/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-primary/40">
            <div className="relative">
              <Monitor className="w-6 h-6" />
              <User className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[8px] font-black tracking-[0.2em] leading-none text-left">JAMB Standard<br/>Examination Portal</span>
          </div>
        </div>

        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-3 text-right pr-4 border-r border-primary/10">
            <p className="text-[10px] font-black text-primary/30 tracking-widest">Time Remaining</p>
            <p className={cn("text-2xl font-mono font-black", timeLeft! < 300 ? "text-red-500 animate-pulse" : "")}>{formatTime(timeLeft || 0)}</p>
          </div>
          <Button variant="ghost" onClick={handleSuspendSession} className="text-primary/30 hover:text-red-500">
            <LogOut className="w-4 h-4" />
          </Button>
          <video ref={videoRefProctor} autoPlay muted playsInline className="hidden" />
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
              "h-full px-6 text-[10px] font-black tracking-widest transition-all",
              activeExamIndex === idx ? "bg-primary text-white" : "text-primary/40 hover:bg-primary/10"
            )}
          >
            {ex.subject}
          </button>
        ))}
      </nav>

      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 p-12 overflow-y-auto flex justify-center">
          <div className="max-w-xl w-full">
            {currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-primary/10 text-primary font-black px-4 py-2 rounded-lg border-none">{exams[activeExamIndex].subject} • Question {currentQuestionIndex + 1}</Badge>
                  </div>

                  <h3 className="text-xl font-black leading-tight tracking-tight">{currentQuestion.text}</h3>

                  <div className="grid gap-4">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = answers[currentQuestion.id] === idx;
                      return (
                        <button key={idx} onClick={() => handleSelectOption(idx)} className={cn(
                          "flex items-center p-4 rounded-2xl border-2 transition-all text-left",
                          isSelected ? "border-primary bg-primary/[0.03]" : "border-primary/10 bg-white hover:border-primary/30"
                        )}>
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm mr-4", isSelected ? "bg-primary text-white" : "bg-primary/5")}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-sm font-bold">{opt}</span>
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
          <h4 className="text-[10px] font-black text-primary/20 tracking-[0.2em] mb-6">Question Answered</h4>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="h-14 px-8 rounded-1xl font-black tracking-widest border-2">PREVIOUS</Button>
          <Button onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))} disabled={currentQuestionIndex === questions.length - 1} className="h-14 px-12 bg-primary text-white rounded-2xl font-black tracking-widest shadow-xl shadow-primary/20">NEXT ITEM</Button>
        </div>

        <Button onClick={() => { if(confirm("Submit all answers?")) handleSubmit(); }} className="h-14 px-8 bg-red-300 text-white rounded-1xl font-black tracking-widest hover:bg-red-600 shadow-xl shadow-red-100 border-none">FINAL SUBMIT</Button>
      </footer>


    </div>
  );
}
