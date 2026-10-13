import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Search, GraduationCap, Lock, AlertCircle, User, Shield, Monitor, ArrowLeft, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';
import { useAuth } from '@/src/context/AuthContext';
import { Separator } from '@/lib/ui/separator';
import { AnimatePresence } from 'framer-motion';

export default function ResultChecker() {
  const { user, profile } = useAuth();
  const [targetExamNumber, setTargetExamNumber] = useState('');
  const [pin, setPin] = useState('');
  const [checkingResult, setCheckingResult] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';

  const handleCheckResult = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = targetExamNumber.trim();

    if (!cleanId) {
      toast.error("Please enter your Examination Number.");
      return;
    }

    setCheckingResult(true);

    try {
      const res = await apiFetch(getApiUrl('/exams/public/check-result'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examNumber: cleanId,
          pin: pin.trim() || undefined
        })
      });

      await safeJsonResponse(res);

      toast.success("Result found. Accessing Transcript...");
      const queryString = pin.trim() ? `?pin=${encodeURIComponent(pin.trim())}` : '';
      navigate(`/result-slip/${cleanId}${queryString}`);
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error) || "System error. Please try again later.");
    } finally {
      setCheckingResult(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/20 relative">
      <div className="cbt-background" />
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
            <span className="text-[10px] font-black tracking-[0.2em] leading-none text-left">VIVI RESULT<br/> CHECKER PORTAL</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> HOME
          </button>
          <button onClick={() => navigate('/candidate-login')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">LOGIN</button>
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
                  onClick={() => { navigate('/candidate-login'); setIsMenuOpen(false); }}
                  className="text-left text-[14px] font-black tracking-widest text-primary/40 hover:text-primary py-2"
                >
                  LOGIN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border-2 border-primary shadow-sm">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-[12px] font-black text-primary tracking-widest">RESULT PORTAL</span>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[16px] border-2 border-primary shadow-xl relative overflow-hidden text-left">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black tracking-tighter text-primary">CHECK RESULT</h4>
                <p className="text-[11px] font-bold text-slate-500 leading-snug">
                  Enter your Registration Number (and PIN if assigned) to access your official examination result slip once released by the administration.
                </p>
              </div>

              <form onSubmit={handleCheckResult} className="space-y-4">
                <div className="relative">
                  <Input value={targetExamNumber} onChange={e => setTargetExamNumber(e.target.value)} placeholder="Registration Number" className="h-12 rounded-xl bg-slate-50 border-2 border-primary/20 focus:border-primary text-center font-black shadow-sm" />
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-10" />
                </div>
                <div className="relative">
                  <Input value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN (Optional)" className="h-12 rounded-xl bg-slate-50 border-2 border-primary/20 focus:border-primary text-center font-black shadow-sm" />
                  <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-10" />
                </div>
                <Button type="submit" disabled={checkingResult} className="w-full h-14 bg-primary text-white text-base rounded-2xl font-black tracking-widest shadow-lg hover:scale-[1.02] transition-all active:bg-green-700">
                  {checkingResult ? "VERIFYING..." : "ENTER PORTAL"}
                </Button>
              </form>
            </div>
          </div>

          {/* Result Release Bulletin & Batch Status Widget */}
          <div className="bg-white p-6 rounded-[16px] border border-primary/10 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Result Release Bulletin
              </span>
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Live Updates</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <p className="font-extrabold text-[11px] text-slate-800">Batch A (Morning Session)</p>
                  <p className="text-[9px] text-slate-400">All CBT Centers Nationwide</p>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg">PUBLISHED ✓</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <p className="font-extrabold text-[11px] text-slate-800">Batch B (Afternoon Session)</p>
                  <p className="text-[9px] text-slate-400">All CBT Centers Nationwide</p>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg">PUBLISHED ✓</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <p className="font-extrabold text-[11px] text-slate-800">Supplementary / Rescheduled</p>
                  <p className="text-[9px] text-slate-400">Under Quality Audit</p>
                </div>
                <span className="text-[10px] font-black text-amber-600 bg-amber-100/60 px-2.5 py-1 rounded-lg">PROCESSING</span>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 italic text-center pt-1">
              Need PIN scratch card assistance? Contact support or visit your nearest accredited CBT Registration Center.
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="py-12 z-10 w-full text-center border-t border-primary/5 bg-white space-y-6">
        <div className="flex justify-center gap-6 flex-wrap px-4">
          {[
            { label: 'ABOUT', path: '/about' },
            { label: 'CONTACT', path: '/contact' },
            { label: 'TERMS', path: '/terms' },
            { label: 'PRIVACY', path: '/privacy' }
          ].map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className="text-[10px] font-black tracking-widest text-primary/30 hover:text-primary transition-colors uppercase"
            >
              {link.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-bold text-primary/20 tracking-widest">&copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
