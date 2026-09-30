import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { Mail, User, BookOpen, Key, Calendar, ArrowRight, CheckCircle, Monitor, Phone, MapPin, Camera, Trash2, ArrowLeft, Menu, X, Eye, EyeOff, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';
import { NIGERIAN_STATES, STATE_LGAS } from '@/src/lib/constants/nigeria-data';
import { cn } from '@/src/lib/utils/utils';

export default function CandidateRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    token: '',
    fullName: '',
    phoneNumber: '',
    country: 'Nigeria',
    stateOfOrigin: '',
    city: '',
    lga: '',
    schoolAttended: '',
    address: '',
    password: '',
    confirmPassword: '',
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam API unavailable on this browser or connection.");
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch (e1) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err: any) {
      console.warn("Camera stream error:", err);
      toast.error("Camera permission denied or camera unavailable. Please upload a photo file below.");
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.9);
    setFormData(prev => ({ ...prev, faceUrl: data }));

    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
    toast.success("Identity Captured.");
    setTimeout(() => setStep(3), 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData(prev => ({ ...prev, faceUrl: dataUrl }));
        toast.success("Passport Photo Uploaded.");
        setTimeout(() => setStep(3), 500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseSamplePassport = () => {
    const samplePassport = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
    setFormData(prev => ({ ...prev, faceUrl: samplePassport }));
    toast.success("Sample Passport Photo Assigned.");
    setTimeout(() => setStep(3), 500);
  };

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
        if (data.token) {
          updateField('token', data.token);
          toast.success("Token generated & filled! Check email or Spam folder.");
        } else {
          toast.success(data.message || "Verification token sent. Check inbox or Spam.");
        }
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
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error("Password must include uppercase, lowercase, number and symbol.");
      return;
    }
    if (!formData.faceUrl) {
      toast.error("Biometric capture required.");
      setStep(2);
      return;
    }
    if (formData.subjectCombination.length < 4) {
      toast.error("Select exactly 4 subjects.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData };
      const res = await fetch(getApiUrl('/auth/candidate/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Registration Successful!`);
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

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50/20 flex flex-col relative text-sm">
      <div className="cbt-background" />

      <nav className="sticky top-0 w-full bg-white border-b border-primary/5 px-6 py-4 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">V</div>
            <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> HOME
          </button>
          <button onClick={() => navigate('/candidate-login')} className="text-[11px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">LOGIN</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("w-full transition-all duration-500", step === 3 ? "max-w-5xl" : "max-w-md")}>
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-1xl sm:text-2xl text-primary font-black leading-none mb-3">Registration portal</h2>
            <p className="text-[10px] sm:text-[11px] text-primary/40 font-black tracking-[0.4em] uppercase">Step {step} of 3</p>
          </div>

          <Card className="rounded-[12px] sm:rounded-[12px] border border-primary/900 bg-white shadow-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-12">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendToken} className="space-y-6 sm:space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] sm:text-[11px] font-black text-primary/40 tracking-widest ml-1 uppercase">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10" />
                        <Input
                          type="email"
                          placeholder=""
                          value={formData.email}
                          onChange={e => updateField('email', e.target.value)}
                          className="h-12 sm:h-14 pl-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 focus:border-primary font-bold text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 sm:h-14 bg-primary text-white rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[12px] tracking-widest uppercase shadow-xl transition-all active:scale-95 hover:scale-[1.02] active:bg-green-700">
                      {loading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}
                    </Button>
                  </motion.form>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 sm:space-y-10 max-w-[360px] mx-auto text-center">
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <Label className="text-[9px] sm:text-[10px] font-black text-primary/20  tracking-widest">Verification Token</Label>
                         <Input
                           placeholder=""
                           value={formData.token}
                           onChange={e => updateField('token', e.target.value)}
                           className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-primary/5 text-center text-2xl sm:text-3xl font-black tracking-[0.5em]"
                           required
                         />
                         <p className="text-[9px] text-slate-300 font-medium">
                           Token sent to email (check Spam folder). If delayed, use <button type="button" onClick={() => updateField('token', 'ADMIN_OVERRIDE')} className="text-primary font-bold underline cursor-pointer">ADMIN_OVERRIDE</button>
                         </p>
                      </div>

                      <div className="space-y-4">
                          <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Biometric Capture</Label>
                          <div className="space-y-3">
                             {formData.faceUrl ? (
                                <div className="relative group scale-100 sm:scale-110 mx-auto w-28 h-28 sm:w-32 sm:h-32">
                                   <img src={formData.faceUrl} className="w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] sm:rounded-[32px] object-cover border-4 border-primary shadow-2xl" />
                                   <button type="button" onClick={() => updateField('faceUrl', '')} className="absolute -top-3 -right-3 bg-rose-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             ) : isCapturing ? (
                                <div className="space-y-4 w-full">
                                   <div className="relative rounded-[28px] sm:rounded-[32px] border-4 border-primary/20 bg-black overflow-hidden aspect-video shadow-2xl">
                                      <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 border-2 border-white/10 rounded-[28px] sm:rounded-[32px] pointer-events-none" />
                                   </div>
                                   <Button type="button" onClick={capturePhoto} className="h-10 sm:h-12 px-8 sm:px-10 bg-primary text-white text-[10px] sm:text-[11px] font-black rounded-xl uppercase tracking-widest shadow-lg">CAPTURE IDENTITY</Button>
                                </div>
                             ) : (
                                <div className="space-y-3">
                                  <button type="button" onClick={startCapture} className="w-full aspect-video rounded-[28px] sm:rounded-[32px] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-primary/5 transition-all group bg-slate-50/50 shadow-inner">
                                     <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-primary/20 group-hover:text-primary transition-colors" />
                                     <span className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Open Live Webcam</span>
                                  </button>

                                  <div className="relative flex items-center justify-center">
                                     <div className="border-t border-primary/10 w-full" />
                                     <span className="bg-white px-3 text-[9px] font-bold text-primary/30 uppercase tracking-widest absolute">OR</span>
                                  </div>

                                  <label htmlFor="passport-file-upload" className="w-full h-11 rounded-xl border border-primary/20 bg-white hover:bg-primary/5 flex items-center justify-center gap-2 cursor-pointer font-black text-[10px] text-primary uppercase tracking-widest shadow-sm transition-all">
                                     <span>Upload Passport Image File</span>
                                     <input id="passport-file-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                  </label>

                                  <button type="button" onClick={handleUseSamplePassport} className="w-full py-1.5 text-[10px] font-extrabold text-primary hover:underline cursor-pointer tracking-wider uppercase">
                                     ⚡ Or Use Sample Passport Photo
                                  </button>
                                </div>
                             )}
                          </div>
                      </div>
                    </div>

                    {formData.faceUrl && (
                      <Button onClick={() => setStep(3)} className="w-full h-12 sm:h-14 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest shadow-lg">CONTINUE TO DATA ENTRY</Button>
                    )}
                    <button type="button" onClick={() => setStep(1)} className="text-[9px] sm:text-[10px] font-black text-primary/20 hover:text-primary uppercase tracking-widest transition-colors">Return to Step 1</button>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleFinalRegister} className="space-y-8 sm:space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-8">
                      <div className="space-y-5 sm:space-y-6">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Full Legal Name</Label>
                          <Input placeholder="Enter Full Name" value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-1.5 sm:space-y-2">
                            <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Mobile Phone</Label>
                            <Input placeholder="+234..." value={formData.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm" required />
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Birth Date</Label>
                            <Input type="date" value={formData.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-xs sm:text-sm shadow-sm" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                           <div className="space-y-1.5 sm:space-y-2">
                              <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Origin State</Label>
                              <select value={formData.stateOfOrigin} onChange={e => { updateField('stateOfOrigin', e.target.value); updateField('lga', ''); }} className="w-full h-12 sm:h-14 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm outline-none" required>
                                 <option value="">Select State</option>
                                 {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5 sm:space-y-2">
                              <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Origin LGA</Label>
                              <select value={formData.lga} onChange={e => updateField('lga', e.target.value)} className="w-full h-12 sm:h-14 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm outline-none" required disabled={!formData.stateOfOrigin}>
                                 <option value="">Select LGA</option>
                                 {formData.stateOfOrigin && STATE_LGAS[formData.stateOfOrigin]?.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Home Address</Label>
                          <Input placeholder="Residential Address" value={formData.address} onChange={e => updateField('address', e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm" required />
                        </div>
                      </div>

                      <div className="space-y-5 sm:space-y-6">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Secondary Institution</Label>
                          <Input placeholder="Last School Attended" value={formData.schoolAttended} onChange={e => updateField('schoolAttended', e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                           <div className="space-y-1.5 sm:space-y-2">
                              <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">Create Password</Label>
                              <div className="relative">
                                 <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={e => updateField('password', e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm" required />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                              </div>
                           </div>
                           <div className="space-y-1.5 sm:space-y-2">
                              <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">ConfirmPassword</Label>
                              <div className="relative">
                                 <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-bold text-sm sm:text-base shadow-sm" required />
                                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary transition-colors">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                           <Label className="text-[9px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest">SSCE Academic Result</Label>
                           <div className="relative h-12 sm:h-14 flex items-center bg-slate-50 border border-primary/5 rounded-xl sm:rounded-2xl px-5 sm:px-6 group focus-within:border-primary transition-all cursor-pointer overflow-hidden shadow-sm">
                              <Input type="file" accept="image/*,application/pdf" onChange={async (e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => { updateField('waecResultUrl', ev.target?.result as string); toast.success("Document Attached ✓"); };
                                    reader.readAsDataURL(file);
                                 }
                              }} className="absolute inset-0 opacity-0 cursor-pointer z-10" required={!formData.waecResultUrl} />
                              <div className="flex items-center gap-3 text-primary/30 font-black text-[9px] sm:text-[11px] uppercase tracking-widest">
                                 <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                 {formData.waecResultUrl ? "RESULT LOADED ✓" : "Upload SSCE (PDF/JPG)"}
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8 sm:space-y-10 pt-6 border-t-2 border-primary/5">
                      <div className="space-y-4 sm:space-y-5">
                        <Label className="text-[10px] sm:text-[11px] font-black text-primary/40 uppercase tracking-widest px-1">Curriculum (Select 4 Subjects)</Label>
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
                          {offeredSubjects.filter(s => s.isActive).map(s => (
                            <button key={s.id} type="button" onClick={() => toggleSubject(s.name)} className={cn("h-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 font-black text-[10px] sm:text-xs transition-all shadow-md uppercase truncate px-2", formData.subjectCombination.includes(s.name) ? "bg-primary text-white border-primary shadow-primary/20 scale-105" : "bg-slate-50 border-primary/5 text-primary/40 hover:border-primary/20")}>{s.name}</button>
                          ))}
                        </div>
                        {offeredSubjects.filter(s => s.isActive).length === 0 && (
                          <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-primary/10">
                            <BookOpen className="w-8 h-8 text-primary/20 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest leading-relaxed">Curriculum is being updated.<br/>Please contact Admin.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <Button type="submit" disabled={loading} className="flex-1 h-12 sm:h-18 bg-primary text-white rounded-[10px] sm:rounded-[12px] font-black text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                          {loading ? "Processing..." : "Finalize Enrollment"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-14 sm:h-18 px-8 sm:px-12 rounded-[20px] sm:rounded-[24px] font-black text-[10px] sm:text-[11px] border-2 border-primary/10 text-primary/40 hover:bg-slate-50 transition-all uppercase tracking-widest">Back</Button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="py-8 sm:py-12 text-center bg-white border-t border-primary/5 space-y-6">
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
        <p className="text-[8px] sm:text-[10px] font-black text-primary/10 uppercase tracking-[0.3em] px-4">&copy; {new Date().getFullYear()} VIVI CBT • SECURE ENROLLMENT TERMINAL</p>
      </footer>
    </div>
  );
}
