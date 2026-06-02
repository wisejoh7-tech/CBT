import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Exam, Attempt } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/lib/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/lib/ui/card';
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  Settings, 
  LogOut, 
  GraduationCap,
  FileText,
  Bell,
  CheckCircle,
  Database,
  Printer,
  X,
  Shield,
  Trophy,
  Award
} from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/lib/ui/badge';
import { Separator } from '@/lib/ui/separator';
import { toast } from 'sonner';

export default function ExamDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [unifiedAttempt, setUnifiedAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<Attempt | null>(null);
  const [isPrintingSlip, setIsPrintingSlip] = useState(false);
  const { profile, user, logOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) return;

    // 1. Fetch Exams (Non-realtime is fine for list)
    async function fetchExams() {
      try {
        const examSnap = await getDocs(collection(db, 'exams'));
        let examList = examSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
        examList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (profile?.role === 'student') {
          if (profile.subjectCombination && profile.subjectCombination.length > 0) {
            // Strict filtering: Only show subjects registered in the candidate's combination
            // Using case-insensitive matching to handle variation in registry vs exam data
            examList = examList.filter(e =>
              profile.subjectCombination?.some(s => s.toLowerCase() === e.subject.toLowerCase())
            );

            // Deduplication: Only keep the most recent exam for each subject
            const uniqueSubjectsMap = new Map<string, Exam>();
            examList.forEach(e => {
              const lowerSub = e.subject.toLowerCase();
              if (!uniqueSubjectsMap.has(lowerSub)) {
                uniqueSubjectsMap.set(lowerSub, e);
              }
            });
            examList = Array.from(uniqueSubjectsMap.values());
          }
        }
        setExams(examList);
      } catch (error) { console.error(error); }
    }
    fetchExams();

    // 2. Real-time listener for Unified Attempt (To catch admin "Send" immediately)
    const searchIds = [user.uid, profile.examNumber, (profile as any).id].filter(Boolean) as string[];
    const qUnified = query(
      collection(db, 'attempts'),
      where('userId', 'in', searchIds),
      where('examId', '==', 'unified')
    );

    const unsubscribeUnified = onSnapshot(qUnified, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setUnifiedAttempt({ id: snap.docs[0].id, ...data });

        // Notify user if result was just released
        if (data.released && !unifiedAttempt?.released) {
          toast.success("OFFICIAL RESULTS RELEASED: Your performance transcript is now available.", {
            duration: 10000,
            icon: <Award className="w-5 h-5 text-sky-400" />
          });
        }
      }
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Unified listener permission denied - user may not be authorized to view results yet.");
      } else {
        console.error("Unified listener error:", error);
      }
      setLoading(false);
    });

    // 3. Real-time listener for all Attempts (To catch any released modules)
    const qAttempts = query(
      collection(db, 'attempts'),
      where('userId', 'in', searchIds)
    );

    const unsubscribeAttempts = onSnapshot(qAttempts, (snap) => {
      const attemptsMap: Record<string, Attempt> = {};
      snap.docs.forEach(doc => {
        attemptsMap[doc.id] = { id: doc.id, ...doc.data() } as Attempt;
      });
      setAttempts(Object.values(attemptsMap));
    }, (error) => {
      console.error("Attempts listener error:", error);
    });

    return () => {
      unsubscribeUnified();
      unsubscribeAttempts();
    };
  }, [profile, user]);

  const handlePrint = (attempt: Attempt) => {
    setSelectedResult(attempt);
    setTimeout(() => window.print(), 500);
  };

  const isAnyAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';
  const isExamFinished = unifiedAttempt?.status === 'completed' || unifiedAttempt?.released === true;
  const isResultReleased = unifiedAttempt?.released === true;
  const hasReleasedModules = attempts.some(a => (a as any).released && a.examId !== 'unified');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <header className="bg-white/80 backdrop-blur-md text-primary px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 border-b-2 border-primary/40 sticky top-0 z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-5"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="font-black text-xl">V</span>
          </div>
          <div>
            <h1 className="text-base font-black  tracking-tight leading-none">
              Candidate: <span className="text-primary/60 font-bold">{profile?.displayName}</span>
            </h1>
            <p className="text-[9px] text-primary/40 font-bold  tracking-[0.2em] mt-1">
              Terminal Authorized &bull; Session Active
            </p>
          </div>
        </motion.div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={logOut} className="rounded-full text-primary/40 hover:text-primary hover:bg-primary/5">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-8 space-y-12">
        {/* Profile Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="p-8 rounded-3xl border-2 border-primary/10 bg-white shadow-xl shadow-primary/5 lg:col-span-2">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                 <div className="w-32 h-32 rounded-3xl bg-primary/5 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                    {profile?.photoURL ? (
                       <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                       <GraduationCap className="w-12 h-12 text-primary/20" />
                    )}
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                      <h2 className="text-5xl font-black  tracking-tighter">{profile?.displayName}</h2>
                      {isExamFinished && (
                        <Badge className="bg-blue-600 text-white border-blue-600 px-6 py-2 rounded-full font-black  tracking-widest text-[14px] w-fit mx-auto md:mx-0 shadow-lg">
                          Examination Concluded
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-6">
                       <div>
                          <p className="text-[10px] font-black text-primary/40  tracking-widest mb-1">Candidate Registry Index</p>
                          <p className="text-xl font-black">{profile?.examNumber || 'PENDING'}</p>
                       </div>
                       {!isExamFinished && (
                         <>
                           <div>
                              <p className="text-[10px] font-black text-primary/40  tracking-widest mb-1">Date of Birth</p>
                              <p className="text-xl font-bold">{(profile as any)?.dateOfBirth || 'N/A'}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-primary/40  tracking-widest mb-1">Registry State</p>
                              <Badge className="bg-primary/5 text-primary text-[11px] font-black border-none  px-3 py-1">Lagos / Center-01</Badge>
                           </div>
                         </>
                       )}
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                       {profile?.subjectCombination?.map(s => (
                         <Badge key={s} className="bg-sky-400 text-white text-[11px] font-black border-none  px-5 py-2 shadow-sm">{s}</Badge>
                       ))}
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-8 rounded-2xl border-2 border-primary/20 bg-primary text-white shadow-xl">
                <div className="h-full flex flex-col justify-between">
                   <div>
                      <h3 className="text-xl font-black  tracking-tight mb-1">Documentation</h3>
                      <p className="text-white/40 text-[9px] font-bold  tracking-widest">Manage exam slips & results</p>
                   </div>
                   <div className="space-y-3 mt-8">
                      {!isExamFinished && (
                        <Button
                          onClick={() => { setIsPrintingSlip(true); setTimeout(() => { window.print(); setIsPrintingSlip(false); }, 500); }}
                          className="w-full h-11 bg-white text-primary hover:bg-white/90 rounded-xl font-bold  tracking-widest text-[9px] gap-2 border-none shadow-lg"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Exam Slip
                        </Button>
                      )}

                      {(isResultReleased || hasReleasedModules || isExamFinished) && (
                        <Button
                          onClick={() => {
                             if (isResultReleased || hasReleasedModules) {
                               navigate(`/result-slip/${profile?.examNumber}`);
                             } else {
                               toast.info("Your results are currently being verified by the administration.");
                             }
                          }}
                          disabled={!isResultReleased && !hasReleasedModules}
                          className={cn(
                            "w-full h-11 rounded-xl font-bold  tracking-widest text-[9px] gap-2 border-none shadow-lg transition-all animate-in zoom-in",
                            (isResultReleased || hasReleasedModules)
                              ? "bg-white text-primary hover:bg-white/90"
                              : "bg-white/20 text-white/40 cursor-not-allowed"
                          )}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Result Slip
                        </Button>
                      )}

                      {!isResultReleased && !hasReleasedModules && isExamFinished && (
                        <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-center">
                           <p className="text-[8px] font-black  tracking-widest leading-tight">
                              Official Results <br/> Under Verification
                           </p>
                        </div>
                      )}

                      {isAnyAdmin && (
                        <Button onClick={() => navigate('/admin')} className="w-full h-11 bg-white/10 text-white hover:bg-white/20 rounded-xl font-bold  tracking-widest text-[9px] border-none">
                          Admin Portal
                        </Button>
                      )}
                   </div>
                </div>
             </Card>
        </div>

        {/* Examination Action Section (HIDDEN IF FINISHED) */}
        {!isExamFinished && (
          <section>
            <div className="mb-8">
               <h2 className="text-sm font-black text-primary/30  tracking-[0.3em] flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Examination Terminal
               </h2>
            </div>

            {loading ? (
               <div className="h-48 bg-primary/5 rounded-[10px] animate-pulse border border-primary/10" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 <Card className="md:col-span-3 rounded-[32px] border-2 border-primary overflow-hidden shadow-2xl bg-white">
                    <div className="p-8 md:p-10">
                       <div className="flex justify-between items-start mb-8">
                          <div>
                             <h3 className="text-3xl font-black  tracking-tight mb-1"> Examination Session</h3>
                             <p className="text-[12px] font-black text-primary/40  tracking-widest">Authorized for {exams.length} Registered Subjects</p>
                          </div>
                          <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/10">
                             <PlayCircle className="w-6 h-6" />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                          {exams.map(ex => (
                             <div key={ex.id} className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-[7px] font-black text-primary/30  mb-1">Subject</p>
                                <p className="text-[10px] font-black  truncate">{ex.subject}</p>
                             </div>
                          ))}
                       </div>

                       <Button
                          onClick={() => navigate(`/exam/unified`)}
                          disabled={exams.length === 0}
                          className="w-full h-16 bg-primary hover:bg-primary/40 text-white rounded-2xl font-black  tracking-[0.3em] text-[11px] gap-4 transition-all shadow-xl shadow-primary/10"
                       >
                          START Examination
                       </Button>
                    </div>
                    <div className="bg-primary/5 p-3 text-center border-t border-primary/10">
                       <p className="text-[8px] font-black text-primary/30  tracking-widest">Authorized Terminal &bull; Secure Protocol Active</p>
                    </div>
                 </Card>

                 <div className="space-y-6">
                    <Card className="p-8 rounded-[24px] border-2 border-primary/10 bg-white shadow-xl">
                       <p className="text-[14px] font-black text-primary/40  tracking-widest mb-6 text-center">Session Metrics</p>
                       <div className="space-y-6">
                          <div className="flex justify-between items-end border-b border-primary/5 pb-4">
                             <span className="text-[12px] font-bold text-primary/30 ">Subject</span>

                             <span className="text-3xl font-black">{exams.length} </span>
                          </div>
                          <div className="flex justify-between items-end border-b border-primary/5 pb-4">
                             <span className="text-[12px] font-bold text-primary/30 ">Total Questions</span>
                             <span className="text-3xl font-black">{exams.reduce((acc, curr) => acc + (Number(curr.totalQuestions) || 0), 0)} </span>
                          </div>
                          <div className="flex justify-between items-end">
                             <span className="text-[12px] font-bold text-primary/30 ">Total Time</span>
                             <span className="text-3xl font-black">{exams.reduce((acc, curr) => acc + (parseInt(String(curr.durationMinutes)) || 0), 0)}m</span>
                          </div>
                       </div>
                    </Card>
                 </div>
              </div>
            )}
          </section>
        )}

        {/* Consolidated Result Section */}
        {isExamFinished && (
          <section className="space-y-8 py-6">
            <Card className="rounded-[32px] border-2 border-primary/10 bg-white shadow-2xl overflow-hidden p-8 text-center max-w-xl mx-auto">
                <div className="w-14 h-14 bg-primary/5 rounded-[20px] flex items-center justify-center mx-auto mb-6 border-2 border-primary/10">
                   <Printer className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-black text-primary  tracking-tighter mb-3 uppercase">Official Transcript Portal</h2>
                <p className="text-primary/40 font-bold  tracking-wide text-[10px] leading-relaxed uppercase mb-6 max-w-xs mx-auto">
                   Your examination session has concluded. To access your official verified results and performance analysis, please proceed to the result portal.
                </p>

                <div className="bg-rose-50 border-2 border-rose-100 rounded-xl p-4 mb-8 inline-block">
                    <p className="text-rose-500 font-black text-[9px]  tracking-[0.2em] uppercase flex items-center justify-center gap-2">
                       <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                       Mandatory: Use Landscape Orientation when printing
                       <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <Button
                    onClick={() => navigate(`/result-slip/${profile?.examNumber}`)}
                    className="h-12 px-10 rounded-xl bg-primary text-white font-black  text-[11px] tracking-widest gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/10 border-none"
                  >
                    <Printer className="w-5 h-5" />
                    Open Official Result Portal
                  </Button>
                  <p className="text-[9px] font-black text-primary/20  tracking-widest uppercase">
                    Authorized Access Only &bull; Session 2026
                  </p>
                </div>
            </Card>
          </section>
        )}


      </main>

      {/* Hidden Print Layouts */}
      <AnimatePresence>
        {isExamFinished && (
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-12">
            <div className="max-w-4xl mx-auto border-4 border-primary p-12 rounded-[48px] relative overflow-hidden h-full">
                <div className="text-center border-b-4 border-primary/10 pb-8 mb-12">
                   <h1 className="text-4xl font-black  tracking-tighter text-primary">OFFICIAL EXAMINATION TRANSCRIPT</h1>
                   <p className="text-sm font-bold text-primary/60  tracking-[0.4em] mt-2">2026 Registry Record &bull; Center-VIVI-01</p>
                </div>

                <div className="flex gap-10 mb-12">
                   <div className="w-40 h-40 rounded-[32px] bg-primary/5 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary/10 font-black text-4xl ">Photo</span>
                      )}
                   </div>
                   <div className="flex-1 grid grid-cols-2 gap-8 py-4">
                      <div>
                         <p className="text-[10px] font-black text-primary/30  tracking-widest mb-1">Legal Candidate Name</p>
                         <p className="text-2xl font-bold ">{profile?.displayName}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-primary/30  tracking-widest mb-1">Registration Index</p>
                         <p className="text-2xl font-bold">{profile?.examNumber}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-primary/30  tracking-widest mb-1">Date of Birth</p>
                         <p className="text-xl font-bold">{(profile as any)?.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-primary/30  tracking-widest mb-1">Terminal Signature</p>
                         <p className="text-xl font-bold  text-primary/60">Verified</p>
                      </div>
                   </div>
                </div>

                <div className="border-2 border-primary/10 rounded-[32px] overflow-hidden mb-12">
                   <table className="w-full">
                      <thead className="bg-primary/5">
                        <tr>
                           <th className="px-8 py-5 text-left text-[10px] font-black  tracking-widest text-primary">Assessment Module</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black  tracking-widest text-primary">Raw Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                         {unifiedAttempt.results && unifiedAttempt.results.length > 0 ? (
                           unifiedAttempt.results.map((res: any, i: number) => (
                             <tr key={i}>
                                <td className="px-8 py-5 text-sm font-black ">{res.subject}</td>
                                <td className="px-8 py-5 text-right font-bold text-lg">{Number(res.score) || 0} / {Number(res.totalPossible) || 0}</td>
                             </tr>
                           ))
                         ) : (
                           <tr>
                              <td className="px-8 py-5 text-sm font-black ">{unifiedAttempt.subject || "Unified Assessment"}</td>
                              <td className="px-8 py-5 text-right font-bold text-lg">{Number(unifiedAttempt.score) || 0} / {Number(unifiedAttempt.totalPossible) || 0}</td>
                           </tr>
                         )}
                      </tbody>
                      <tfoot className="bg-primary text-white font-black ">
                         <tr>
                            <td className="px-8 py-8 text-base">Cumulative Session Total</td>
                            <td className="px-8 py-8 text-right text-3xl">
                               {unifiedAttempt.results.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0)}
                               <span className="text-sm opacity-40 ml-2">pts</span>
                            </td>
                         </tr>
                      </tfoot>
                   </table>
                </div>

                <div className="border-t-2 border-primary/10 pt-10 text-center mt-auto">
                   <p className="text-[9px] font-bold text-primary/20  tracking-[0.5em] mb-4">Authenticity ID: {unifiedAttempt.id}</p>
                   <p className="text-[10px] font-bold text-primary/10  tracking-[0.2em]">This is an automated performance report generated by the VIVI Examination System.</p>
                </div>
            </div>
          </div>
        )}

        {selectedResult && (
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
             <div className="max-w-2xl mx-auto border-2 border-primary p-8 rounded-[32px] relative overflow-hidden">
                <div className="text-center border-b-2 border-primary/10 pb-6 mb-8">
                   <h1 className="text-2xl font-black  tracking-tighter text-primary">OFFICIAL PERFORMANCE REPORT</h1>
                   <p className="text-[10px] font-bold text-primary/60  tracking-[0.3em] mt-1">2026 Unified Examination Session</p>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8 text-left">
                   <div>
                      <p className="text-[8px] font-black text-primary/30  tracking-widest">Candidate</p>
                      <p className="text-lg font-bold ">{profile?.displayName}</p>
                      <p className="text-xs font-bold text-primary/40">{profile?.examNumber}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-primary/30  tracking-widest">Subject</p>
                      <p className="text-lg font-bold ">{exams.find(e => e.id === selectedResult.examId)?.title || "Examination Module"}</p>
                   </div>
                </div>
                <div className="bg-primary/5 rounded-[24px] p-8 border-2 border-primary/10 text-center">
                   <p className="text-[9px] font-black text-primary/40  tracking-[0.4em] mb-2">Aggregate Score</p>
                   <div className="flex items-center justify-center gap-4">
                      <span className="text-6xl font-black text-primary">{selectedResult.score}</span>
                      <Separator orientation="vertical" className="h-10 bg-primary/20" />
                      <span className="text-2xl font-black text-primary/30">{selectedResult.totalPossible}</span>
                   </div>
                   <div className="mt-6">
                      <Badge className="bg-primary text-white text-sm font-black px-6 py-1.5 rounded-xl border-none">
                        {Math.round((selectedResult.score / (selectedResult.totalPossible || 1)) * 100)}% PROFICIENCY
                      </Badge>
                   </div>
                </div>
                <div className="text-center mt-8 pt-6 border-t border-primary/5">
                   <p className="text-[7px] font-bold text-primary/20  tracking-[0.5em]">Authenticity ID: {selectedResult.id}</p>
                </div>
             </div>
          </div>
        )}

        {isPrintingSlip && (
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
             <div className="max-w-2xl mx-auto border-2 border-primary p-8 rounded-[32px] relative overflow-hidden">
                <div className="text-center border-b-2 border-primary/10 pb-6 mb-8">
                   <h1 className="text-2xl font-black  tracking-tighter text-primary">EXAMINATION SLIP</h1>
                   <p className="text-[10px] font-bold text-primary/60  tracking-[0.3em] mt-1">Registry Record &bull; 2026 Session</p>
                </div>
                <div className="flex gap-8 mb-8">
                   <div className="w-24 h-24 bg-primary/5 rounded-2xl border-2 border-primary/10 flex items-center justify-center overflow-hidden">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary/10 font-black text-2xl ">Photo</span>
                      )}
                   </div>
                   <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[8px] font-black text-primary/30  tracking-widest">Full Name</p>
                         <p className="text-base font-bold ">{profile?.displayName}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-primary/30  tracking-widest">Reg Number</p>
                         <p className="text-base font-bold">{profile?.examNumber}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-primary/30  tracking-widest">DOB</p>
                         <p className="text-base font-bold">{(profile as any)?.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-primary/30  tracking-widest">Terminal</p>
                         <p className="text-sm font-bold  text-primary/60">Center-VIVI-01</p>
                      </div>
                   </div>
                </div>
                <div className="pt-6 border-t-2 border-primary/10 text-left">
                   <p className="text-[9px] font-black text-primary/40  tracking-widest mb-3">Assessment Combination</p>
                   <div className="flex flex-wrap gap-2 mb-6">
                      {profile?.subjectCombination?.map(s => (
                        <Badge key={s} className="bg-primary/5 text-primary text-[8px] font-black border-none  px-3">{s}</Badge>
                      ))}
                   </div>
                   <div className="p-4 bg-primary/5 rounded-xl border border-primary/5">
                      <p className="text-[8px] font-black text-primary/40  tracking-widest mb-2">Instructions</p>
                      <ul className="text-[8px] font-bold text-primary/60  space-y-1 list-disc pl-4">
                        <li>Maintain total silence in the terminal.</li>
                        <li>Calculators must be accessed only via the on-screen console.</li>
                        <li>Proctoring software is active on this device.</li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
