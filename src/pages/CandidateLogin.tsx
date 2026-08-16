import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { GraduationCap, Shield, User, Monitor, Mail, Lock, Search, ArrowLeft, Menu, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/lib/ui/separator';
import { cn } from '@/src/lib/utils/utils';
import { getApiUrl } from '@/src/lib/api-config';

export default function CandidateLogin() {
  const navigate = useNavigate();
  const { loginWithExamNumber, loginCandidateWithEmail, user, profile, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [examNumber, setExamNumber] = useState(localStorage.getItem('pendingExamNumber') || '');
  const [loginMethod, setLoginMethod] = useState<'email' | 'examNumber'>('examNumber');

  React.useEffect(() => {
    localStorage.removeItem('pendingExamNumber');
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Credentials required.");
      return;
    }

    try {
      await loginCandidateWithEmail(email, password);
      toast.success("Identity Verified. Accessing Portal...");
      navigate('/dashboard');
    } catch (e) {
      // Error handled in context
    }
  };

  const handleExamNumberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examNumber) {
      toast.error("Exam Number required.");
      return;
    }

    try {
      await loginWithExamNumber(examNumber);
      toast.success("Identity Verified. Opening Terminal...");
      navigate('/instructions/unified');
    } catch (e) {
      toast.error("Invalid Exam Number or Session inactive.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 selection:bg-primary/10 ">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="cbt-background" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px] opacity-[0.05]" />
      </div>

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
            <span className="text-[8px] font-black tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> HOME
          </button>
          <button onClick={() => navigate('/candidate-register')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">REGISTER</button>
          <button onClick={() => navigate('/results')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">CHECK RESULT</button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-primary"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 w-full bg-white border-b-2 border-primary/10 md:hidden overflow-hidden z-[90] shadow-xl"
            >
              <div className="flex flex-col p-6 gap-4">
                <button
                  onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                  className="text-left text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors py-2 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> HOME
                </button>
                <button
                  onClick={() => { navigate('/candidate-register'); setIsMenuOpen(false); }}
                  className="text-left text-[14px] font-black tracking-widest text-primary/40 hover:text-primary py-2"
                >
                  REGISTER
                </button>
                <button
                  onClick={() => { navigate('/results'); setIsMenuOpen(false); }}
                  className="text-left text-[14px] font-black tracking-widest text-primary/40 hover:text-primary py-2"
                >
                  CHECK RESULT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-20">
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-2.5 rounded-full border-2 border-primary/20 bg-white backdrop-blur-sm shadow-md">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-[8px] font-black tracking-[0.2em] text-primary">CANDIDATE PORTAL</span>
          </div>

          <div className="bg-white rounded-[32px] border-2 border-primary shadow-2xl relative overflow-hidden">
            <div className="p-6 border-b-2 border-primary/5 bg-slate-50">
               <h2 className="font-black text-[12px] tracking-[0.2em] text-primary">LOGIN PORTAL</h2>
            </div>

            <div className="p-10 space-y-8">
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                 <button
                  onClick={() => setLoginMethod('examNumber')}
                  className={cn("flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all", loginMethod === 'examNumber' ? "bg-white text-primary shadow-sm" : "text-primary/40 hover:text-primary")}
                 >
                   EXAM NUMBER
                 </button>
                 <button
                  onClick={() => setLoginMethod('email')}
                  className={cn("flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all", loginMethod === 'email' ? "bg-white text-primary shadow-sm" : "text-primary/40 hover:text-primary")}
                 >
                   EMAIL ADDRESS
                 </button>
              </div>

              <AnimatePresence mode="wait">
                {loginMethod === 'examNumber' ? (
                  <motion.form key="exam" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 2.5, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleExamNumberLogin} className="space-y-6">
                     <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest">Examination Number</Label>
                        <div className="relative group">

                          <Input
                            name="examNumber"
                            autoComplete="username"
                            value={examNumber}
                            onChange={e => setExamNumber(e.target.value)}
                            placeholder="Enter Exam Number."
                            className="h-10 pl-8 rounded-2xl bg-slate-30 border-1 border-primary/10 focus:border-primary font-bold text-lg text-primary transition-all tracking-widest"
                            required
                          />
                        </div>
                     </div>
                     <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white rounded-2xl font-black tracking-widest text-[14px]">
                        {loading ? "VERIFYING..." : "START"}
                     </Button>
                  </motion.form>
                ) : (
                  <motion.form key="email" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleEmailLogin} className="space-y-6">
                    <div className="space-y-4 text-left">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest">Email Address</Label>
                        <div className="relative group">

                          <Input
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter Email"
                            className="h-10 pl-6 rounded-2xl bg-slate-20 border-1 border-primary/10 focus:border-primary font-bold text-primary transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest">Password</Label>
                        <div className="relative group">

                          <Input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="h-10 pl-6 pr-10 rounded-2xl bg-slate-20 border-1 border-primary/10 focus:border-primary font-bold text-primary transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white rounded-2xl font-black tracking-widest text-[16px] ">
                      {loading ? "AUTHENTICATING..." : "LOGIN"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="w-full text-[10px] font-black text-primary/50 hover:text-primary transition-colors tracking-widest mt-2"
                    >
                      FORGOT PASSWORD? CLICK HERE
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="space-y-4 border-t-2 border-primary/5 pt-6">
                <button
                  onClick={() => navigate('/results')}
                  className="w-full h-11 rounded-2xl border-1  border-primary/20 text-[11px] font-black text-primary/60 hover:bg-primary/5 hover:border-primary transition-all tracking-widest flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" /> CHECK MY RESULT (EXAM NUMBER)
                </button>
                <Separator className="bg-primary/5" />
                <button
                  onClick={() => navigate('/candidate-register')}
                  className="w-full text-[10px] font-black text-primary/60 hover:text-primary transition-colors tracking-widest"
                >
                  NOT REGISTERED? CLICK HERE TO START
                </button>
              </div>
            </div>
          </div>
        </motion.main>
      </div>

      <footer className="py-12 z-10 w-full text-center border-t border-primary/5 bg-white">
        <p className="text-[10px] font-bold text-primary/20 tracking-widest">&copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
