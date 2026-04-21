import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { LogIn, GraduationCap, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { signIn, loginWithExamNumber, user, loading } = useAuth();
  const [examNumber, setExamNumber] = useState('');
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examNumber.trim()) {
      toast.error("Please enter your Exam Number.");
      return;
    }
    try {
      await loginWithExamNumber(examNumber.trim());
      toast.success("Identity Verified. Welcome.");
    } catch (e: any) {
      toast.error(e.message || "Authentication failed.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden selection:bg-white/20">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <nav className="absolute top-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary font-bold text-xl">E</div>
          <span className="font-black text-xl tracking-tighter uppercase text-white">EduTest</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsStaffLogin(!isStaffLogin)}
          className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
        >
          {isStaffLogin ? 'Candidate Login' : 'Staff Login'}
        </Button>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-white/20 bg-white/10"
        >
          <GraduationCap className="w-4 h-4 text-white" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Unified Examination Portal</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[0.9] uppercase mb-8"
        >
          Excellence in <br />
          <span className="text-white opacity-80">Assessment.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-lg text-base md:text-lg text-white/70 mb-12 font-medium leading-relaxed"
        >
          Secure, standardized, and reliable Computer Based Testing environment for modern educational institutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {isStaffLogin ? (
            <Button
              size="lg"
              onClick={signIn}
              disabled={loading}
              className="w-full h-16 bg-white hover:bg-white/90 text-primary rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 transition-all border-none"
            >
              <LogIn className="w-4 h-4 mr-3" />
              Staff Login (Google)
            </Button>
          ) : (
            <form onSubmit={handleCandidateLogin} className="space-y-4">
              <div className="relative">
                <Input 
                  value={examNumber}
                  onChange={e => setExamNumber(e.target.value)}
                  placeholder="EXAM NUMBER (E.G. ET-2024-001)"
                  className="h-16 rounded-2xl bg-white/10 border-2 border-white focus:border-white px-6 font-black uppercase tracking-widest text-center text-white placeholder:text-white/40"
                />
                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-white hover:bg-white/90 text-primary rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 transition-all border-none"
              >
                Proceed to Examination
              </Button>
            </form>
          )}
        </motion.div>
      </main>

      <footer className="absolute bottom-8 z-10 w-full text-center">
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">
          Powered by EduTest Systems &bull; Unified Matriculation Standard
        </p>
      </footer>
    </div>
  );
}
