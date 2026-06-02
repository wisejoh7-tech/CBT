import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Exam, Question, Attempt } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/lib/ui/button';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Separator } from '@/lib/ui/separator';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  HelpCircle, 
  Send, 
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calculator as CalcIcon,
  XCircle,
  Lock,
  FileText,
  Shield,
  Info,
  MousePointer2,
  RefreshCw,
  Printer,
  LogOut,
  Volume2,
  CameraOff,
  Eye
} from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { GoogleGenAI } from "@google/genai";
import { shuffleArray } from '@/src/lib/utils/shuffle';

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
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [acceptedInstructions, setAcceptedInstructions] = useState(false);
  const [lastSaved, setLastSaved] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);

  const { profile, user, logOut } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronization when coming back online
  useEffect(() => {
    const handleOnlineSync = () => {
      if (user) {
        saveStateToFirestore(answers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft || 0);
      }
    };
    window.addEventListener('online', handleOnlineSync);
    return () => window.removeEventListener('online', handleOnlineSync);
  }, [user, answers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft, saveStateToFirestore]);

  // Socket.io real-time reporting
  useEffect(() => {
    if (socket && user && examId) {
      socket.emit('join-exam', 'unified');
    }
  }, [socket, user, examId]);

  const reportProgress = useCallback((currentAnswers: Record<string, number>) => {
    if (socket && user && profile) {
      socket.emit('update-progress', {
        userId: profile.examNumber || user.uid,
        examId: 'unified',
        progress: {
          answeredCount: Object.keys(currentAnswers).length,
          lastUpdated: new Date()
        }
      });
    }
  }, [socket, user, profile]);

  const handleSuspendSession = async () => {
    if (!confirm("SUSPEND SESSION: Your progress will be saved. You can log back in later to resume. Proceed?")) return;

    // Save one last time
    await saveStateToFirestore(answers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft || 0);

    // Force exit fullscreen if active
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }

    if (logOut) await logOut();
    navigate('/');
  };

  // Persistence to Firestore and LocalStorage
  const saveStateToFirestore = useCallback(async (currentAnswers: Record<string, number>, currentExamIdx: number, currentQIdx: number, currentFlags: Set<string>, currentTimer: number) => {
    if (!user || !profile || isCompleted) return;
    setIsSaving(true);

    // Always save to localStorage first for offline safety
    const localData = {
      answers: currentAnswers,
      activeExamIndex: currentExamIdx,
      currentQuestionIndex: currentQIdx,
      flagged: Array.from(currentFlags),
      timeLeft: currentTimer,
      timestamp: Date.now()
    };
    localStorage.setItem(`exam_state_${user.uid}`, JSON.stringify(localData));

    if (!navigator.onLine) {
      setIsSaving(false);
      return; // Skip firestore if offline, will sync when online
    }

    try {
      const attemptRef = doc(db, 'attempts', `${user.uid}_unified`);
      await setDoc(attemptRef, {
        userId: user.uid,
        examId: 'unified',
        userId: profile.examNumber || user.uid, // Unified search ID
        userUid: user.uid, // Authentication reference
        userName: profile.displayName,
        examNumber: profile.examNumber || '',
        answers: currentAnswers,
        activeExamIndex: currentExamIdx,
        currentQuestionIndex: currentQIdx,
        flagged: Array.from(currentFlags),
        timeLeft: currentTimer,
        status: 'in-progress',
        lastUpdated: serverTimestamp()
      }, { merge: true });
      setLastSaved(new Date());
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, isCompleted]);

  // Initialize GenAI safely
  const aiKey = process.env.GEMINI_API_KEY;
  const ai = (aiKey && aiKey !== "undefined") ? new GoogleGenAI(aiKey) : null;

  // Anti-cheat states
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRefProctor = useRef<HTMLVideoElement | null>(null);

  // AI Proctoring: Periodic Webcam Capture
  useEffect(() => {
    if (!hasStarted || isCompleted || !user) return;

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

              // Save snap to Firestore attempt log
              const attemptRef = doc(db, 'attempts', `${user.uid}_unified`);
              const attemptDoc = await getDoc(attemptRef);
              const snaps = attemptDoc.exists() ? (attemptDoc.data().proctoringSnaps || []) : [];

              // Keep only last 10 snaps to save space
              const newSnaps = [...snaps, snap].slice(-10);

              await updateDoc(attemptRef, {
                proctoringSnaps: newSnaps
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
  }, [hasStarted, isCompleted, user]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isCompleted) return;
    setIsSubmitting(true);

    try {
      const results: any[] = [];

      // Calculate scores for each exam separately
      exams.forEach(exam => {
        const qs = questionsByExam[exam.id] || [];
        let examScore = 0;
        qs.forEach(q => {
          if (answers[q.id] === q.correctOptionIndex) {
            examScore++;
          }
        });
        results.push({
          examId: exam.id,
          title: exam.title,
          subject: exam.subject,
          score: examScore,
          totalPossible: qs.length
        });

        // Also save individual attempts for individual result checking
        const indRef = doc(db, 'attempts', `${user!.uid}_${exam.id}`);
        setDoc(indRef, {
          userId: profile?.examNumber || user!.uid,
          examId: exam.id,
          score: examScore,
          totalPossible: qs.length,
          answers,
          completedAt: serverTimestamp(),
          status: 'completed',
          released: false // Default to not released until admin sends it
        }, { merge: true });
      });

      setSessionResults(results);

      const attemptRef = doc(db, 'attempts', `${user!.uid}_unified`);
      await setDoc(attemptRef, {
        userId: profile?.examNumber || user!.uid,
        examId: 'unified',
        results,
        answers,
        completedAt: serverTimestamp(),
        status: 'completed'
      }, { merge: true });

      setIsCompleted(true);
      toast.success("All examinations submitted successfully!");
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isCompleted, exams, questionsByExam, answers, user]);

  // Load exams
  useEffect(() => {
    async function initExam() {
      if (!user || !profile) return;
      try {
        setLoading(true);
        
        // 1. Determine which exams to load
        // Strict filtering: Only load subjects registered by the candidate
        const subjectNames = (profile?.role === 'student' && profile.subjectCombination)
          ? [...profile.subjectCombination]
          : [];

        console.log("Loading modules for subjects:", subjectNames);

        // Fetch all exams - removing orderBy to eliminate index dependency for now
        const allExamsSnap = await getDocs(collection(db, 'exams'));
        const allExams = allExamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Exam));

        console.log("Found total exams in DB:", allExams.length);

        let examList: Exam[] = [];

        if (subjectNames.length > 0) {
          // Filter by subject names using case-insensitive matching
          examList = allExams.filter(e =>
            subjectNames.some(s => s.toLowerCase() === e.subject.toLowerCase()) ||
            e.id === examId
          );

          // Deduplication: Only keep the most recent exam for each subject
          // First sort allExams by date so we pick the latest
          examList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const uniqueSubjectsMap = new Map<string, Exam>();
          examList.forEach(e => {
            const lowerSubject = e.subject.toLowerCase();
            if (!uniqueSubjectsMap.has(lowerSubject)) {
              uniqueSubjectsMap.set(lowerSubject, e);
            }
          });
          examList = Array.from(uniqueSubjectsMap.values());
        } else if (examId && examId !== 'unified') {
          // Just the one from URL
          examList = allExams.filter(e => e.id === examId);
        }

        if (examList.length === 0) {
           console.error("No matching exams found for criteria.");
           toast.error("No examination modules matched your registry combination.");
           navigate('/dashboard');
           return;
        }

        // Remove duplicates and ensure order (e.g. English first if present)
        const uniqueExams = Array.from(new Map(examList.map(e => [e.id, e])).values());
        uniqueExams.sort((a, b) => {
          if (a.subject.toLowerCase() === 'use of english') return -1;
          if (b.subject.toLowerCase() === 'use of english') return 1;
          return 0;
        });

        setExams(uniqueExams);
        setLoading(false);
      } catch (error: any) {
        console.error("Error setting up exam:", error);
        toast.error(`Failed to load examination modules: ${error.message || 'Unknown error'}`);
        navigate('/dashboard');
      }
    }
    initExam();
  }, [examId, navigate, user, profile]);

  // Load questions and handle session restoration
  useEffect(() => {
    if (exams.length === 0 || !user || isCompleted) return;

    async function loadQuestionsAndSession() {
      try {
        console.log("Fetching questions for exams:", exams.map(e => e.subject));
        // Fetch all questions for all loaded exams
        const qMap: Record<string, Question[]> = {};
        for (const exam of exams) {
          try {
            const qSnap = await getDocs(collection(db, 'exams', exam.id, 'questions'));
            let qList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));

            if (qList.length === 0) {
               console.warn(`No questions found for subject: ${exam.subject}`);
            }

            qMap[exam.id] = qList;
          } catch (qErr) {
            console.error(`Error loading questions for ${exam.subject}:`, qErr);
          }
        }
        setQuestionsByExam(qMap);

        // Restore active session
        let savedState: any = null;

        // 1. Try Firestore first if online
        if (navigator.onLine) {
          try {
            const attemptRef = doc(db, 'attempts', `${user.uid}_unified`);
            const attemptDoc = await getDoc(attemptRef);
            if (attemptDoc.exists()) {
              savedState = attemptDoc.data();
            }
          } catch (e) {
            console.warn("Firestore restore failed, falling back to local storage", e);
          }
        }

        // 2. Fallback to LocalStorage if Firestore is unavailable or empty
        const localJson = localStorage.getItem(`exam_state_${user.uid}`);
        if (localJson) {
          const localData = JSON.parse(localJson);
          // Only use local if it's newer than Firestore or if Firestore failed
          if (!savedState || localData.timestamp > (savedState.lastUpdated?.toMillis?.() || 0)) {
            savedState = { ...savedState, ...localData };
          }
        }

        if (savedState) {
          if (savedState.status === 'completed') {
            setIsCompleted(true);
            setSessionResults(savedState.results || []);
            return;
          }
          setHasStarted(true);
          setAnswers(savedState.answers || {});
          setActiveExamIndex(savedState.activeExamIndex || 0);
          setCurrentQuestionIndex(savedState.currentQuestionIndex || 0);
          setFlaggedQuestions(new Set(savedState.flagged || []));
          if (savedState.timeLeft !== undefined) setTimeLeft(savedState.timeLeft);
        } else {
          // Initialize time
          const totalMinutes = exams.reduce((acc, curr) => acc + (parseInt(curr.durationMinutes as any) || 30), 0);
          setTimeLeft(totalMinutes * 60);
        }
      } catch (e) {
        console.error("Critical session restoration error:", e);
        toast.error("Security session encountered an integrity error. Restarting...");
      }
    }
    loadQuestionsAndSession();
  }, [exams, user, isCompleted]);

  const questions = questionsByExam[exams[activeExamIndex]?.id] || [];
  const currentQuestion = questions[currentQuestionIndex];

  // VIVI Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !hasStarted) return;
      
      const key = e.key.toLowerCase();
      
      // A, B, C, D for options
      if (['a', 'b', 'c', 'd'].includes(key)) {
        const optionIndex = key.charCodeAt(0) - 97;
        if (currentQuestion && optionIndex < currentQuestion.options.length) {
          handleSelectOption(optionIndex);
        }
      }
      
      // N for Next, P for Previous
      if (key === 'n') {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }
      if (key === 'p') {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(prev => prev - 1);
        }
      }
      
      // S for Submit
      if (key === 's') {
        if (confirm("Are you sure you want to finalize your exam?")) {
          handleSubmit();
        }
      }

      // C for Calculator
      if (key === 'c') {
        setShowCalculator(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, questions.length, isCompleted, hasStarted, currentQuestion]);

  // Anti-cheat: Visibility Change Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasStarted && !isCompleted) {
        setCheatingAttempts(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            toast.error("EXAMINATION AUTOMATICALLY TERMINATED: Multiple violations detected.");
            handleSubmit();
          } else {
            toast.warning(`WARNING: Multiple violations will lead to auto-submission. Violation ${newCount}/3`);
          }
          return newCount;
        });
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && hasStarted && !isCompleted) {
        toast.warning("WARNING: Fullscreen mode exited. Please re-enable it to continue.");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [hasStarted, isCompleted]);

  useEffect(() => {
    if (timeLeft === null || isCompleted || !hasStarted) return;
    
    // Auto-submission when time is up
    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast.error("Time has expired. Your attempt is being finalized automatically.");
      handleSubmit();
      return;
    }

    if (timeLeft === 300) toast.warning("5 minutes remaining!");
    if (timeLeft === 60) toast.error("1 minute remaining! Finalize your answers.");

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isCompleted, hasStarted, handleSubmit]);

  const startExam = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      setHasStarted(true);
      setIsFullscreen(true);

      // Initialize Firestore attempt doc
      if (user) {
        await setDoc(doc(db, 'attempts', `${user.uid}_unified`), {
          userId: user.uid,
          examId: 'unified',
          startedAt: serverTimestamp(),
          status: 'in-progress',
          activeExamIndex: 0,
          currentQuestionIndex: 0
        }, { merge: true });
      }
    } catch (e) {
      toast.error("Fullscreen needed to start the exam.");
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted) return;
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: optionIndex
    };
    setAnswers(newAnswers);
    saveStateToFirestore(newAnswers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft || 0);
    reportProgress(newAnswers);
  };

  useEffect(() => {
    if (isCompleted || !hasStarted) return;

    const autoSaveInterval = setInterval(() => {
      saveStateToFirestore(answers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft || 0);
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [answers, activeExamIndex, currentQuestionIndex, flaggedQuestions, timeLeft, hasStarted, isCompleted, saveStateToFirestore]);

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };


  const handleExplain = async () => {
    if (!currentQuestion || !ai) {
      toast.error("AI Assistant is not configured. Please add GEMINI_API_KEY.");
      return;
    }
    setExplaining(true);
    setExplanation(null);
    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const response = await model.generateContent(`Explain clearly why the correct answer to this question is option ${currentQuestion.correctOptionIndex + 1}: ${currentQuestion.text}. Options: ${currentQuestion.options.join(', ')}`);
      setExplanation(response.response.text() || "No explanation available.");
    } catch (error) {
      console.error(error);
      toast.error("Gemini AI failed to explain.");
    } finally {
      setExplaining(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculate = (expr: string) => {
    try {
      // Basic evaluator for the calculator
      // eslint-disable-next-line no-eval
      const result = eval(expr.replace(/[^-+*/.0-9]/g, ''));
      setCalcDisplay(String(result));
    } catch {
      setCalcDisplay('Error');
    }
  };

  const currentPercentage = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredPercentage = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  if (loading) return <div className="flex items-center justify-center h-screen bg-transparent text-primary font-bold animate-pulse">SETTING UP SECURE SESSION...</div>;

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-primary/10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full bg-white rounded-[48px] shadow-2xl shadow-primary/10 border-2 border-primary/40 overflow-hidden"
        >
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Column: Security Protocol */}
            <div className="md:w-5/12 p-10 bg-primary/5 border-r-2 border-primary/10 flex flex-col items-center justify-center text-center">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 border-2 border-primary/40 shadow-xl shadow-primary/5 text-primary text-4xl font-black"
              >
                V
              </motion.div>
              <h2 className="text-3xl font-black mb-4  tracking-tighter text-primary">SECURE PORTAL</h2>
              <p className="text-primary/40 font-bold  tracking-widest text-[10px] mb-8">Candidate Integrity</p>

              
              <div className="space-y-3 w-full text-left">
                <div className="p-4 bg-white rounded-2xl border border-primary/10 flex gap-3">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[9px] font-black  text-primary/60 tracking-wider">Fullscreen Enforcement Active</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-primary/10 flex gap-3">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[9px] font-black  text-primary/60 tracking-wider">Tab-Switching Prohibited</p>
                </div>
              </div>
            </div>

            {/* Right Column: Instructions & Confirmation */}
            <div className="md:w-7/12 p-12 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-4 max-h-[500px] mb-8 custom-scrollbar">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-black  tracking-tight text-primary uppercase">Examination Instructions</h3>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[12px] font-black text-primary/40  tracking-[0.2em] mb-3 uppercase">01. Assessment Format</h4>
                    <p className="text-sm font-bold text-primary/60 leading-relaxed  tracking-wide">
                      This is a multi-item objective assessment. Question order and option sequences are randomized for each candidate to ensure maximum integrity.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[12px] font-black text-primary/40  tracking-[0.2em] mb-3 uppercase">02. Temporal Constraints</h4>
                    <p className="text-sm font-bold text-primary/60 leading-relaxed  tracking-wide">
                      You have <strong>{exams.reduce((acc, curr) => acc + (curr.durationMinutes || 30), 0)} minutes</strong> to complete the session. The system will <strong>automatically finalize</strong> and submit your progress upon duration expiration.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[12px] font-black text-primary/40  tracking-[0.2em] mb-3 uppercase">03. Navigation Controls</h4>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="bg-primary/5 text-[11px] font-black  py-1 border-primary/20">Next [N]</Badge>
                      <Badge variant="outline" className="bg-primary/5 text-[11px] font-black  py-1 border-primary/20">Prev [P]</Badge>
                      <Badge variant="outline" className="bg-primary/5 text-[11px] font-black  py-1 border-primary/20">A, B, C, D to Answer</Badge>
                      <Badge variant="outline" className="bg-primary/5 text-[11px] font-black  py-1 border-primary/20">Calculator [C]</Badge>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[12px] font-black text-primary/40  tracking-[0.2em] mb-3 uppercase">04. Submission Policy</h4>
                    <p className="text-sm font-bold text-primary/60 leading-relaxed  tracking-wide">
                      Once submitted, your session cannot be resumed. Ensure all flagged items have been reviewed via the Navigation Console.
                    </p>
                  </section>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-primary/10">
                <label className="flex items-start gap-4 mb-8 cursor-pointer group">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox" 
                      className="peer h-6 w-6 opacity-0 absolute inset-0 cursor-pointer z-10"
                      checked={acceptedInstructions}
                      onChange={(e) => setAcceptedInstructions(e.target.checked)}
                    />
                    <div className="h-6 w-6 border-2 border-primary/40 rounded-md bg-white transition-all peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary shrink-0 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-[14px] font-black text-primary  tracking-widest leading-loose uppercase">
                    I acknowledge that I have read and understood the examination protocols and system requirements.
                  </span>
                </label>

                <Button 
                  onClick={startExam} 
                  disabled={!acceptedInstructions}
                  className={cn(
                    "w-full h-16 rounded-2xl font-black  tracking-[0.2em] shadow-xl transition-all border-none",
                    acceptedInstructions 
                      ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20" 
                      : "bg-primary/10 text-primary/30 cursor-not-allowed shadow-none"
                  )}
                >
                  Authorize & Start
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-[48px] shadow-2xl shadow-primary/10 border border-primary/10 overflow-hidden"
        >
          <div className="p-12 text-center text-primary">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-12 h-12 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/10 shadow-lg shadow-primary/5"
            >
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-3xl font-black mb-3  tracking-tighter text-primary">Submit</h2>
            <p className="text-primary/40 font-bold  tracking-widest text-[10px] mb-12">Your examination has been Saved.</p>
            
            <div className="p-6 bg-primary/5 rounded-[20px] border border-primary/10 mb-12">
              <span className="block text-xl font-black text-primary  tracking-widest mb-3">Successful Submitted</span>
              <span className="text-[10px] font-black text-primary/20  tracking-[0.2em]">The administration will review your session. Results will be released according to the official schedule.</span>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={async () => {
                  if (logOut) await logOut();
                  navigate('/');
                }}
                className="h-16 bg-primary text-white hover:bg-primary/40 rounded-2xl font-black  tracking-[0.2em] text-[10px] border-none shadow-xl shadow-primary/20"
              >
                Logout
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden font-sans select-none bg-background text-primary"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header: Official Unified Exam Bar */}
      <header className="h-auto px-6 py-4 flex items-center justify-between shrink-0 border-b-2 border-primary/40 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">V</div>
          <div>
            <h1 className="text-base font-black  tracking-tight leading-none mb-1">CBT Examination</h1>
            <p className="text-[9px] text-primary/40 font-bold  tracking-widest">Official Portal &bull; Session Active</p>
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
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <div className={cn("w-1 h-1 rounded-full", isSaving ? "bg-sky-400 animate-pulse" : "bg-primary/20")} />
                <p className="text-[8px] font-black  text-primary/30">
                  {isSaving ? "Syncing" : "Cloud Active"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className={cn("text-[9px] font-black  tracking-widest leading-none mb-1", timeLeft !== null && timeLeft <= 300 ? "text-red-500" : "text-primary/30")}>Time</p>
            <p className={cn("text-2xl font-mono font-black tracking-tighter", timeLeft !== null && timeLeft <= 300 ? "text-red-500 animate-pulse" : "text-primary")}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </p>
          </div>

          <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-primary/10">
            <div className="text-right">
              <p className="text-xs font-black tracking-tight leading-none mb-1  truncate max-w-[100px]">{profile?.displayName}</p>
              <p className="text-[8px] text-primary/40 font-bold  tracking-widest">{user?.uid.slice(0, 10)}</p>
            </div>
            <div className="w-10 h-10 bg-primary/5 rounded-lg overflow-hidden flex items-center justify-center border border-primary/10 shadow-sm mr-2">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[8px] font-black text-primary/20 ">PH</span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSuspendSession}
            className="rounded-xl text-primary/30 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            title="Suspend & Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Visual Progress Bar */}
      <div className="h-1 bg-primary/5 w-full relative shrink-0 overflow-hidden border-b border-primary/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${answeredPercentage}%` }}
          className="absolute inset-y-0 left-0 bg-primary z-10 transition-all duration-500 shadow-[0_0_10px_oklch(var(--primary))] "
        />
      </div>

      {/* Subject Selector Nav (Unified Page Requirement) */}
      <nav className="bg-primary/[0.02] border-b-2 border-primary/40 flex px-6 shrink-0 h-12 items-center overflow-x-auto custom-scrollbar no-scrollbar">
        {exams.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => { setActiveExamIndex(idx); setCurrentQuestionIndex(0); }}
            className={cn(
              "h-full px-6 text-[12px] font-black  whitespace-nowrap transition-all border-r-2 border-primary/10",
              activeExamIndex === idx
                ? "bg-primary text-white shadow-lg"
                : "text-primary/40 hover:text-primary/60 hover:bg-primary/5"
            )}
          >
            {ex.subject}
            <span className="ml-2 text-[10px] opacity-60">
              ({Object.keys(answers).filter(id => questionsByExam[ex.id]?.some(q => q.id === id)).length}/{questionsByExam[ex.id]?.length || 0})
            </span>
          </button>
        ))}
        
        <div className="flex-1" />
        
        <button 
          onClick={() => setShowCalculator(!showCalculator)}
          className="h-8 px-4 bg-primary/5 hover:bg-primary/10 text-primary border-2 border-primary/40 rounded-lg font-black text-[9px] flex items-center gap-2  tracking-widest transition-all ml-4"
        >
          <CalcIcon className="w-3 h-3" />
          Calculator (C)
        </button>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <section className="flex-1 p-6 md:p-10 overflow-y-auto flex justify-center selection:bg-primary/10">
          <div className="max-w-3xl w-full">
            {!currentQuestion ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                 <HelpCircle className="w-16 h-16 mb-4" />
                 <h3 className="text-xl font-black ">No Item Loaded</h3>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeExamIndex}-${currentQuestionIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/5 text-primary border-2 border-primary/20 px-4 py-1.5 rounded-lg text-[12px] font-black  tracking-widest">
                        {exams[activeExamIndex]?.subject} &bull; Item {currentQuestionIndex + 1}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={cn(
                        "h-8 rounded-lg px-3 font-black  text-[9px] tracking-widest gap-2 transition-all",
                        flaggedQuestions.has(currentQuestion.id)
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "text-primary/30 hover:text-primary hover:bg-primary/5"
                      )}
                    >
                      <AlertTriangle className={cn("w-3 h-3", flaggedQuestions.has(currentQuestion.id) && "fill-current")} />
                      {flaggedQuestions.has(currentQuestion.id) ? "Flagged" : "Flag"}
                    </Button>
                  </div>

                  <h3 className="text-3xl md:text-4xl leading-snug font-black text-primary tracking-tight mb-8">
                    {currentQuestion.text}
                  </h3>

                  {currentQuestion.imageUrl && (
                    <div className="mb-8 rounded-3xl overflow-hidden border-4 border-primary/10 shadow-xl max-w-2xl mx-auto bg-white">
                      <img src={currentQuestion.imageUrl} alt="Question Graphic" className="w-full h-auto object-contain max-h-[400px]" />
                    </div>
                  )}

                  {currentQuestion.audioUrl && (
                    <div className="mb-8 p-6 bg-primary/5 rounded-3xl border-2 border-primary/10 flex items-center gap-6">
                      <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Volume2 className="w-6 h-6" />
                      </div>
                      <audio controls className="flex-1 h-10 accent-primary">
                        <source src={currentQuestion.audioUrl} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion.id] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          className={cn(
                            "group flex items-center p-4 rounded-2xl border-2 transition-all text-left",
                            isSelected
                              ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5"
                              : "border-primary/20 bg-white hover:border-primary/40"
                          )}
                        >
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl mr-8 shrink-0 transition-colors shadow-lg",
                            isSelected ? "bg-primary text-white" : "bg-primary/5 text-primary"
                          )}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className={cn("text-2xl font-black", isSelected ? "text-primary" : "text-primary/70")}>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Sidebar: Navigation Console */}
        <aside className="w-64 border-l-2 border-primary/40 bg-white flex flex-col shrink-0">
          <div className="p-6 flex flex-col h-full">
            <h3 className="text-[9px] font-black text-primary/30  tracking-[0.2em] mb-6">Subject Progress</h3>
            
            <ScrollArea className="flex-1 pr-2">
              <div className="grid grid-cols-4 gap-2 mb-8">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  const isFlagged = flaggedQuestions.has(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-[14px] font-black transition-all border-2 relative",
                        isCurrent 
                          ? "bg-primary text-white border-primary shadow-xl scale-110 z-10"
                          : isAnswered 
                          ? "bg-primary/5 text-primary border-primary/10"
                          : "bg-white text-primary/20 border-primary/5 hover:border-primary/20"
                      )}
                    >
                      {idx + 1}
                      {isFlagged && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="pt-6 border-t-2 border-primary/10 space-y-4">
              <div className="flex items-center justify-between text-[8px] font-black  text-primary/40 tracking-widest">
                <span>Total Answered</span>
                <span>{Object.keys(answers).length} Items</span>
              </div>
              <div className="h-1.5 bg-primary/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${answeredPercentage}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                 <div className="flex items-center gap-1.5 text-[7px] font-black  text-primary/30">
                    <div className="w-2 h-2 bg-primary rounded-sm" /> Current
                 </div>
                 <div className="flex items-center gap-1.5 text-[7px] font-black  text-primary/30">
                    <div className="w-2 h-2 bg-primary/5 border border-primary/10 rounded-sm" /> Answered
                 </div>
                 <div className="flex items-center gap-1.5 text-[7px] font-black  text-primary/30">
                    <div className="w-2 h-2 bg-amber-500 rounded-sm" /> Flagged
                 </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Controls */}
      <footer className="border-t border-primary/10 p-6 flex justify-between items-center bg-white/80 backdrop-blur-md">
        <div className="text-[9px] font-black text-primary/20  tracking-widest hidden lg:block">
          Use [A-D] to Select &bull; [N] Next &bull; [P] Prev
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0 && activeExamIndex === 0}
            onClick={() => {
               if (currentQuestionIndex > 0) {
                 setCurrentQuestionIndex(prev => prev - 1);
               } else if (activeExamIndex > 0) {
                 const prevIdx = activeExamIndex - 1;
                 setActiveExamIndex(prevIdx);
                 setCurrentQuestionIndex((questionsByExam[exams[prevIdx].id]?.length || 1) - 1);
               }
            }}
            className="px-6 h-12 bg-primary/5 text-primary font-black rounded-xl border-2 border-primary/10 hover:bg-primary/10  tracking-widest text-[9px] transition-all"
          >
            [P] Previous
          </Button>
          <Button
            onClick={() => {
               if (currentQuestionIndex < questions.length - 1) {
                 setCurrentQuestionIndex(prev => prev + 1);
               } else if (activeExamIndex < exams.length - 1) {
                 setActiveExamIndex(prev => prev + 1);
                 setCurrentQuestionIndex(0);
               }
            }}
            className="px-8 h-12 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:bg-primary/90  tracking-widest text-[9px] border-none transition-all"
          >
            {currentQuestionIndex === questions.length - 1 && activeExamIndex < exams.length - 1 ? "Next Subject" : "[N] Next Item"}
          </Button>
        </div>

        <Button
          onClick={() => { if(confirm("FINAL SUBMISSION: Are you sure you want to end all subject assessments?")) handleSubmit() }}
          disabled={isSubmitting}
          className="px-6 h-12 bg-red-500 text-white font-black rounded-xl  tracking-widest text-[9px] shadow-lg shadow-red-200 transition-all border-none hover:bg-red-600"
        >
          [S] Final Submit
        </Button>
      </footer>

      {/* Scientific Calculator */}
      <AnimatePresence>
        {showCalculator && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCalculator(false)} className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-white rounded-[32px] shadow-2xl border-2 border-primary/20 z-[101] overflow-hidden">
              <div className="bg-primary p-8 text-right">
                <div className="text-white/40 text-[9px] font-black  tracking-widest mb-1">Standard Calc</div>
                <div className="text-3xl font-mono font-black text-white truncate leading-none">{calcDisplay}</div>
              </div>
              <div className="p-6 grid grid-cols-4 gap-2 bg-white">
                {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'].map((btn) => (
                  <Button
                    key={btn}
                    variant={btn === '=' ? 'default' : 'secondary'}
                    onClick={() => {
                      if (btn === 'C') setCalcDisplay('0');
                      else if (btn === '=') { try { setCalcDisplay(eval(calcDisplay).toString()); } catch { setCalcDisplay('Error'); } }
                      else { setCalcDisplay(prev => prev === '0' ? btn : prev + btn); }
                    }}
                    className={cn(
                      "h-12 font-black rounded-xl text-sm transition-all",
                      btn === 'C' ? "col-span-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border-none" : "",
                      btn === '=' ? "col-span-2 bg-primary text-white hover:bg-primary/90 border-none" : "bg-primary/5 text-primary hover:bg-primary/10 border-none"
                    )}
                  >
                    {btn}
                  </Button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Unified Completion Summary */}
      <AnimatePresence>
        {isCompleted && (
          <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl border border-primary/10 overflow-hidden my-auto">
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/10 shadow-lg shadow-primary/5">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-black mb-2  tracking-tighter">Session Finalized</h2>
                <p className="text-primary/40 font-bold  tracking-widest text-[8px] mb-10">Data transmitted to secure server</p>

                <div className="space-y-3 mb-10 text-left">
                   <p className="text-[9px] font-black text-primary/30  tracking-[0.2em] px-4">Subject Summary</p>
                   {sessionResults.map((res, i) => (
                     <div key={i} className="p-4 bg-primary/5 rounded-2xl flex justify-between items-center border border-primary/5">
                        <div>
                          <p className="text-[10px] font-black  text-primary leading-none mb-1">{res.subject}</p>
                          <p className="text-[8px] font-bold text-primary/40 ">{res.title}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-black text-primary leading-none">{res.score}/{res.totalPossible}</p>
                           <p className="text-[7px] font-black text-primary/30 ">Raw pts</p>
                        </div>
                     </div>
                   ))}
                </div>

                <Button
                  onClick={async () => { if (logOut) await logOut(); navigate('/'); }}
                  className="w-full h-16 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black  tracking-widest text-[10px] border-none shadow-xl shadow-primary/20"
                >
                  Terminate and Logout
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
