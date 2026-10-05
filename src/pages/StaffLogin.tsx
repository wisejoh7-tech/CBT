import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Shield, User, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/lib/ui/separator';
import { getFriendlyErrorMessage } from '@/src/lib/api-config';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, profile, signInWithEmail, loading } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';

  React.useEffect(() => {
    if (user && !loading && profile) {
      if (isAdmin) navigate('/admin');
    }
  }, [user, profile, loading, navigate, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Invalid input. Email and password are required.");
      return;
    }

    try {
      await signInWithEmail(email.trim(), password);
      toast.success("Identity Verified. Staff Session Active.");
      navigate('/admin');
    } catch (error: any) {
      const msg = getFriendlyErrorMessage(error?.message || error);
      toast.error(msg);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50/20 selection:bg-primary/10">
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
            <span className="text-[8px] font-black tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">HOME</button>
          <button onClick={() => navigate('/candidate-login')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">LOGIN</button>
          <button onClick={() => navigate('/results')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">CHECK RESULT</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-20">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="cbt-background" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px] opacity-[0.05]" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-white border-4 border-primary rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-xl">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-1xl font-black tracking-tighter text-white leading-none mb-2">STAFF LOGIN</h1>

          </div>

          <div className="p-1.5 bg-primary/10 rounded-[28px]">
            <Card className="rounded-[18px] border-[1px] border-primary bg-white shadow-1xl shadow-primary/5 overflow-hidden">
              <CardContent className="p-10 bg-white">
                <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary/40 tracking-widest px-1"> Email Address / Username</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                    <Input
                      name="email"
                      type="text"
                      autoComplete="username"
                      placeholder="Enter Email Address or Username"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-12 pl-10 rounded-2xl border-2 border-primary/5 focus:border-primary text-primary transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary/40 tracking-widest px-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-12 pl-10 pr-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold text-primary transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white hover:bg-primary/30 rounded-[11px] font-black tracking-widest text-[16px] shadow-2xl shadow-primary/20 border-none transition-all active:scale-95 mt-4"
                >
                  {loading ? "VERIFYING..." : "LOGIN"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
      </div>

      <footer className="py-12 z-10 w-full text-center border-t border-primary/5 bg-white">
        <p className="text-[10px] font-bold text-primary/20 tracking-widest">&copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
