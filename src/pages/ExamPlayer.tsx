import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Exam, Question, Attempt } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
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
  RefreshCw
} from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { GoogleGenAI } from "@google/genai";
import { shuffleArray } from '@/src/lib/utils/shuffle';

export default function ExamPlayer() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [acceptedInstructions, setAcceptedInstructions] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const timerKey = user ? `exam_timer_${user.uid}_${examId}` : null;
  const startedKey = user ? `exam_started_${user.uid}_${examId}` : null;
  const answersKey = user ? `exam_answers_${user.uid}_${examId}` : null;

  // Initialize GenAI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Anti-cheat states
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isCompleted) return;
    setIsSubmitting(true);

    try {
      let finalScore = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correctOptionIndex) {
          finalScore++;
        }
      });
      setScore(finalScore);

      const attemptData = {
        userId: user!.uid,
        examId: examId!,
        score: finalScore,
        totalPossible: questions.length,
        answers,
        startedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        status: 'completed'
      };

      await addDoc(collection(db, 'attempts'), attemptData);
      
      // Clear persistence keys
      if (timerKey) localStorage.removeItem(timerKey);
      if (startedKey) localStorage.removeItem(startedKey);
      if (answersKey) localStorage.removeItem(answersKey);

      setIsCompleted(true);
      toast.success("Examination submitted successfully!");
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isCompleted, questions, answers, user, examId, timerKey, startedKey, answersKey]);

  useEffect(() => {
    async function initExam() {
      if (!examId) return;
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (!examDoc.exists()) throw new Error("Exam not found");
        
        const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
        setExam(examData);
        
        // Restore from Local Storage
        const storedEndTime = timerKey ? localStorage.getItem(timerKey) : null;
        const storedStarted = startedKey ? localStorage.getItem(startedKey) : null;
        const storedAnswers = answersKey ? localStorage.getItem(answersKey) : null;

        if (storedStarted === 'true' && storedEndTime) {
          setHasStarted(true);
          const endTimestamp = parseInt(storedEndTime);
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTimestamp - now) / 1000));
          
          if (remaining <= 0) {
            setTimeLeft(0);
            // This will trigger auto-submit in the timer effect
          } else {
            setTimeLeft(remaining);
          }
        } else {
          setTimeLeft(examData.durationMinutes * 60);
        }

        if (storedAnswers) {
          try {
            setAnswers(JSON.parse(storedAnswers));
          } catch (e) {
            console.error("Failed to restore answers", e);
          }
        }

        const qSnap = await getDocs(collection(db, 'exams', examId, 'questions'));
        let qList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        
        // Anti-cheat: Shuffle questions for each session
        qList = shuffleArray(qList);
        
        // Anti-cheat: Shuffle options for each question
        qList = qList.map(q => {
          const originalOptions = [...q.options];
          const correctText = originalOptions[q.correctOptionIndex];
          const shuffledOptions = shuffleArray(originalOptions);
          const newCorrectIndex = shuffledOptions.indexOf(correctText);
          return { ...q, options: shuffledOptions, correctOptionIndex: newCorrectIndex };
        });

        setQuestions(qList);
      } catch (error) {
        console.error("Error setting up exam:", error);
        toast.error("Failed to load examination.");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    initExam();
  }, [examId, navigate]);

  const currentQuestion = questions[currentQuestionIndex];

  // JAMB Keyboard Navigation
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
      
      const endTime = Date.now() + (timeLeft || 0) * 1000;
      if (timerKey) localStorage.setItem(timerKey, endTime.toString());
      if (startedKey) localStorage.setItem(startedKey, 'true');
      
      setHasStarted(true);
      setIsFullscreen(true);
    } catch (e) {
      toast.error("Fullscreen needed to start the exam.");
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted) return;
    setIsSaving(true);
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [currentQuestion.id]: optionIndex
      };
      if (answersKey) {
        localStorage.setItem(answersKey, JSON.stringify(newAnswers));
        setLastSaved(new Date());
      }
      return newAnswers;
    });
    // Visual feedback delay
    setTimeout(() => setIsSaving(false), 800);
  };

  useEffect(() => {
    if (isCompleted || !hasStarted) return;

    const autoSaveInterval = setInterval(() => {
      if (answersKey && Object.keys(answers).length > 0) {
        setIsSaving(true);
        localStorage.setItem(answersKey, JSON.stringify(answers));
        setLastSaved(new Date());
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(autoSaveInterval);
  }, [answers, answersKey, isCompleted, hasStarted]);

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
    if (!currentQuestion) return;
    setExplaining(true);
    setExplanation(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain clearly why the correct answer to this question is option ${currentQuestion.correctOptionIndex + 1}: ${currentQuestion.text}. Options: ${currentQuestion.options.join(', ')}`,
      });
      setExplanation(response.text || "No explanation available.");
    } catch (error) {
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
                className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 border-2 border-primary/40 shadow-xl shadow-primary/5"
              >
                <Lock className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-primary">Secure Portal</h2>
              <p className="text-primary/40 font-bold uppercase tracking-widest text-[10px] mb-8">Candidate Integrity Protocol v2.4</p>
              
              <div className="space-y-3 w-full text-left">
                <div className="p-4 bg-white rounded-2xl border border-primary/10 flex gap-3">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[9px] font-black uppercase text-primary/60 tracking-wider">Fullscreen Enforcement Active</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-primary/10 flex gap-3">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[9px] font-black uppercase text-primary/60 tracking-wider">Tab-Switching Prohibited</p>
                </div>
              </div>
            </div>

            {/* Right Column: Instructions & Confirmation */}
            <div className="md:w-7/12 p-12 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-4 max-h-[500px] mb-8 custom-scrollbar">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-black uppercase tracking-tight text-primary">Examination Instructions</h3>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-3">01. Assessment Format</h4>
                    <p className="text-xs font-bold text-primary/60 leading-relaxed uppercase tracking-wide">
                      This is a multi-item objective assessment. Question order and option sequences are randomized for each candidate to ensure maximum integrity.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-3">02. Temporal Constraints</h4>
                    <p className="text-xs font-bold text-primary/60 leading-relaxed uppercase tracking-wide">
                      You have <strong>{exam?.durationMinutes} minutes</strong> to complete the session. The system will <strong>automatically finalize</strong> and submit your progress upon duration expiration.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-3">03. Navigation Controls</h4>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="bg-primary/5 text-[9px] font-black uppercase py-1 border-primary/20">Next [N]</Badge>
                      <Badge variant="outline" className="bg-primary/5 text-[9px] font-black uppercase py-1 border-primary/20">Prev [P]</Badge>
                      <Badge variant="outline" className="bg-primary/5 text-[9px] font-black uppercase py-1 border-primary/20">A, B, C, D to Answer</Badge>
                      <Badge variant="outline" className="bg-primary/5 text-[9px] font-black uppercase py-1 border-primary/20">Calculator [C]</Badge>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-3">04. Submission Policy</h4>
                    <p className="text-xs font-bold text-primary/60 leading-relaxed uppercase tracking-wide">
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
                      className="peer h-5 w-5 opacity-0 absolute inset-0 cursor-pointer z-10"
                      checked={acceptedInstructions}
                      onChange={(e) => setAcceptedInstructions(e.target.checked)}
                    />
                    <div className="h-5 w-5 border-2 border-primary/40 rounded-md bg-white transition-all peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary shrink-0 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-loose">
                    I acknowledge that I have read and understood the examination protocols and system requirements.
                  </span>
                </label>

                <Button 
                  onClick={startExam} 
                  disabled={!acceptedInstructions}
                  className={cn(
                    "w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all border-none",
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
          <div className="p-16 text-center text-primary">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/10 shadow-lg shadow-primary/5"
            >
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </motion.div>
            <h2 className="text-5xl font-black mb-3 uppercase tracking-tighter text-primary">Result Summary</h2>
            <p className="text-primary/40 font-bold uppercase tracking-widest text-[10px] mb-12">Examination completed successfully.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="p-10 bg-primary/5 rounded-[32px] border border-primary/10 transition-transform hover:scale-[1.02]">
                <span className="block text-5xl font-black text-primary leading-none mb-3">{score} / {questions.length}</span>
                <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Total Items Answered</span>
              </div>
              <div className="p-10 bg-primary/5 rounded-[32px] border border-primary/10 transition-transform hover:scale-[1.02]">
                <span className="block text-5xl font-black text-primary leading-none mb-3">{Math.round((score / questions.length) * 100)}%</span>
                <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Final Percentage Score</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="h-16 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border-none shadow-xl shadow-primary/20"
              >
                Return to Portal Dashboard
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
      {/* Header: Official Exam Navigation Bar */}
      <header className="h-auto px-8 py-5 flex items-center justify-between shrink-0 border-b-2 border-primary/40 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
            {exam?.title.charAt(0) || 'E'}
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight leading-none mb-1">{exam?.title}</h1>
            <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">{exam?.subject} &bull; UNIFIED EXAMINATION</p>
          </div>
        </div>
        
        <div className="flex gap-10 items-center">
          <div className="flex items-center gap-4 text-right pr-4 border-r border-primary/10">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  isSaving ? "bg-green-500 animate-pulse" : "bg-primary/20"
                )} />
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/30">
                  {isSaving ? "Syncing..." : lastSaved ? `Autosaved ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Pending Sync"}
                </p>
              </div>
              <p className="text-[10px] font-bold text-primary/20 uppercase tracking-tighter">Secure Backup Active</p>
            </div>
            {isSaving && (
              <motion.div 
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-3 h-3 text-primary/40" />
              </motion.div>
            )}
          </div>

          <div className="text-right">
            <p className={cn(
              "text-[10px] font-black uppercase tracking-widest leading-none mb-1 transition-colors",
              timeLeft !== null && timeLeft <= 300 ? "text-red-500" : "text-primary/30"
            )}>Time Remaining</p>
            <p className={cn(
              "text-3xl font-mono font-black tracking-tighter transition-colors",
              timeLeft !== null && timeLeft <= 300 ? "text-red-500 animate-pulse" : "text-primary"
            )}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--:--"}
            </p>
          </div>
          <Separator orientation="vertical" className="h-10 bg-primary/10 hidden md:block" />
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-black tracking-tight leading-none mb-1 uppercase">{profile?.displayName}</p>
              <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest leading-none">Reg No: {user?.uid.slice(0, 12).toUpperCase()}</p>
            </div>
            <div className="w-12 h-12 bg-primary/5 rounded-xl overflow-hidden flex items-center justify-center border border-primary/10 shadow-md">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-black text-primary/20 uppercase tracking-tighter">PH</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Visual Progress Bar */}
      <div className="h-1.5 bg-primary/5 w-full relative shrink-0 overflow-hidden border-b border-primary/5">
        {/* Navigation Progress */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${currentPercentage}%` }}
          className="absolute inset-y-0 left-0 bg-primary/5 z-0 transition-all duration-300"
        />
        {/* Answered Progress (Solid) */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${answeredPercentage}%` }}
          className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_oklch(var(--primary)_/_0.3)] z-10 transition-all duration-500"
        />
        {/* Marker for Current Question */}
        <motion.div 
          animate={{ left: `${currentPercentage}%` }}
          className="absolute top-0 -translate-x-1/2 w-1.5 h-full bg-primary z-20 shadow-[0_0_8px_oklch(var(--primary))]"
        />
      </div>

      {/* Subject Selector Nav */}
      <nav className="bg-primary/[0.02] border-b-2 border-primary/40 flex px-8 shrink-0 h-14 items-center">
        <button className="h-full px-8 text-[11px] font-black bg-primary text-white uppercase whitespace-nowrap shadow-xl shadow-primary/20">
          {exam?.subject || 'SUBJECT 1'}
        </button>
        <button className="h-full px-8 text-[11px] font-bold text-primary/30 cursor-not-allowed uppercase whitespace-nowrap hover:text-primary/50 transition-colors">
          Use of English
        </button>
        <button className="h-full px-8 text-[11px] font-bold text-primary/30 cursor-not-allowed uppercase whitespace-nowrap hover:text-primary/50 transition-colors">
          Mathematics
        </button>
        <button className="h-full px-8 text-[11px] font-bold text-primary/30 cursor-not-allowed uppercase whitespace-nowrap hover:text-primary/50 transition-colors">
          Physics
        </button>
        
        <div className="flex-1" />
        
        <button 
          onClick={() => setShowCalculator(!showCalculator)}
          className="h-10 px-6 bg-primary/5 hover:bg-primary/10 text-primary border-2 border-primary/40 rounded-xl font-black text-[10px] flex items-center gap-3 uppercase tracking-widest transition-all"
        >
          <CalcIcon className="w-3.5 h-3.5" />
          On-Screen Calculator (C)
        </button>
      </nav>

      {/* Main Exam Body */}
      <main className="flex-1 flex overflow-hidden">
        {/* Question Section */}
        <section className="flex-1 p-8 md:p-12 overflow-y-auto flex justify-center selection:bg-primary/10">
          <div className="max-w-4xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-12"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="bg-primary text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <span className="text-primary/30 text-xs font-bold uppercase tracking-widest">of {questions.length} Items</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={cn(
                      "h-10 rounded-xl px-4 font-black uppercase text-[10px] tracking-widest gap-2 transition-all",
                      flaggedQuestions.has(currentQuestion.id) 
                        ? "bg-amber-50 text-amber-600 hover:bg-amber-100" 
                        : "text-primary/40 hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <AlertTriangle className={cn("w-3.5 h-3.5", flaggedQuestions.has(currentQuestion.id) && "fill-current")} />
                    {flaggedQuestions.has(currentQuestion.id) ? "Flagged for Review" : "Flag for Review"}
                  </Button>
                </div>
                
                <h3 className="text-2xl md:text-3xl leading-[1.3] font-bold text-primary tracking-tight">
                  {currentQuestion?.text}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {currentQuestion?.options.map((option, idx) => {
                    const isSelected = answers[currentQuestion.id] === idx;
                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectOption(idx)}
                        className={cn(
                          "group relative flex items-center p-6 rounded-3xl border-2 transition-all text-left overflow-hidden",
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" 
                            : "border-primary/40 bg-white hover:border-primary/60 hover:shadow-lg"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mr-6 shrink-0 transition-colors",
                          isSelected ? "bg-primary text-white" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={cn(
                          "text-lg font-semibold transition-colors",
                          isSelected ? "text-primary" : "text-primary/70"
                        )}>{option}</span>
                        
                        {isSelected && (
                          <motion.div 
                            layoutId="check"
                            className="absolute right-8"
                          >
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {explanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-primary/[0.03] border-2 border-primary/30 rounded-[32px]"
                  >
                    <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4">
                      <Lightbulb className="w-4 h-4" />
                      Assistance Insight
                    </div>
                    <p className="text-primary/60 text-lg leading-relaxed italic font-medium">{explanation}</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar: Status & Navigation */}
        <aside className="w-80 border-l-2 border-primary/40 bg-white flex flex-col shrink-0 text-primary h-full">
          <div className="p-8 flex flex-col h-full">
            <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-8">Navigation Console</h3>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-4 gap-3 mb-12">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  const isFlagged = flaggedQuestions.has(q.id);
                  return (
                    <motion.button
                      key={q.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border-2 relative",
                        isCurrent 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : isAnswered 
                          ? "bg-primary/5 text-primary border-primary/20" 
                          : "bg-white text-primary/30 border-primary/5 hover:border-primary/20"
                      )}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="mt-8 space-y-4 pt-10 border-t-2 border-primary/10">
              <div className="flex items-center justify-between text-[10px] text-primary/60 font-black uppercase tracking-widest">
                <span>Completed</span>
                <span>{Object.keys(answers).length} / {questions.length}</span>
              </div>
              <div className="h-2 bg-primary/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${answeredPercentage}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
                <div className="flex items-center gap-2 text-[9px] text-primary/40 font-black uppercase tracking-widest">
                  <div className="w-3 h-3 bg-primary rounded shadow-sm"></div> Current
                </div>
                <div className="flex items-center gap-2 text-[9px] text-primary/40 font-black uppercase tracking-widest">
                  <div className="w-3 h-3 bg-primary/5 border border-primary/10 rounded"></div> Answered
                </div>
                <div className="flex items-center gap-2 text-[9px] text-primary/40 font-black uppercase tracking-widest">
                  <div className="w-3 h-3 border border-primary/5 rounded bg-white"></div> Unvisited
                </div>
                <div className="flex items-center gap-2 text-[9px] text-primary/40 font-black uppercase tracking-widest">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div> Flagged
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t-2 border-primary/40 flex flex-col gap-4">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl text-primary border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest gap-3"
              onClick={handleExplain}
              disabled={explaining}
            >
              <Lightbulb className={cn("w-4 h-4", explaining && "animate-spin text-primary")} />
              {explaining ? "Consulting AI..." : "Explain This Option"}
            </Button>
          </div>
        </aside>
      </main>

      {/* Bottom Control Bar */}
      <footer className="border-t border-primary/10 p-8 flex justify-between items-center shrink-0 bg-white/80 backdrop-blur-md">
        <div className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] hidden xl:block">
          Keyboard Shortcuts: [A-D] Select &bull; [N] Next &bull; [P] Prev &bull; [S] Submit &bull; [C] Calc
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="px-10 h-16 bg-primary/5 text-primary font-black rounded-2xl border-2 border-primary/10 hover:bg-primary/10 uppercase tracking-widest text-[10px] shadow-lg shadow-primary/5 transition-all"
          >
            [P] Previous
          </Button>
          <Button
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="px-12 h-16 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 uppercase tracking-widest text-[10px] border-none transition-all"
          >
            [N] Next Item
          </Button>
        </div>
        <Button 
          onClick={() => { if(confirm("Are you sure you want to finalize your exam?")) handleSubmit() }}
          disabled={isSubmitting}
          className="px-10 h-16 bg-primary/5 hover:bg-primary/10 text-primary border-2 border-primary/10 font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all"
        >
          [S] Submit Examination
        </Button>
      </footer>

      {/* Calculator Modal */}
      <AnimatePresence>
        {showCalculator && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalculator(false)}
              className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-[40px] shadow-2xl border border-primary/10 z-[101] overflow-hidden"
            >
              <div className="bg-primary p-10 text-right">
                <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Scientific Calc</div>
                <div className="text-4xl font-mono font-black text-white truncate leading-none">{calcDisplay}</div>
              </div>
              <div className="p-8 grid grid-cols-4 gap-3">
                {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'].map((btn) => (
                  <Button
                    key={btn}
                    variant={btn === '=' ? 'default' : 'secondary'}
                    onClick={() => {
                      if (btn === 'C') setCalcDisplay('0');
                      else if (btn === '=') {
                        try { setCalcDisplay(eval(calcDisplay).toString()); } catch { setCalcDisplay('Error'); }
                      }
                      else {
                        setCalcDisplay(prev => prev === '0' ? btn : prev + btn);
                      }
                    }}
                    className={cn(
                      "h-14 font-black rounded-2xl text-base transition-all",
                      btn === 'C' ? "col-span-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border-none" : "",
                      btn === '=' ? "col-span-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 border-none" : "bg-primary/5 text-primary hover:bg-primary/10 border-none"
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
    </div>
  );
}
