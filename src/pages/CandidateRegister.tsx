import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { Mail, User, BookOpen, Key, Calendar, ArrowRight, CheckCircle, Monitor, Phone, MapPin, Camera, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';
import { NIGERIAN_STATES, STATE_LGAS } from '@/src/lib/constants/nigeria-data';

export default function CandidateRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    fullName: '',
    phoneNumber: '',
    stateOfOrigin: '',
    lga: '',
    schoolAttended: '',
    address: '',
    password: '',
    dateOfBirth: '',
    waecResultUrl: '',
    faceUrl: '',
    subjectCombination: [] as string[]
  });
  const [offeredSubjects, setOfferedSubjects] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(getApiUrl('/subjects'))
      .then(res => res.json())
      .then(data => setOfferedSubjects(data))
      .catch(err => console.error("Failed to fetch subjects", err));
  }, []);

  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCapture = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Camera access denied. Biometric verification is mandatory.");
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.9);
    setFormData({ ...formData, faceUrl: data });

    // Stop stream
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    setIsCapturing(false);
    toast.success("Biometric Data Captured Successfully.");
    setStep(3); // Auto-advance to details
  };

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
    if (!formData.faceUrl) {
      toast.error("Biometric capture is required.");
      setStep(2);
      return;
    }
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
          phoneNumber: formData.phoneNumber,
          stateOfOrigin: formData.stateOfOrigin,
          lga: formData.lga,
          schoolAttended: formData.schoolAttended,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          waecResultUrl: formData.waecResultUrl,
          faceUrl: formData.faceUrl,
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
      const subject = s.trim();
      const exists = prev.subjectCombination.includes(subject);
      if (exists) return { ...prev, subjectCombination: prev.subjectCombination.filter(x => x !== subject) };
      if (prev.subjectCombination.length >= 4) return prev;
      return { ...prev, subjectCombination: [...prev.subjectCombination, subject] };
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
            <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <button onClick={() => navigate('/candidate-login')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase">Login</button>
          <button onClick={() => navigate('/results')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase">Check Result</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-1xl text-white tracking-tighter text-primary leading-none mb-2 uppercase">Registration Portal</h2>
            <p className="text-[10px] text-primary/60 text-white tracking-[0.4em] uppercase">Step {step} of 3</p>
          </div>

          <Card className="rounded-[20px] border-2 border-primary/10 bg-white shadow-2xl overflow-hidden">
            <CardContent className="p-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendToken} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                        <Input
                          type="email"
                          placeholder="ENTER EMAIL ADDRESS"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="h-11 pl-12 rounded-1.5xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold transition-all"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-primary text-white rounded-1.5xl font-black tracking-widest text-[14px] flex gap-2">
                      {loading ? "SENDING..." : "SEND VERIFICATION TOKEN"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.form>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="text-center">
                       <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/10">
                          <Camera className="w-8 h-8 text-primary" />
                       </div>
                       <h3 className="text-sm font-black text-primary tracking-widest uppercase">Biometric Verification</h3>
                       <p className="text-[10px] font-bold text-primary/30 mt-1 uppercase">Live face capture is mandatory for account security</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Verification Token</Label>
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

                      <div className="flex justify-center py-4">
                          {formData.faceUrl ? (
                             <div className="relative group">
                                <img src={formData.faceUrl} className="w-48 h-48 rounded-[40px] object-cover border-4 border-primary shadow-2xl transition-all" />
                                <div className="absolute inset-0 bg-primary/20 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <button type="button" onClick={() => setFormData({...formData, faceUrl: ''})} className="bg-rose-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                                </div>
                             </div>
                          ) : isCapturing ? (
                             <div className="space-y-4 text-center w-full">
                                <div className="relative overflow-hidden rounded-[40px] border-4 border-primary/20 bg-black">
                                   <video ref={videoRef} autoPlay className="w-full aspect-square object-cover" />
                                   <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none" />
                                   <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 animate-[scan_2s_linear_infinite]" />
                                </div>
                                <Button type="button" onClick={capturePhoto} className="h-16 w-full bg-primary text-white font-black rounded-2xl tracking-widest text-[11px] shadow-xl">SECURELY CAPTURE BIOMETRIC</Button>
                             </div>
                          ) : (
                             <button type="button" onClick={startCapture} className="w-full h-56 rounded-[48px] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/[0.02] transition-all group bg-slate-50/50">
                                <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                   <Camera className="w-8 h-8 text-primary/40 group-hover:text-primary" />
                                </div>
                                <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Start Camera for Biometrics</span>
                             </button>
                          )}
                      </div>
                    </div>

                    {formData.faceUrl && (
                      <Button onClick={() => setStep(3)} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black tracking-widest text-[11px] uppercase">Continue to Identity Form</Button>
                    )}
                    <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black text-primary/20 hover:text-primary transition-colors uppercase">Wait, go back</button>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleFinalRegister} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Full Name</Label>
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

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Phone Number</Label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="+234 812 345 6789"
                            value={formData.phoneNumber}
                            onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                            className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">State of Origin</Label>
                          <select
                            value={formData.stateOfOrigin}
                            onChange={e => setFormData({ ...formData, stateOfOrigin: e.target.value, lga: '' })}
                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold text-[10px] transition-all outline-none focus:ring-0"
                            required
                          >
                            <option value="">SELECT STATE</option>
                            {NIGERIAN_STATES.map(state => (
                              <option key={state} value={state}>{state.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">LGA of Origin</Label>
                          <select
                            value={formData.lga}
                            onChange={e => setFormData({ ...formData, lga: e.target.value })}
                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold text-[10px] transition-all outline-none focus:ring-0"
                            required
                            disabled={!formData.stateOfOrigin}
                          >
                            <option value="">SELECT LGA</option>
                            {formData.stateOfOrigin && STATE_LGAS[formData.stateOfOrigin]?.map(lga => (
                              <option key={lga} value={lga}>{lga.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Institution Attended</Label>
                        <div className="relative group">
                          <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="NAME OF SECONDARY SCHOOL"
                            value={formData.schoolAttended}
                            onChange={e => setFormData({...formData, schoolAttended: e.target.value})}
                            className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Residential Address</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10 group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="HOME ADDRESS"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            className="h-14 pl-12 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Create Password</Label>
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

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Date of Birth</Label>
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

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Upload Identification (WAEC / NECO / NABTEB)</Label>
                        <div className="relative group">
                          <Input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setFormData({ ...formData, waecResultUrl: ev.target?.result as string });
                                  toast.success("Document Attached Successfully.");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="h-14 pt-4 rounded-2xl bg-slate-50 border-2 border-primary/5 focus:border-primary font-bold text-[10px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-primary/40 tracking-widest flex justify-between uppercase">
                          Select 4 Subjects <span>({formData.subjectCombination.length}/4)</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {offeredSubjects.filter(s => s.isActive).map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSubject(s.name)}
                              className={cn(
                                "h-10 rounded-xl border-2 font-black text-[10px] transition-all uppercase",
                                formData.subjectCombination.includes(s.name)
                                  ? "bg-primary text-white border-primary"
                                  : "bg-slate-50 border-primary/5 text-primary/40 hover:border-primary/20"
                              )}
                            >
                              {s.name.toUpperCase()}
                            </button>
                          ))}
                          {offeredSubjects.filter(s => s.isActive).length === 0 && (
                            <p className="col-span-2 text-center text-[8px] font-black opacity-20 uppercase py-4">No subjects available yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-2xl font-black tracking-widest text-[14px]">
                      {loading ? "PROCESSING..." : "COMPLETE REGISTRATION"}
                    </Button>
                    <button type="button" onClick={() => setStep(2)} className="w-full text-[10px] font-black text-primary/20 hover:text-primary transition-colors uppercase">Redo Biometrics</button>
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

