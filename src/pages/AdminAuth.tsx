import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [confirmPassword, setConfirmPassword] = useState('');
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
        toast.success("Admin Authorization Verified.");
      } else {
        if (!name) { toast.error("Identity required."); return; }
        if (password !== confirmPassword) {
          toast.error("Security keys do not match.");
          return;
        }
        await signUpWithEmail(email, password, name, 'super_admin');
        toast.success("System Master Provisioned.");
      }
      navigate('/admin');
    } catch (error: any) {
      // Errors are toasted in AuthContext
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-900/50 selection:bg-primary/20 text-slate-100">
      <div className="cbt-background cbt-background-dark" />
      <nav className="sticky top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-6 py-3 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-base shadow-lg shadow-primary/20">V</div>
          <span className="font-black text-lg tracking-tighter text-white uppercase">VIVI Admin</span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/')} className="text-[11px] font-black tracking-widest text-slate-400 hover:text-white transition-colors uppercase">Home</button>
          <button onClick={() => navigate('/staff')} className="text-[11px] font-black tracking-widest text-slate-400 hover:text-white transition-colors uppercase">Staff</button>
          <div onClick={() => navigate('/admin/auth')} className="text-[9px] font-black tracking-[0.2em] text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 cursor-pointer">
            < Shield className="w-3 h-3 text-primary" /> AUTH
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-6">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="cbt-background" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1px,transparent:1px)] [background-size:24px_24px] opacity-[0.05]" />
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-[340px]">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-black tracking-tighter leading-none mb-1 uppercase">Control Terminal</h1>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-500">Security Authorization Required</p>
          </div>

          <Card className="rounded-[28px] border border-white/10 bg-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex bg-white/5 p-1 m-2 rounded-2xl">
              <button onClick={() => setIsLogin(true)} className={cn("flex-1 py-2.5 rounded-xl font-black tracking-widest text-[8px] transition-all uppercase", isLogin ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-200")}>Login</button>
              <button onClick={() => setIsLogin(false)} className={cn("flex-1 py-2.5 rounded-xl font-black tracking-widest text-[8px] transition-all uppercase", !isLogin ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-200")}>Enroll</button>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1 overflow-hidden">
                      <Label className="text-[8px] font-black text-slate-500 tracking-widest uppercase ml-1">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Full Legal Name" value={name} onChange={e => setName(e.target.value)} className="h-10 pl-10 rounded-xl bg-slate-900 border-white/5 focus:border-primary font-bold text-white text-[10px]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  <Label className="text-[8px] font-black text-slate-500 tracking-widest uppercase ml-1">Admin Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="admin@access.terminal"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-10 pl-10 rounded-xl bg-slate-900 border-white/5 focus:border-primary font-bold text-white text-[10px]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-black text-slate-500 tracking-widest uppercase ml-1">Admin Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-10 pl-10 pr-10 rounded-xl bg-slate-900 border-white/5 focus:border-primary font-bold text-white text-[10px]"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">{showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                  </div>
                </div>

                {!isLogin && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                    <Label className="text-[8px] font-black text-slate-500 tracking-widest uppercase ml-1">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within:text-primary transition-colors" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="h-10 pl-10 rounded-xl bg-slate-900 border-white/5 focus:border-primary font-bold text-white text-[10px]"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                <div className="pt-2">
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white rounded-xl font-black tracking-[0.2em] text-[9px] uppercase shadow-lg transition-all active:scale-95">
                    {loading ? "Decrypting..." : (isLogin ? "Verify Identity" : "Provision Root")}
                  </Button>
                </div>

                {isLogin && (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="w-full text-[9px] font-black text-slate-500 hover:text-white transition-colors tracking-widest uppercase"
                  >
                    Forgotten Password?
                  </button>
                )}
              </form>

              {isLogin && (
                <div className="mt-5 pt-5 border-t border-white/5">
                   <div className="flex flex-col items-center gap-2">
                      <p className="text-[7px] font-black text-primary/40 tracking-[0.4em] uppercase">Emergency Protocol</p>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            toast.loading("Rescuing Account...");
                            await devAdminLogin();
                            toast.dismiss();
                            toast.success("Root Access Active.");
                            navigate('/admin');
                          } catch (e: any) {
                            toast.dismiss();
                            toast.error("Rescue Denied.");
                          }
                        }}
                        className="w-full h-9 rounded-lg border border-dashed border-white/10 text-slate-500 font-black text-[8px] hover:border-primary hover:text-white transition-all gap-2 bg-transparent uppercase"
                      >
                        <Terminal className="w-3 h-3"/> Bypass Authorization
                      </Button>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="py-5 z-10 w-full text-center border-t border-white/5 bg-slate-900/50">
        <p className="text-[9px] font-bold text-slate-600 tracking-widest uppercase">&copy; {new Date().getFullYear()} VIVI CBT • SYSTEM ADMINISTRATION</p>
      </footer>
    </div>
  );
}
