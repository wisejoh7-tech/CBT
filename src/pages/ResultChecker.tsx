import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/src/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Search, GraduationCap, Shield, User, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Candidate } from '@/src/types';
import { Separator } from '@/lib/ui/separator';
import { useAuth } from '@/src/context/AuthContext';

export default function ResultChecker() {
  const [targetExamNumber, setTargetExamNumber] = useState('');
  const [checkingResult, setCheckingResult] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';

  const handleCheckResult = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = targetExamNumber.trim().toUpperCase();

    if (!cleanId) {
      toast.error("Please enter an Examination Number.");
      return;
    }

    setCheckingResult(true);

    try {
      // Step 0: Ensure session
      if (!user) {
        await signInAnonymously(auth);
      }

      // Step 1: Find Candidate (Try direct ID first, then query)
      let candidate: Candidate | null = null;
      const directRef = doc(db, 'candidates', cleanId);
      const directSnap = await getDoc(directRef);

      if (directSnap.exists()) {
        candidate = { id: directSnap.id, ...directSnap.data() } as Candidate;
      } else {
        const q = query(collection(db, 'candidates'), where('examNumber', '==', cleanId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          candidate = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as Candidate;
        }
      }

      if (!candidate) {
        toast.error("RECORD NOT FOUND: registration index '" + cleanId + "' does not exist in our database.", {
          icon: <AlertCircle className="text-red-500" />
        });
        setCheckingResult(false);
        return;
      }

      // Step 2: Find the Attempt
      const qUnified = query(
        collection(db, 'attempts'),
        where('userId', 'in', [candidate.id, candidate.examNumber, cleanId]),
        where('examId', '==', 'unified')
      );
      const allAttemptsSnap = await getDocs(qUnified);

      if (allAttemptsSnap.empty) {
        toast.error("TRANSCRIPT NOT READY: This candidate has not finalized their unified examination.", {
          icon: <AlertCircle className="text-amber-500" />
        });
      } else {
        const attemptData = allAttemptsSnap.docs[0].data();
        if (attemptData.released || isAdmin) {
          toast.success("Identity Authenticated. Accessing Transcript...");
          navigate(`/result-slip/${cleanId}`);
        } else {
          toast.info("VERIFICATION IN PROGRESS: Your result is undergoing administrative review.");
        }
      }
    } catch (error: any) {
      console.error("Critical Search Failure:", error);
      toast.error("SYSTEM ERROR: " + (error.message || "Connection failed. Please check your internet."));
    } finally {
      setCheckingResult(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 selection:bg-primary/10 uppercase">
      {/* Top Navigation */}
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b-2 border-primary/10 px-8 py-4 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
          <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">Home</button>
          <button onClick={() => navigate('/candidate-login')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">Candidate Login</button>
          <button onClick={() => navigate('/results')} className="text-[14px] font-black tracking-widest text-primary transition-colors">Check Results</button>
          <Separator orientation="vertical" className="h-4 bg-primary/10" />
          {!user && (
            <button onClick={() => navigate('/staff')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2">
              <User className="w-3 h-3" /> Staff Portal
            </button>
          )}
          {user && (
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2"
            >
              {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              Go to {isAdmin ? 'Admin Panel' : 'Exam Terminal'}
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-20">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <div className="inline-flex items-center gap-2 mb-12 px-6 py-2.5 rounded-full border-2 border-primary/20 bg-white backdrop-blur-sm shadow-md">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-[14px] font-black tracking-[0.2em] text-primary">Result Portal</span>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-primary leading-tight">Check Results</h1>
              <p className="text-[10px] font-bold text-primary/30 tracking-[0.2em]">Official Score Retrieval</p>
            </div>

            <form onSubmit={handleCheckResult} className="space-y-5 text-left">
              <div className="relative group">
                <Input
                  value={targetExamNumber}
                  onChange={e => setTargetExamNumber(e.target.value)}
                  placeholder="ENTER REG NUMBER"
                  className="h-16 rounded-2xl bg-white border-2 border-primary/20 focus:border-primary px-6 font-black tracking-[0.2em] text-center text-primary text-sm placeholder:text-primary/20 transition-all group-hover:border-primary/40 shadow-xl"
                />
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary/40 transition-colors" />
              </div>
              <Button
                type="submit"
                disabled={checkingResult}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 transition-all border-none active:scale-95"
              >
                {checkingResult ? "Authenticating Index..." : "Access Results"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      <footer className="py-12 z-10 w-full text-center border-t border-primary/5 bg-white">
        <p className="text-[10px] font-bold text-primary/20 tracking-widest uppercase">
          &copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
