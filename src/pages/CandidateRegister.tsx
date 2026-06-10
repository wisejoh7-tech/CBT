import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { Mail, User, BookOpen, Key, Calendar, ArrowRight, CheckCircle, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';

export default function CandidateRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    fullName: '',
    password: '',
    dateOfBirth: '',
    subjectCombination: [] as string[]
  });

  const subjects = ["English", "Math", "Physics", "Chemistry", "Biology", "Economics", "Government"];

  const handleSendToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/candidate/send-token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Verification token sent to your email.");
        setStep(2);
      } else {
        toast.error(data.message || "Failed to send token.");
      }
    } catch (e) {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subjectCombination.length < 4) {
      toast.error("Please select exactly 4 subjects.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/candidate/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          token: formData.token,
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          subjectCombination: formData.subjectCombination,
          password: formData.password
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Registration Successful! Exam Number: ${data.candidate.examNumber}`);
        navigate('/candidate-login');
      } else {
        toast.error(data.message || "Registration failed.");
      }
    } catch (e) {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (s: string) => {
    setFormData(prev => {
      const exists = prev.subjectCombination.includes(s);
      if (exists) return { ...prev, subjectCombination: prev.subjectCombination.filter(x => x !== s) };
      if (prev.subjectCombination.length >= 4) return prev;
      return { ...prev, subjectCombination: [...prev.subjectCombination, s] };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col uppercase relative">
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
            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-left">JAMB Standard<br/>Examination Portal</span>
          </div>
        </div>
        <button onClick={() => navigate('/candidate-login')} className="text-[12px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">Login</button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-primary leading-none mb-2">Candidate Registration</h1>
            <p className="text-[10px] font-black text-primary/40 tracking-[0.4em]">Step {step} of 2</p>
          </div>

          <Card className="rounded-[32px] border-2 border-primary/10 bg-white shadow-2xl overflow-hidden">
            <CardContent className="p-10">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendToken} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 tracking-widest">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                        <Input
                          type="email"
                          placeholder="YOU@EXAMPLE.COM"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold transition-all"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-2xl font-black tracking-widest text-[14px] flex gap-2">
                      {loading ? "SENDING..." : "SEND VERIFICATION TOKEN"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.form>
                ) : (
                  <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleFinalRegister} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 tracking-widest">Verification Token</Label>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="ENTER 6-DIGIT TOKEN"
                          value={formData.token}
                          onChange={e => setFormData({...formData, token: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold tracking-[0.5em] text-center"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 tracking-widest">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="SURNAME FIRSTNAME"
                          value={formData.fullName}
                          onChange={e => setFormData({...formData, fullName: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 tracking-widest">Create Password</Label>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 tracking-widest">Date of Birth</Label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                        <Input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-primary/40 tracking-widest flex justify-between">
                        SELECT 4 SUBJECTS <span>({formData.subjectCombination.length}/4)</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {subjects.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSubject(s)}
                            className={cn(
                              "h-10 rounded-xl border-2 font-black text-[10px] transition-all",
                              formData.subjectCombination.includes(s)
                                ? "bg-primary text-white border-primary"
                                : "bg-slate-50 border-primary/5 text-primary/40 hover:border-primary/20"
                            )}
                          >
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-2xl font-black tracking-widest text-[14px]">
                      {loading ? "PROCESSING..." : "COMPLETE REGISTRATION"}
                    </Button>
                    <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black text-primary/20 hover:text-primary transition-colors">Wrong Email? Go Back</button>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="py-12 z-10 w-full text-center border-t border-primary/5 bg-white">
        <p className="text-[10px] font-bold text-primary/20 tracking-widest uppercase">&copy; {new Date().getFullYear()} VIVI CBT Systems. Secure Registration Terminal.</p>
      </footer>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
