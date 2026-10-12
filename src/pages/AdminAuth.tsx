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
import { getFriendlyErrorMessage } from '@/src/lib/api-config';
import { cn } from '@/src/lib/utils/utils';

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, profile, signInWithEmail, loading, devAdminLogin } = useAuth();
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
    if (!email.trim() || !password) {
      toast.error("Invalid input. Email and password are required.");
      return;
    }

    try {
      await signInWithEmail(email.trim(), password);
      toast.success("Admin Authorization Verified.");
      navigate('/admin');
    } catch (error: any) {
      const msg = getFriendlyErrorMessage(error?.message || error);
      toast.error(msg);
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
            <h1 className="text-xl font-black tracking-tighter leading-none mb-1 uppercase">Admin Authorization</h1>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-500">Security Authorization Required</p>
          </div>

          <Card className="rounded-[24px] border border-white/10 bg-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <p className="text-[8px] font-black text-primary uppercase tracking-widest">Admin Login Credentials</p>
                <p className="text-[10px] font-mono text-slate-300 mt-0.5">Configured via Render Environment Variables</p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">(Default: admin@vivicbt.com / admin123)</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-[8px] font-black text-slate-500 tracking-widest uppercase ml-1">Admin Email Address / Username</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <Input
                      name="email"
                      type="text"
                      placeholder="admin@vivicbt.com or admin"
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
                      placeholder=""
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-10 pl-10 pr-10 rounded-xl bg-slate-900 border-white/5 focus:border-primary font-bold text-white text-[10px]"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">{showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white rounded-xl font-black tracking-[0.2em] text-[9px] uppercase shadow-lg transition-all active:scale-95">
                    {loading ? "Decrypting..." : "Login"}
                  </Button>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="w-full text-[9px] font-black text-slate-500 hover:text-white transition-colors tracking-widest uppercase"
                  >
                    Forgotten Password?
                  </button>
                </div>
              </form>

              {import.meta.env.MODE !== 'production' && (
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
                            toast.error(getFriendlyErrorMessage(e) || "Rescue Denied.");
                          }
                        }}
                        className="w-full h-9 rounded-lg border border-dashed border-white/10 text-slate-500 font-black text-[8px] hover:border-primary hover:text-white transition-all gap-2 bg-transparent uppercase"
                      >
                        <Terminal className="w-3 h-3"/> Dev Admin Bypass
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
