import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine if we are resetting for candidate or staff
  const type = location.pathname.includes('admin') ? 'staff' : 'candidate';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Reset token sent to your email.");
        navigate('/reset-password', { state: { email, type } });
      } else {
        toast.error(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      toast.error("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <div className="cbt-background opacity-[0.05]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary/40 hover:text-primary font-black text-[10px] tracking-widest mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> GO BACK
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-primary leading-none mb-2">Recover Password</h1>
          <p className="text-[10px] font-black text-primary/40 tracking-[0.2em] uppercase">Security Terminal Access</p>
        </div>

        <Card className="rounded-[32px] border-2 border-primary/10 bg-white shadow-2xl">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Email Address</Label>
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
                <p className="text-[9px] text-primary/30 font-bold mt-2">
                  We will send a 6-digit security token to this address.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-2xl font-black tracking-widest text-[14px]">
                {loading ? "SENDING..." : "SEND RESET TOKEN"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
