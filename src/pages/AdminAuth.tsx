import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Shield, User, Terminal, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/lib/ui/separator';
import { cn } from '@/src/lib/utils/utils';

export default function AdminAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, profile, signInWithEmail, signUpWithEmail, loading, devAdminLogin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !loading && profile) {
      const isAnyAdmin = profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'reg_admin';
      if (isAnyAdmin) {
        navigate('/admin');
      }
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Security credentials required.");
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        toast.success("Master Authorization Verified.");
      } else {
        if (!name) { toast.error("Identity required."); return; }
        await signUpWithEmail(email, password, name, 'super_admin');
        toast.success("System Master Provisioned.");
      }
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || "Master Access Denied.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-900 selection:bg-primary/20 uppercase text-slate-100">
      <nav className="sticky top-0 w-full bg-slate-400/80 backdrop-blur-md border-b-2 border-white/5 px-8 py-4 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
            <span className="font-black text-xl tracking-tighter text-white">VIVI ADMIN</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-white/40">
            <div className="relative">
              <Monitor className="w-6 h-6" />
              <User className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-slate-400 hover:text-white transition-colors">Home</button>
          <button onClick={() => navigate('/staff')} className="text-[14px] font-black tracking-widest text-slate-400 hover:text-white transition-colors">Staff Portal</button>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <button onClick={() => navigate('/admin/auth')} className="text-[14px] font-black tracking-widest text-white transition-colors flex items-center gap-2">
            <Shield className="w-3 h-3" /> Admin Access
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="cbt-background" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px] opacity-[0.05]" />
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/5">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white leading-none mb-2">Admin Page</h1>
            <p className="text-[10px] font-black text-primary/40 tracking-[0.4em]">SYSTEM ADMINISTRATOR </p>
          </div>

          <Card className="rounded-[40px] border-2 border-white/2 bg-slate-400 shadow-1xl overflow-hidden">
            <div className="flex border-b-2 border-white/5 bg-slate-400/50">
              <button onClick={() => setIsLogin(true)} className={cn("flex-1 py-5 font-black tracking-widest text-[10px] transition-all", isLogin ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}>AUTHORIZE</button>
              <button onClick={() => setIsLogin(false)} className={cn("flex-1 py-5 font-black tracking-widest text-[10px] transition-all", !isLogin ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}>PROVISION</button>
            </div>

            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                      <Label className="text-[10px] font-white text-slate-300 tracking-widest">Enter Username</Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="FULL NAME" value={name} onChange={e => setName(e.target.value)} className="h-14 pl-12 rounded-2xl bg-slate-200 border-white/5 focus:border-primary font-bold text-white transition-all" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 tracking-widest">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <Input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="ADMIN@VIVICBT.COM"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-14 pl-12 rounded-2xl bg-slate-900 border-white/5 focus:border-primary font-bold text-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 tracking-widest">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-14 pl-12 pr-12 rounded-2xl bg-slate-900 border-white/5 focus:border-primary font-bold text-white transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white hover:bg-primary/90 rounded-[24px] font-black tracking-widest text-[11px] shadow-2xl shadow-primary/20 border-none transition-all active:scale-95">
                  {loading ? "PROCESSING..." : (isLogin ? "VERIFY ACCESS" : "INITIALIZE MASTER")}
                </Button>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="w-full text-[10px] font-black text-slate-500 hover:text-white transition-colors tracking-widest mt-2"
                  >
                    FORGOT PASSWORD?
                  </button>
                )}
              </form>

              {isLogin && (
                <div className="mt-8 pt-8 border-t-2 border-white/5 space-y-4">
                   <div className="flex flex-col items-center gap-3">
                      <p className="text-[8px] font-black text-primary/40 tracking-[0.4em]">ADMINISTRATIVE OVERRIDE</p>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            toast.loading("Initializing Rescue Access...");
                            await devAdminLogin();
                            toast.dismiss();
                            toast.success("Emergency Access Granted.");
                            navigate('/admin');
                          } catch (e: any) {
                            toast.dismiss();
                            toast.error("Rescue failed. Ensure your backend is running and connected to the database.");
                          }
                        }}
                        className="w-full h-14 rounded-2xl border-2 border-dashed border-white/10 text-slate-400 font-black text-[10px] hover:border-primary hover:text-white transition-all gap-2 bg-transparent"
                      >
                        <Terminal className="w-4 h-4" /> INITIALIZE EMERGENCY ACCESS
                      </Button>
                      <p className="text-[7px] text-slate-500 font-bold text-center px-4 leading-tight uppercase">
                        This button bypasses email validation for system recovery. Use only if credentials fail.
                      </p>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="py-8 z-10 w-full text-center border-t border-white/5 bg-slate-900">
        <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">&copy; {new Date().getFullYear()} VIVI CBT Systems. Secure Master Terminal.</p>
      </footer>
    </div>
  );
}
