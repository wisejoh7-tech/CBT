import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { GraduationCap, Shield, User, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/lib/ui/separator';

export default function CandidateLogin() {
  const navigate = useNavigate();
  const { loginWithExamNumber, user, profile, loading } = useAuth();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';
  const [examNumber, setExamNumber] = useState('');

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = examNumber.trim().toUpperCase();
    if (!cleanNumber) {
      toast.error("Please enter your Exam Number.");
      return;
    }

    try {
      await loginWithExamNumber(cleanNumber);
      toast.success("Identity Verified. Terminal Active.");
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || "Authentication failed. Check your Exam Number.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 selection:bg-primary/10 ">
      {/* Navigation */}
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b-2 border-primary/10 px-8 py-4 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
            <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
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

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">Home</button>
          <button onClick={() => navigate('/candidate-login')} className="text-[14px] font-black tracking-widest text-primary transition-colors">Candidate Login</button>
          <button onClick={() => navigate('/results')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">Check Results</button>
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
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="cbt-background" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px] opacity-[0.05]" />
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm text-center">
          <div className="inline-flex items-center gap-2 mb-12 px-6 py-2.5 rounded-full border-2 border-primary/20 bg-white backdrop-blur-sm shadow-md">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-[14px] font-black tracking-[0.2em] text-primary">Examination Portal</span>
          </div>

          <div className="bg-white p-10 rounded-[20px] border-2 border-primary shadow-2xl relative overflow-hidden">
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1">
                <h4 className="text-2xl font-black tracking-tight text-primary leading-tight">Candidate Examination Portal</h4>
                <p className="text-[10px] font-bold text-primary/30 tracking-[0.2em]">Enter Your Examination Number</p>
              </div>

              <form onSubmit={handleCandidateLogin} className="space-y-6">
                <div className="relative group">
                  <Input
                    value={examNumber}
                    onChange={e => setExamNumber(e.target.value)}
                    placeholder="Enter Exam Number"
                    className="h-12 rounded-xl bg-slate-50 border-2 border-primary/20 focus:border-primary px-6 font-black tracking-[0.2em] text-center text-primary text-sm placeholder:text-primary/20 transition-all group-hover:border-primary/60 shadow-sm uppercase"
                  />
                  <User className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary/40 transition-colors" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-14 bg-primary hover:bg-primary/60 text-white rounded-xl font-black tracking-[0.2em] text-[16px] shadow-2xl shadow-primary/20 transition-all border-none active:scale-95">
                  {loading ? "VERIFYING..." : "Start Examination"}
                </Button>
              </form>
            </div>
          </div>
        </motion.main>
      </div>

      <footer className="py-12 z-10 w-full text-center border-t border-primary/5 bg-white">
        <p className="text-[10px] font-bold text-primary/20 tracking-widest uppercase">&copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
