import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { Mail, Key, ArrowRight, Monitor, User, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'candidate' | 'staff'>('candidate');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        localStorage.setItem('resetEmail', email);
        localStorage.setItem('resetType', type);
        navigate('/reset-password');
      } else {
        toast.error(data.message || "Request failed");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <div className="cbt-background opacity-[0.05]" />

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
            <span className="text-[10px] font-black tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <button onClick={() => navigate('/candidate-login')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">Login</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black tracking-tighter text-primary leading-none mb-2">Account Recovery</h2>
            <p className="text-[11px] font-black text-primary/40 tracking-[0.4em]">Password Reset Initiation</p>
          </div>

          <Card className="rounded-[32px] border-2 border-primary/10 bg-white shadow-2xl overflow-hidden">
            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
                   <button
                    type="button"
                    onClick={() => setType('candidate')}
                    className={cn("flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all", type === 'candidate' ? "bg-white text-primary shadow-sm" : "text-primary/40 hover:text-primary")}
                   >
                     CANDIDATE
                   </button>
                   <button
                    type="button"
                    onClick={() => setType('staff')}
                    className={cn("flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all", type === 'staff' ? "bg-white text-primary shadow-sm" : "text-primary/40 hover:text-primary")}
                   >
                     STAFF
                   </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary/40 tracking-widest">Registered Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      placeholder="ENTER YOUR EMAIL"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-2xl font-black tracking-widest text-[14px] flex gap-2">
                  {loading ? "PROCESSING..." : "SEND RECOVERY TOKEN"} <ArrowRight className="w-4 h-4" />
                </Button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full text-[10px] font-black text-primary/20 hover:text-primary transition-colors tracking-widest"
                >
                  Return to Login
                </button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="py-12 z-10 w-full text-center border-t border-primary/5 bg-white">
        <p className="text-[10px] font-bold text-primary/20 tracking-widest">&copy; {new Date().getFullYear()} VIVI CBT Systems. Secure Recovery Terminal.</p>
      </footer>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
