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
  CheckCircle2
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  
  // Anti-cheat states
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize GenAI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    async function initExam() {
      if (!examId) return;
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (!examDoc.exists()) throw new Error("Exam not found");
        
        const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
        setExam(examData);
        setTimeLeft(examData.durationMinutes * 60);

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
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    if (timeLeft === 300) toast.warning("5 minutes remaining!");
    if (timeLeft === 60) toast.error("1 minute remaining! Finalize your answers.");

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isCompleted, hasStarted]);

  const startExam = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
      setIsFullscreen(true);
    } catch (e) {
      toast.error("Fullscreen needed to start the exam.");
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleSubmit = async () => {
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
      setIsCompleted(true);
      toast.success("Examination submitted successfully!");
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
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

  if (loading) return <div className="flex items-center justify-center h-screen bg-transparent text-white font-bold animate-pulse">SETTING UP SECURE SESSION...</div>;

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white/5 rounded-[40px] shadow-2xl p-12 border border-white backdrop-blur-xl"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Secure Exam Guidelines</h2>
            <div className="text-left space-y-4 mb-10">
              <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/20">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                <p className="text-sm text-white font-medium">Entering Fullscreen mode is <strong>required</strong> for this examination.</p>
              </div>
              <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/20">
                <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                <p className="text-sm text-white font-medium">Any attempt to switch tabs or minimize the browser will be flagged as a violation.</p>
              </div>
              <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/20">
                <Clock className="w-5 h-5 text-white shrink-0" />
                <p className="text-sm text-white font-medium">Questions are randomized. Your timer begins once you click "Start Examination".</p>
              </div>
            </div>
            <Button 
              onClick={startExam} 
              className="w-full h-16 bg-white hover:bg-white text-primary rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 transition-all border-none"
            >
              Start Examination
            </Button>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-6">By starting, you agree to the examination monitoring policy.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white/5 rounded-[40px] shadow-2xl border border-white backdrop-blur-xl overflow-hidden"
        >
          <div className="p-12 text-center text-white">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Result Summary</h2>
            <p className="text-white/60 font-medium mb-8">Examination completed successfully.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
                <span className="block text-3xl font-black text-white">{score} / {questions.length}</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Score</span>
              </div>
              <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
                <span className="block text-3xl font-black text-white">{Math.round((score / questions.length) * 100)}%</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Percentage</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/dashboard')} className="h-14 bg-white text-primary hover:bg-white/90 rounded-2xl font-bold uppercase tracking-wide border-none">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
  className="h-screen flex flex-col overflow-hidden font-sans select-none"
  onContextMenu={(e) => e.preventDefault()}
>
      {/* Header: Official Exam Navigation Bar */}
      <header className="h-auto px-6 py-4 flex items-center justify-between shrink-0 border-b border-white bg-white/10 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xl uppercase">
            {exam?.title.charAt(0) || 'E'}
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight uppercase tracking-tight">{exam?.title}</h1>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">{exam?.subject} &bull; UNIFIED EXAMINATION</p>
          </div>
        </div>
        
        <div className="flex space-x-8 items-center">
          <div className="text-right">
            <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Time Remaining</p>
            <p className="text-2xl font-mono font-bold tracking-tighter text-white">
              {timeLeft !== null ? formatTime(timeLeft) : "--:--:--"}
            </p>
          </div>
          <div className="h-10 w-px bg-white/20 hidden md:block"></div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-bold tracking-tight">{profile?.displayName}</p>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Reg No: {user?.uid.slice(0, 12).toUpperCase()}</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded overflow-hidden flex items-center justify-center border border-white/20">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-white/40">PHOTO</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Subject Selector Nav */}
      <nav className="bg-white/5 border-b border-white flex px-6 shrink-0 h-12 text-white">
        <button className="px-6 py-3 text-sm font-bold bg-white text-primary uppercase">General Content</button>
        <button className="px-6 py-3 text-sm font-semibold opacity-40 cursor-not-allowed uppercase">Instructions</button>
      </nav>

      {/* Main Exam Body */}
      <main className="flex-1 flex overflow-hidden">
        {/* Question Section */}
        <section className="flex-1 p-8 overflow-y-auto flex justify-center text-white">
          <div className="max-w-3xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="flex items-center space-x-2 mb-6">
                  <span className="bg-white text-primary px-3 py-1 rounded text-sm font-bold uppercase tracking-wide">
                    QUESTION {currentQuestionIndex + 1}
                  </span>
                  <span className="text-white/40 text-sm font-bold">of {questions.length}</span>
                </div>
                
                <p className="text-xl leading-relaxed font-medium text-white mb-10">
                  {currentQuestion?.text}
                </p>

                <div className="space-y-4">
                  {currentQuestion?.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={cn(
                        "w-full flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all group",
                        answers[currentQuestion.id] === idx 
                          ? "border-white bg-white/20" 
                          : "border-white/20 hover:bg-white/10 hover:border-white"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        answers[currentQuestion.id] === idx 
                          ? "border-white bg-white" 
                          : "border-white/40 group-hover:border-white"
                      )}>
                        {answers[currentQuestion.id] === idx && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </div>
                      <span className={cn(
                        "ml-4 text-lg text-left",
                        answers[currentQuestion.id] === idx ? "text-white font-bold" : "text-white/80 font-medium"
                      )}>
                        {String.fromCharCode(65 + idx)}. {option}
                      </span>
                    </button>
                  ))}
                </div>

                {explanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white/10 border border-white rounded-2xl"
                  >
                    <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-[10px] mb-3">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Assistance Insight
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed italic">{explanation}</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar: Status & Navigation */}
        <aside className="w-80 border-l border-white bg-white/5 flex flex-col shrink-0 text-white">
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Question Progress</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded text-xs font-bold transition-all border border-white/20",
                    currentQuestionIndex === idx 
                      ? "bg-white text-primary ring-4 ring-white/20 border-none" 
                      : answers[q.id] !== undefined
                        ? "bg-white/40 text-white border-none"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-10 space-y-3">
              <div className="flex items-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <div className="w-3 h-3 bg-white/40 rounded-sm mr-2"></div> Answered
              </div>
              <div className="flex items-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <div className="w-3 h-3 bg-white rounded-sm mr-2"></div> Current
              </div>
              <div className="flex items-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <div className="w-3 h-3 border border-white/20 rounded-sm mr-2"></div> Unvisited
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-lg text-white border-white bg-white/10 hover:bg-white/20 font-bold uppercase text-[10px] tracking-widest"
              onClick={handleExplain}
              disabled={explaining}
            >
              <Lightbulb className={cn("w-3.5 h-3.5", explaining && "animate-spin")} />
              {explaining ? "Consulting..." : "Explain Option"}
            </Button>
          </div>
        </aside>
      </main>

      {/* Bottom Control Bar */}
      <footer className="border-t border-white p-6 flex justify-between items-center shrink-0 bg-white/5">
        <div className="flex space-x-4">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="px-8 py-6 bg-white/10 text-white font-bold rounded-xl border border-white hover:bg-white/20 uppercase tracking-widest text-xs"
          >
            Previous
          </Button>
          <Button
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="px-10 py-6 bg-white text-primary font-bold rounded-xl shadow-xl shadow-black/10 hover:bg-white/90 uppercase tracking-widest text-xs border-none"
          >
            Next
          </Button>
        </div>
        <Button 
          onClick={() => { if(confirm("Are you sure you want to finalize your exam?")) handleSubmit() }}
          disabled={isSubmitting}
          className="px-8 py-6 bg-white/20 hover:bg-white/30 text-white border-white border font-bold rounded-xl uppercase tracking-widest text-xs transition-all"
        >
          {isSubmitting ? "Submitting..." : "Submit Exam"}
        </Button>
      </footer>
    </div>
  );
}
