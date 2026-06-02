import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, updateDoc, onSnapshot, where, setDoc } from 'firebase/firestore';
import { Exam, Question, Attempt, Candidate, UserProfile } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent } from '@/lib/ui/card';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { Separator } from '@/lib/ui/separator';
import { toast } from 'sonner';
import { 
  Trash2, BookOpen, LayoutDashboard, PlusCircle, Users, Search, UserPlus, Library, CheckCircle2, BarChart2, PieChart as PieChartIcon, AlertCircle, Fingerprint, Shield, LogOut, XCircle, Camera, Pencil, Upload, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { cn } from '@/src/lib/utils/utils';

export default function Admin() {
  const { user, profile, logOut, loginWithExamNumber, signUpWithEmail } = useAuth();
  const { socket } = useSocket();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Role Checks
  const isSuperAdmin = profile?.role === 'super_admin';
  const isStaff = profile?.role === 'reg_admin'; // Restricted access
  const isExamAdmin = profile?.role === 'admin' || isSuperAdmin;
  const isRegAdmin = isStaff || profile?.role === 'admin' || isSuperAdmin;

  const [newExam, setNewExam] = useState<{title: string, subject: string, description: string, durationMinutes: number}>({ title: '', subject: '', description: '', durationMinutes: 30 });
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, imageUrl: '', audioUrl: '' });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  const [newCandidate, setNewCandidate] = useState({
    fullName: '', examNumber: '', dateOfBirth: '', subjects: [] as string[], faceUrl: '', fingerprintData: ''
  });
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'reg_admin' as 'admin' | 'reg_admin' });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'candidates' | 'bank' | 'analytics' | 'monitor' | 'staff'>('overview');

  useEffect(() => {
    if (isStaff) setActiveTab('candidates');
    else if (isExamAdmin || isSuperAdmin) setActiveTab('overview');
  }, [profile, isStaff, isExamAdmin, isSuperAdmin]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  const [liveSessions, setLiveSessions] = useState<Attempt[]>([]);
  const [redisSessions, setRedisSessions] = useState<any[]>([]);
  const VIVI_SUBJECTS = ["Use of English", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government", "Literature", "CRS", "IRS", "History", "Geography", "Agric Science", "Commerce"];

  useEffect(() => {
    const fetchRedisSessions = async () => {
      try {
        const res = await fetch('/api/active-sessions');
        if (res.ok) {
          const data = await res.json();
          setRedisSessions(data);
        }
      } catch (e) {}
    };

    if (activeTab === 'monitor') {
      fetchRedisSessions();
      const interval = setInterval(fetchRedisSessions, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [analyticsQuestions, setAnalyticsQuestions] = useState<Record<string, Question[]>>({});
  const [selectedAnalyticsExam, setSelectedAnalyticsExam] = useState<string | null>(null);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<Set<string>>(new Set());
  const [viewingSnaps, setViewingSnaps] = useState<string | null>(null);
  const [analyticsMode, setAnalyticsMode] = useState<'performance' | 'items'>('performance');

  useEffect(() => {
    if (!user || !profile) return;
    if (isExamAdmin) fetchQuestionBank();
    if (isRegAdmin) fetchCandidates(); fetchAttempts();
    if (isSuperAdmin) fetchStaff();
    fetchExams();
    const q = query(collection(db, 'attempts'), where('status', '==', 'in-progress'));
    const unsubscribe = onSnapshot(q, (s) => setLiveSessions(s.docs.map(d => ({ id: d.id, ...d.data() } as Attempt))), (e) => {});

    if (socket) {
      socket.emit('join-exam', 'unified');
      socket.on('progress-updated', (data: { userId: string, progress: any }) => {
        setLiveSessions(prev => prev.map(s => {
          if (s.userId === data.userId || s.id === data.userId) {
            return { ...s, ...data.progress };
          }
          return s;
        }));
      });
    }

    return () => {
      unsubscribe();
      if (socket) socket.off('progress-updated');
    };
  }, [profile, user, isExamAdmin, isRegAdmin, isSuperAdmin, socket]);

  useEffect(() => {
    if (activeTab === 'analytics' && attempts.length > 0) {
      const ids = Array.from(new Set<string>(attempts.map(a => a.examId)));
      ids.forEach(id => { if (!analyticsQuestions[id]) fetchQuestionsForAnalytics(id); });
    }
  }, [activeTab, attempts]);

  useEffect(() => {
    if (selectedExamId) fetchQuestions(selectedExamId);
  }, [selectedExamId]);

  async function fetchStaff() {
    try {
      const s = await getDocs(query(collection(db, 'users'), where('role', 'in', ['admin', 'reg_admin', 'super_admin'])));
      setStaff(s.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    } catch (e: any) {}
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.email || !newStaff.password || !newStaff.name) { toast.error("Fill all fields"); return; }
    try {
      toast.loading("Creating Staff Account...");
      await signUpWithEmail(newStaff.email, newStaff.password, newStaff.name, newStaff.role);
      toast.dismiss();
      toast.success("Staff Account Created.");
      setNewStaff({ name: '', email: '', password: '', role: 'reg_admin' });
      fetchStaff();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to create staff account");
    }
  };

  async function fetchExams() {
    setLoading(true);
    try {
      const s = await getDocs(collection(db, 'exams'));
      const list = s.docs.map(d => ({ id: d.id, ...d.data() } as Exam));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setExams(list);
    } catch (e: any) {} finally { setLoading(false); }
  }

  async function fetchCandidates() {
    try {
      const s = await getDocs(collection(db, 'candidates'));
      setCandidates(s.docs.map(d => ({ id: d.id, ...d.data() } as Candidate)));
    } catch (e: any) {}
  }

  async function fetchAttempts() {
    try {
      const s = await getDocs(collection(db, 'attempts'));
      setAttempts(s.docs.map(d => ({ id: d.id, ...d.data() } as Attempt)));
    } catch (e: any) {}
  }

  async function fetchQuestionBank() {
    try {
      const s = await getDocs(query(collection(db, 'question_bank'), orderBy('createdAt', 'desc')));
      setBankQuestions(s.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
    } catch (e: any) {}
  }

  async function fetchQuestions(id: string) {
    try {
      const s = await getDocs(collection(db, 'exams', id, 'questions'));
      setQuestions(s.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
    } catch (e) {}
  }

  async function fetchQuestionsForAnalytics(id: string) {
    try {
      const s = await getDocs(collection(db, 'exams', id, 'questions'));
      setAnalyticsQuestions(p => ({ ...p, [id]: s.docs.map(d => ({ id: d.id, ...d.data() } as Question)) }));
    } catch (e: any) {}
  }

  const handleCreateOrUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExamId) await updateDoc(doc(db, 'exams', editingExamId), { ...newExam, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, 'exams'), { ...newExam, totalQuestions: 0, createdAt: serverTimestamp() });
      setNewExam({ title: '', subject: '', description: '', durationMinutes: 30 }); setEditingExamId(null); setSelectedExamId(null); fetchExams();
    } catch (e) {}
  };

  const handleAddOrUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedExamId) return;
    try {
      if (editingQuestionId) await updateDoc(doc(db, 'exams', selectedExamId, 'questions', editingQuestionId), newQuestion);
      else { await addDoc(collection(db, 'exams', selectedExamId, 'questions'), newQuestion); await updateDoc(doc(db, 'exams', selectedExamId), { totalQuestions: questions.length + 1 }); }
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0 }); setEditingQuestionId(null); fetchQuestions(selectedExamId);
    } catch (e) {}
  };

  const addToBank = async (q: Partial<Question>) => {
    try {
      await addDoc(collection(db, 'question_bank'), { ...q, createdAt: serverTimestamp() });
      toast.success("Added to Bank!");
      fetchQuestionBank();
    } catch (e) { toast.error("Failed"); }
  };

  const handleQuestionBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = (ev.target?.result as string).split('\n').filter(l => l.trim());
      let count = 0; toast.loading("Processing Bank Upload...");
      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 6) {
          const [qText, oA, oB, oC, oD, cIdx] = parts;
          try { await addDoc(collection(db, 'question_bank'), { text: qText, options: [oA, oB, oC, oD], correctOptionIndex: parseInt(cIdx) || 0, createdAt: serverTimestamp() }); count++; } catch (err) {}
        }
      }
      toast.dismiss(); toast.success(`Injected ${count} items.`); fetchQuestionBank();
    };
    reader.readAsText(file);
  };

  const handleBatchImportToExam = async () => {
    if (!selectedExamId || selectedBankQuestions.size === 0) { toast.error("Select exam and items."); return; }
    toast.loading("Injecting selected items...");
    let count = 0;
    try {
      for (const qId of Array.from(selectedBankQuestions)) {
        const q = bankQuestions.find(bq => bq.id === qId);
        if (q) { await addDoc(collection(db, 'exams', selectedExamId, 'questions'), { text: q.text, options: q.options, correctOptionIndex: q.correctOptionIndex, examId: selectedExamId }); count++; }
      }
      await updateDoc(doc(db, 'exams', selectedExamId), { totalQuestions: questions.length + count });
      toast.dismiss(); toast.success(`Successfully assigned ${count} items.`); setSelectedBankQuestions(new Set()); fetchQuestions(selectedExamId);
    } catch (e) { toast.dismiss(); toast.error("Batch assignment failed."); }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.fullName || !newCandidate.dateOfBirth || newCandidate.subjects.length !== 4) { toast.error("Fill required fields"); return; }
    if (!newCandidate.faceUrl || !newCandidate.fingerprintData) { toast.error("Biometrics required"); return; }
    try {
      let en = newCandidate.examNumber;
      if (!editingCandidateId) {
        const y = new Date().getFullYear();
        const r = Math.floor(100000 + Math.random() * 900000);
        const l = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        en = `${y}${r}${l[Math.floor(Math.random() * l.length)]}${l[Math.floor(Math.random() * l.length)]}`;
      }
      const data = {
        fullName: newCandidate.fullName,
        examNumber: en,
        dateOfBirth: newCandidate.dateOfBirth,
        subjectCombination: newCandidate.subjects,
        faceUrl: newCandidate.faceUrl,
        thumbprintData: newCandidate.fingerprintData,
        status: 'active' as const,
        thumbprinted: true,
        updatedAt: serverTimestamp()
      };
      if (editingCandidateId) await updateDoc(doc(db, 'candidates', editingCandidateId), data);
      else await setDoc(doc(db, 'candidates', en), { ...data, registrationDate: new Date().toISOString(), createdAt: new Date().toISOString() });
      toast.success(editingCandidateId ? "Updated" : `Registered: ${en}`);
      setNewCandidate({ fullName: '', examNumber: '', dateOfBirth: '', subjects: [], faceUrl: '', fingerprintData: '' });
      setEditingCandidateId(null);
      fetchCandidates();
    } catch (err) { toast.error("Registration Failed"); }
  };

  const startEditCandidate = (c: Candidate) => {
    setNewCandidate({ fullName: c.fullName, examNumber: c.examNumber, dateOfBirth: c.dateOfBirth || '', subjects: [...c.subjectCombination], faceUrl: c.faceUrl || '', fingerprintData: c.thumbprintData || '' });
    setEditingCandidateId(c.id);
  };

  const captureFace = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, facingMode: "user" } });
      setCameraStream(s);
      setIsCameraOpen(true);
    } catch (e) { toast.error("Camera Denied"); }
  };

  const snapPhoto = () => {
    if (videoRef.current) {
      const c = document.createElement('canvas');
      c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
      const ctx = c.getContext('2d');
      if (ctx) { ctx.drawImage(videoRef.current, 0, 0); setNewCandidate(p => ({ ...p, faceUrl: c.toDataURL('image/jpeg', 0.8) })); closeCamera(); toast.success("Face Captured!"); }
    }
  };

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const captureFingerprint = async () => {
    toast.loading("Scanning Fingerprint...");
    await new Promise(r => setTimeout(r, 1000));
    setNewCandidate(p => ({ ...p, fingerprintData: "FP_" + Math.random().toString(36).slice(2, 9) }));
    toast.dismiss(); toast.success("Biometrics Enrolled!");
  };

  const handleRemoteAction = async (id: string, a: 'terminate' | 'reset') => {
    try {
      if (a === 'terminate') await updateDoc(doc(db, 'attempts', id), { status: 'completed', terminatedByAdmin: true });
      else await deleteDoc(doc(db, 'attempts', id));
      toast.success("Command Executed.");
    } catch (e) {}
  };

  const handleReleaseResult = async (id: string) => {
    setReleasing(id);
    try { await updateDoc(doc(db, 'attempts', id), { released: true, releasedAt: serverTimestamp() }); toast.success("Result Published!"); fetchAttempts(); }
    catch (e) {} finally { setReleasing(null); }
  };

  const handleStartCandidateExam = async (en: string) => {
    try { toast.loading("Switching to Terminal..."); await loginWithExamNumber(en); toast.dismiss(); navigate('/dashboard'); }
    catch (e: any) { toast.dismiss(); toast.error(e.message); }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-primary bg-background uppercase">
      <header className="bg-white border-b-2 border-primary/40 p-3 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20"><Shield className="w-4 h-4" /></div>
          <h1 className="text-lg font-black tracking-tighter text-primary">Admin Control Center</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-[9px] text-primary/30 font-black leading-none mb-1">Authenticated</p>
            <p className="text-[11px] font-bold text-primary/60">{profile?.displayName}</p>
          </div>
          <Separator orientation="vertical" className="h-6 bg-primary/10 mx-1" />
          <Button variant="ghost" size="icon" onClick={async () => { await logOut(); navigate('/'); }} className="rounded-full w-8 h-8 text-primary/40 hover:text-red-500 hover:bg-red-50"><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="bg-primary/10 p-1.5 flex justify-center border-b border-primary/10 overflow-x-auto">
        <div className="flex gap-1.5 p-1 rounded-xl whitespace-nowrap">
          {isExamAdmin && (
            <Button variant={activeTab === 'overview' ? 'default' : 'ghost'} onClick={() => setActiveTab('overview')} className={cn("rounded-lg h-9 px-4 font-bold tracking-widest text-[12px] border-none uppercase", activeTab === 'overview' ? "bg-primary text-white" : "text-primary/40 hover:text-primary")}>
              <LayoutDashboard className="w-3 h-3 mr-2" />Overview
            </Button>
          )}
          {isExamAdmin && (
            <Button variant={activeTab === 'monitor' ? 'default' : 'ghost'} onClick={() => setActiveTab('monitor')} className={cn("rounded-lg h-9 px-3 font-bold tracking-widest text-[12px] border-none uppercase", activeTab === 'monitor' ? "bg-red-500 text-white" : "text-primary/40 hover:text-primary")}>
              <Shield className="w-3 h-3 mr-2" />Monitor {liveSessions.length > 0 && <span className="ml-1.5 bg-white/20 rounded-full px-1 py-0.5 text-[7px]">{liveSessions.length}</span>}
            </Button>
          )}
          {isExamAdmin && (
            <>
              <Button variant={activeTab === 'exams' ? 'default' : 'ghost'} onClick={() => setActiveTab('exams')} className={cn("rounded-lg h-9 px-3 font-bold tracking-widest text-[12px] border-none uppercase", activeTab === 'exams' ? "bg-primary text-white" : "text-primary/40 hover:text-primary")}><BookOpen className="w-3 h-3 mr-2" />Exams</Button>
              <Button variant={activeTab === 'bank' ? 'default' : 'ghost'} onClick={() => setActiveTab('bank')} className={cn("rounded-lg h-9 px-3 font-bold tracking-widest text-[12px] border-none uppercase", activeTab === 'bank' ? "bg-primary text-white" : "text-primary/40 hover:text-primary")}><Library className="w-3 h-3 mr-2" />Bank</Button>
            </>
          )}
          {isRegAdmin && (
            <Button variant={activeTab === 'candidates' ? 'default' : 'ghost'} onClick={() => setActiveTab('candidates')} className={cn("rounded-lg h-9 px-3 font-bold tracking-widest text-[12px] border-none uppercase", activeTab === 'candidates' ? "bg-primary text-white" : "text-primary/40 hover:text-primary")}><Users className="w-3 h-3 mr-2" />Registry</Button>
          )}
          {isSuperAdmin && (
            <Button variant={activeTab === 'staff' ? 'default' : 'ghost'} onClick={() => setActiveTab('staff')} className={cn("rounded-lg h-9 px-3 font-bold tracking-widest text-[12px] border-none uppercase", activeTab === 'staff' ? "bg-primary text-white" : "text-primary/40 hover:text-primary")}><UserPlus className="w-3 h-3 mr-2" />Staff</Button>
          )}
          {isSuperAdmin && (
            <Button variant={activeTab === 'analytics' ? 'default' : 'ghost'} onClick={() => setActiveTab('analytics')} className={cn("rounded-lg h-9 px-3 font-bold tracking-widest text-[12px] border-none uppercase", activeTab === 'analytics' ? "bg-primary text-white" : "text-primary/40 hover:text-primary")}><BarChart2 className="w-3 h-3 mr-2" />Analytics</Button>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50">
        {activeTab === 'overview' && isExamAdmin ? (
          <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
             <div className="space-y-6">
                <h2 className="text-2xl font-black text-primary tracking-tighter uppercase">Operations Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <Card className="p-6 rounded-[24px] border-2 border-primary/10 bg-white shadow-lg">
                      <p className="text-[10px] font-black text-primary/40 mb-1">CANDIDATES</p>
                      <h4 className="text-4xl font-black text-primary">{candidates.length}</h4>
                   </Card>
                   <Card className="p-6 rounded-[24px] border-2 border-primary/10 bg-white shadow-lg">
                      <p className="text-[10px] font-black text-primary/40 mb-1">ACTIVE EXAMS</p>
                      <h4 className="text-4xl font-black text-primary">{exams.length}</h4>
                   </Card>
                   <Card className="p-6 rounded-[24px] border-2 border-primary/10 bg-white shadow-lg">
                      <p className="text-[10px] font-black text-primary/40 mb-1">QUESTION BANK</p>
                      <h4 className="text-4xl font-black text-primary">{bankQuestions.length}</h4>
                   </Card>
                   <Card className="p-6 rounded-[24px] border-2 border-primary/10 bg-white shadow-lg">
                      <p className="text-[10px] font-black text-primary/40 mb-1">ATTEMPTS</p>
                      <h4 className="text-4xl font-black text-primary">{attempts.length}</h4>
                   </Card>
                </div>
                <div className="p-8 rounded-[32px] bg-primary text-white flex justify-between items-center shadow-xl">
                   <div><h3 className="text-xl font-black mb-1">LIVE MONITORING</h3><p className="text-white/60 text-xs uppercase">OVERSEE ACTIVE TERMINALS IN REAL-TIME.</p></div>
                   <Button onClick={() => setActiveTab('monitor')} className="h-10 px-8 bg-white text-primary rounded-[16px] font-black text-[10px] uppercase">LAUNCH PANEL</Button>
                </div>
             </div>
          </div>
        ) : activeTab === 'monitor' && isExamAdmin ? (
          <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div><h2 className="text-2xl font-black text-primary leading-tight uppercase">OVERSIGHT</h2><p className="text-primary/40 font-bold text-[8px] uppercase">ACTIVE TERMINALS</p></div>
                <div className="px-3 py-1.5 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /><span className="text-[8px] font-black text-red-600 uppercase">{liveSessions.length} Online</span></div>
              </div>

              {redisSessions.length > 0 && (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 mb-4">
                  <p className="text-[10px] font-black text-sky-600 mb-2 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 bg-sky-500 rounded-full" /> Redis Cached Sessions ({redisSessions.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {redisSessions.map((rs, i) => (
                      <Badge key={i} variant="outline" className="bg-white border-sky-200 text-sky-700 text-[8px] font-bold">
                        {rs.userId}: {rs.progress?.answeredCount} Ans
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liveSessions.map(s => {
                  const c = candidates.find(can => can.examNumber === s.userId || can.id === s.userId);
                  const progress = s.totalPossible > 0 ? (Object.keys(s.answers || {}).length / s.totalPossible) * 100 : 0;
                  return (
                    <Card key={s.id} className="rounded-3xl border-2 border-primary/10 bg-white p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center font-black text-primary/40">{c?.fullName?.charAt(0) || "U"}</div>
                          <div><p className="font-black text-xs truncate max-w-[120px] uppercase">{c?.fullName || "ANONYMOUS"}</p><p className="text-[8px] font-bold text-primary/20">{s.userId}</p></div>
                        </div>
                        <div className="text-right"><p className="text-lg font-black text-primary uppercase">{(s as any).timeLeft ? Math.floor((s as any).timeLeft / 60) : '--'}M</p></div>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div><div className="flex justify-between text-[8px] font-black mb-1.5"><span className="text-primary/40 uppercase">Progress</span><span className="text-primary">{Math.round(progress)}%</span></div><div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div></div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setViewingSnaps(s.id)} className="flex-1 h-9 rounded-xl border border-primary/10 text-primary text-[8px] font-bold uppercase flex items-center gap-1.5">
                          <Camera className="w-3 h-3" /> View Snaps
                        </Button>
                        <Button onClick={() => handleRemoteAction(s.id, 'reset')} className="flex-1 h-9 rounded-xl border border-primary/10 text-primary text-[8px] font-bold uppercase">Reset PC</Button>
                        <Button onClick={() => handleRemoteAction(s.id, 'terminate')} className="flex-1 h-9 rounded-xl border border-primary/10 text-primary text-[8px] font-bold uppercase">Terminate</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Proctor Snapshot Gallery Modal */}
            <AnimatePresence>
              {viewingSnaps && (
                <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden">
                    <div className="p-6 bg-primary text-white flex justify-between items-center">
                      <h3 className="text-sm font-black tracking-widest uppercase">Oversight Snapshots</h3>
                      <Button variant="ghost" onClick={() => setViewingSnaps(null)} className="text-white h-8 w-8 hover:bg-white/10"><XCircle className="w-5 h-5" /></Button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-5 gap-3">
                        {liveSessions.find(s => s.id === viewingSnaps)?.proctoringSnaps?.map((snap, i) => (
                          <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden border-2 border-primary/5 hover:border-primary/40 transition-all cursor-zoom-in">
                            <img src={snap} className="w-full h-full object-cover grayscale contrast-125" />
                          </div>
                        )) || <div className="col-span-5 py-20 text-center opacity-20"><CameraOff className="w-12 h-12 mx-auto mb-2" /><p className="text-[10px] font-black uppercase">No Security Snaps Captured Yet</p></div>}
                      </div>
                      <p className="mt-6 text-[8px] font-bold text-primary/30 text-center uppercase">Snaps are periodically captured every 120 seconds for identity verification.</p>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : activeTab === 'candidates' && isRegAdmin ? (
          <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
            <div className="space-y-6">
              <div className="flex justify-between items-end"><div><h2 className="text-2xl font-black text-primary mb-0.5 uppercase">REGISTRY</h2><p className="text-primary/40 text-[12px] uppercase">CANDIDATE ENROLLMENT</p></div><Badge variant="outline" className="h-8 rounded-full border-2 text-[12px] px-4 font-black">{candidates.length} TOTAL</Badge></div>
              <Card className="rounded-[32px] border-2 border-primary/20 bg-white p-6 shadow-xl">
                <form onSubmit={handleCreateCandidate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5"><Label className="text-[12px] font-black opacity-40 uppercase">Full Name</Label><Input placeholder="FULL NAME" value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value.toUpperCase()})} required className="h-12 text-[12px] rounded-xl font-bold border-2 border-primary/5 focus:border-primary uppercase" /></div>
                    <div className="space-y-1.5"><Label className="text-[12px] font-black opacity-40 uppercase">Date of Birth</Label><Input type="date" value={newCandidate.dateOfBirth} onChange={e => setNewCandidate({...newCandidate, dateOfBirth: e.target.value})} required className="h-12 text-[12px] rounded-xl font-bold border-2 border-primary/5 focus:border-primary" /></div>
                    <div className="md:col-span-2 space-y-1.5"><Label className="text-[12px] font-black opacity-40 uppercase">Reg Number (System Assigned)</Label><Input value={newCandidate.examNumber || 'AUTO-GENERATED ON SAVE'} className="h-12 text-[12px] rounded-xl font-black bg-slate-50 border-none uppercase" disabled /></div>
                  </div>
                  <div className="space-y-2 text-left"><Label className="text-[12px] font-black opacity-40 uppercase">Subject Combination (Select 4)</Label><div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-3 border-2 rounded-xl bg-slate-50">{VIVI_SUBJECTS.map(sub => (<label key={sub} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-primary/10"><input type="checkbox" checked={newCandidate.subjects.includes(sub)} onChange={(e) => { const s = e.target.checked ? [...newCandidate.subjects, sub] : newCandidate.subjects.filter(x => x !== sub); if (s.length <= 4) setNewCandidate({...newCandidate, subjects: s}); }} className="w-3 h-3 accent-primary" /><span className="text-[12px] font-black text-primary/60 uppercase">{sub}</span></label>))}</div></div>
                  <div className="flex gap-4 pt-4 border-t-2 border-primary/5">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="w-full h-44 rounded-2xl bg-slate-50 border-2 border-dashed border-primary/10 flex items-center justify-center overflow-hidden">{newCandidate.faceUrl ? <img src={newCandidate.faceUrl} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 opacity-10 text-primary" />}</div>
                      <Button type="button" onClick={captureFace} className="h-9 text-[12px] font-black uppercase tracking-widest bg-white border-2 border-primary/10 text-primary hover:bg-primary hover:text-white">Capture Face</Button>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className={cn("w-full h-44 rounded-2xl border-2 flex items-center justify-center transition-all", newCandidate.fingerprintData ? "bg-sky-50 border-sky-400" : "bg-slate-50 border-dashed border-primary/10")}><Fingerprint className={cn("w-10 h-10", newCandidate.fingerprintData ? "text-sky-500" : "opacity-10")} /></div>
                      <Button type="button" onClick={captureFingerprint} className="h-9 text-[12px] font-black uppercase tracking-widest bg-white border-2 border-primary/10 text-primary hover:bg-primary hover:text-white">Enroll Finger</Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-black text-[12px] shadow-xl uppercase tracking-widest">{editingCandidateId ? 'Update Record' : 'Finalize Registration'}</Button>
                </form>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{candidates.map(c => (<Card key={c.id} className="p-4 border-2 border-primary/10 bg-white flex justify-between items-center group hover:border-primary transition-all rounded-2xl shadow-sm"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-primary/5 rounded-xl border-2 overflow-hidden flex items-center justify-center">{c.faceUrl ? <img src={c.faceUrl} className="w-full h-full object-cover" /> : <p className="font-black opacity-20 uppercase text-[12px]">{c.fullName.charAt(0)}</p>}</div><div><h4 className="font-black text-[12px] truncate max-w-[120px] uppercase">{c.fullName}</h4><p className="text-[12px] font-bold text-primary/40 uppercase tracking-widest">{c.examNumber}</p></div></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => startEditCandidate(c)} className="h-9 px-3 rounded-lg uppercase"><Pencil className="w-3 h-3" /></Button><Button variant="default" size="sm" onClick={() => handleStartCandidateExam(c.examNumber)} className="h-9 px-4 text-[12px] font-black uppercase">Run</Button><Button variant="ghost" size="icon" onClick={async () => { if(confirm("Permanently delete candidate?")) { await deleteDoc(doc(db, 'candidates', c.id)); fetchCandidates(); } }} className="h-9 w-9 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></Button></div></Card>))}</div>
            </div>
          </div>
        ) : activeTab === 'staff' && isSuperAdmin ? (
          <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div><h2 className="text-2xl font-black text-primary mb-0.5 uppercase">STAFF MANAGEMENT</h2><p className="text-primary/40 text-[10px] uppercase">AUTHORIZED PERSONNEL DIRECTORY</p></div>
                <Badge variant="outline" className="h-8 rounded-full border-2 text-[10px] px-4 font-black">{staff.length} ACTIVE OFFICERS</Badge>
              </div>
              <Card className="rounded-[32px] border-2 border-primary/20 bg-white p-8 shadow-xl">
                <form onSubmit={handleCreateStaff} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black opacity-40 uppercase">Full Name</Label><Input placeholder="OFFICER NAME" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value.toUpperCase()})} required className="h-12 rounded-xl font-bold border-2 border-primary/5 focus:border-primary uppercase" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black opacity-40 uppercase">Email Address</Label><Input type="email" placeholder="EMAIL@VIVICBT.COM" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} required className="h-12 rounded-xl font-bold border-2 border-primary/5 focus:border-primary uppercase" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black opacity-40 uppercase">Password</Label><Input type="password" placeholder="MIN 6 CHARACTERS" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} required className="h-12 rounded-xl font-bold border-2 border-primary/5 focus:border-primary uppercase" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black opacity-40 uppercase">Operational Role</Label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full h-12 px-4 rounded-xl border-2 border-primary/5 bg-slate-50 font-black text-[10px] focus:border-primary outline-none uppercase"><option value="reg_admin">REGISTRY ADMIN (RESTRICTED)</option><option value="admin">EXAM ADMIN (FULL ACCESS)</option></select></div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 uppercase"><p className="text-[9px] text-amber-700 font-black leading-tight uppercase flex items-center gap-2"><AlertCircle className="w-3 h-3" /> Note: Only Super Admins can manage staff records.</p></div>
                  <Button type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-black text-[11px] shadow-xl uppercase tracking-widest">Register Security Officer</Button>
                </form>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {staff.map(s => (
                  <Card key={s.uid} className="p-4 border-2 border-primary/10 bg-white flex justify-between items-center rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3"><div className="w-12 h-12 bg-primary/5 rounded-xl border-2 flex items-center justify-center font-black text-primary/40 uppercase">{s.displayName.charAt(0)}</div><div><h4 className="font-black text-xs truncate max-w-[120px] uppercase">{s.displayName}</h4><p className="text-[9px] font-bold text-primary/30 uppercase">{s.email}</p><Badge variant="outline" className="text-[7px] h-5 px-2 mt-1 uppercase font-black tracking-widest">{s.role.replace('_', ' ')}</Badge></div></div>
                    <Button variant="ghost" size="icon" onClick={async () => { if(confirm("Revoke all access for this officer?")) { await deleteDoc(doc(db, 'users', s.uid)); fetchStaff(); } }} className="h-10 w-10 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'exams' && isExamAdmin ? (
          <>
            <aside className="w-full md:w-80 bg-white border-r-2 border-primary/40 flex flex-col shrink-0 uppercase">
              <div className="p-6 border-b-2 border-primary/40 bg-slate-50">
                <h2 className="text-[11px] font-black text-primary mb-3">MANAGE SUBJECTS</h2>
                <form onSubmit={handleCreateOrUpdateExam} className="space-y-3">

                  <Input placeholder="SUBJECT" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value.toUpperCase()})} required className="h-11 text-xs rounded-lg font-black" />
                  <Input placeholder="DURATION (MIN)" type="number" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value) || 0})} required className="h-11 text-xs rounded-lg font-black" />
                  <Button type="submit" className="w-full h-11 bg-primary text-white rounded-lg font-black text-[12px] shadow-lg">SAVE</Button>
                </form>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {exams.map(e => (
                    <button key={e.id} onClick={() => setSelectedExamId(e.id)} className={cn("w-full text-left p-4 rounded-xl border-2 transition-all", selectedExamId === e.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-primary/5 hover:border-primary/20')}>
                       <p className="font-black text-[14px] truncate">{e.title}</p>
                       <p className={cn("text-[14px] font-bold mt-1", selectedExamId === e.id ? "text-white/60" : "text-primary/30")}>{e.subject} • {e.durationMinutes}M</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </aside>
            <section className="flex-1 overflow-y-auto p-6 bg-slate-50 uppercase">
              {selectedExamId ? (
                <div className="max-w-2xl mx-auto space-y-6 text-left">
                  <div className="flex justify-between items-end">
                    <div><h2 className="text-2xl font-black text-primary tracking-tighter">SUBJECTS</h2><p className="text-primary/40 text-[10px] font-bold">{exams.find(e => e.id === selectedExamId)?.title}</p></div>
                    <Badge variant="outline" className="h-8 rounded-full border-2 text-[10px] px-4 font-black">{questions.length} QUESTIONS</Badge>
                  </div>
                  <Card className="rounded-[24px] border-2 border-primary/20 bg-white p-6 shadow-xl">
                    <form onSubmit={handleAddOrUpdateQuestion} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black opacity-40">QUESTION CONTENT</Label>
                        <textarea className="w-full min-h-[100px] rounded-xl border-2 border-primary/5 bg-slate-50 p-4 text-sm font-bold focus:border-primary outline-none" placeholder="TYPE QUESTIONS HERE..." value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value.toUpperCase()})} required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black opacity-40 uppercase">Image URL (Optional)</Label>
                          <Input placeholder="HTTPS://..." value={newQuestion.imageUrl} onChange={e => setNewQuestion({...newQuestion, imageUrl: e.target.value})} className="h-11 text-xs rounded-lg font-black" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black opacity-40 uppercase">Audio URL (Optional)</Label>
                          <Input placeholder="HTTPS://..." value={newQuestion.audioUrl} onChange={e => setNewQuestion({...newQuestion, audioUrl: e.target.value})} className="h-11 text-xs rounded-lg font-black" />
                        </div>
                        {newQuestion.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <Input value={opt} onChange={e => { const o = [...newQuestion.options]; o[i] = e.target.value.toUpperCase(); setNewQuestion({...newQuestion, options: o}); }} className="h-12 text-xs font-black rounded-lg" placeholder={`OPTION ${String.fromCharCode(65 + i)}`} required />
                            <Button type="button" onClick={() => setNewQuestion({...newQuestion, correctOptionIndex: i})} className={cn("h-12 px-4 rounded-lg border-2", newQuestion.correctOptionIndex === i ? "bg-primary text-white border-primary shadow-md" : "text-primary border-primary/5")}>
                              {newQuestion.correctOptionIndex === i ? <CheckCircle className="w-4 h-4" /> : i+1}
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button type="submit" className="w-full h-14 bg-primary text-white rounded-xl font-black text-[11px] shadow-xl">COMMIT TO MODULE</Button>
                    </form>
                  </Card>
                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <Card key={q.id} className="p-4 border-2 border-primary/5 bg-white hover:border-primary/10 rounded-2xl shadow-sm">
                         <div className="flex justify-between items-start gap-4">
                            <div className="flex-1"><Badge className="bg-primary/5 text-primary text-[8px] mb-2 font-black">ITEM {idx + 1}</Badge><p className="font-bold text-xs leading-relaxed">{q.text}</p></div>
                            <Button variant="ghost" size="icon" onClick={async () => { if(confirm("Delete item?")) { await deleteDoc(doc(db, 'exams', selectedExamId, 'questions', q.id)); await updateDoc(doc(db, 'exams', selectedExamId), { totalQuestions: questions.length - 1 }); fetchQuestions(selectedExamId); } }} className="text-red-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                         </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center opacity-20"><div className="text-center"><BookOpen className="w-16 h-16 mx-auto mb-4" /><p className="font-black text-xs">SELECT A MODULE FROM THE SIDEBAR</p></div></div>
              )}
            </section>
          </>
        ) : activeTab === 'bank' && isExamAdmin ? (
          <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full uppercase">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div><h2 className="text-2xl font-black text-primary tracking-tighter uppercase">QUESTION BANK</h2><p className="text-primary/40 text-[8px] font-bold">CENTRAL REPOSITORY</p></div>
                <div className="flex gap-2">
                  {selectedBankQuestions.size > 0 && <Button onClick={handleBatchImportToExam} className="h-8 bg-sky-500 text-white rounded-lg font-black text-[8px] px-4 shadow-lg">ASSIGN {selectedBankQuestions.size} ITEMS TO {selectedExamId ? 'MODULE' : '...'}</Button>}
                  <Badge variant="outline" className="h-8 rounded-full border-2 text-[10px] px-4 font-black">{bankQuestions.length} TOTAL ITEMS</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card className="p-6 rounded-[24px] border-2 border-primary/10 bg-white shadow-xl">
                    <h3 className="text-[10px] font-black text-primary mb-4 flex items-center gap-2"><PlusCircle className="w-4 h-4" /> MANUAL ENTRY</h3>
                    <div className="space-y-4">
                       <textarea className="w-full min-h-[80px] rounded-xl border-2 border-primary/5 bg-slate-50 p-4 text-xs font-bold focus:border-primary outline-none" placeholder="QUESTION TEXT..." value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value.toUpperCase()})} />
                       <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="IMAGE URL" value={newQuestion.imageUrl} onChange={e => setNewQuestion({...newQuestion, imageUrl: e.target.value})} className="h-10 text-[9px] font-black" />
                          <Input placeholder="AUDIO URL" value={newQuestion.audioUrl} onChange={e => setNewQuestion({...newQuestion, audioUrl: e.target.value})} className="h-10 text-[9px] font-black" />
                          {newQuestion.options.map((opt, i) => <Input key={i} placeholder={`OPT ${i+1}`} value={opt} onChange={e => { const o = [...newQuestion.options]; o[i] = e.target.value.toUpperCase(); setNewQuestion({...newQuestion, options: o}); }} className="h-10 text-[9px] font-black" />)}
                       </div>
                       <Button onClick={() => addToBank(newQuestion)} className="w-full h-11 bg-primary text-white rounded-xl font-black text-[9px] shadow-lg">STORE IN BANK</Button>
                    </div>
                 </Card>
                 <Card className="p-6 rounded-[24px] border-2 border-primary/10 bg-white shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-primary mb-2 flex items-center gap-2"><Upload className="w-4 h-4" /> BULK UPLOAD</h3>
                      <p className="text-[8px] text-primary/40 font-bold mb-4">UPLOAD CSV (Q, A, B, C, D, KEY)</p>
                      <div className="relative group">
                        <Input type="file" accept=".csv" onChange={handleQuestionBulkUpload} className="h-24 border-2 border-dashed border-primary/20 rounded-2xl cursor-pointer pt-14 text-center text-[7px] font-black" />
                        <div className="absolute top-6 left-0 right-0 pointer-events-none flex flex-col items-center"><Upload className="w-8 h-8 text-primary/10 mb-1" /><span className="text-[8px] font-black text-primary/30 uppercase tracking-tighter">SELECT ASSESSMENT FILE</span></div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /><p className="text-[7px] text-amber-600 font-black">ENSURE PROPER CSV FORMATTING BEFORE UPLOAD.</p></div>
                 </Card>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {bankQuestions.map((q, idx) => {
                  const isSelected = selectedBankQuestions.has(q.id);
                  return (
                    <Card key={q.id} className={cn("p-4 border-2 transition-all cursor-pointer rounded-2xl", isSelected ? "border-primary bg-primary/5 shadow-md" : "border-primary/5 bg-white hover:border-primary/20")} onClick={() => { const n = new Set(selectedBankQuestions); if(n.has(q.id)) n.delete(q.id); else n.add(q.id); setSelectedBankQuestions(n); }}>
                      <div className="flex justify-between items-start gap-4">
                         <div className="flex-1"><div className="flex items-center gap-2 mb-2"><div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-primary/20")}>{isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}</div><Badge className="bg-primary/5 text-primary text-[8px] font-black">ITEM {idx + 1}</Badge></div><p className="font-black text-xs leading-relaxed">{q.text}</p></div>
                         <Button variant="ghost" size="icon" onClick={async (e) => { e.stopPropagation(); if(confirm("Remove from bank?")) { await deleteDoc(doc(db, 'question_bank', q.id)); fetchQuestionBank(); } }} className="text-red-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'analytics' && isSuperAdmin ? (
          <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full uppercase">
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-tighter uppercase">INTELLIGENCE</h2>
                  <div className="flex gap-4 mt-2">
                    <button onClick={() => setAnalyticsMode('performance')} className={cn("text-[10px] font-black tracking-widest uppercase", analyticsMode === 'performance' ? "text-primary border-b-2 border-primary" : "text-primary/30")}>Student Performance</button>
                    <button onClick={() => setAnalyticsMode('items')} className={cn("text-[10px] font-black tracking-widest uppercase", analyticsMode === 'items' ? "text-primary border-b-2 border-primary" : "text-primary/30")}>Item Difficulty Analysis</button>
                  </div>
                </div>
                <Badge className="h-8 rounded-full border-2 bg-primary text-white text-[10px] px-4 font-black">{attempts.length} RECORDS</Badge>
              </div>

              {analyticsMode === 'performance' ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="rounded-[32px] border-2 border-primary/10 p-6 bg-white shadow-xl">
                      <h3 className="text-[10px] font-black text-primary/40 mb-6">PASS RATE DISTRIBUTION</h3>
                      <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={exams.map(e => { const at = attempts.filter(a => a.examId === e.id); if (at.length === 0) return null; return { name: e.subject, rate: Math.round((at.filter(a => a.score >= (a.totalPossible / 2)).length / at.length) * 100) }; }).filter(Boolean)}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--primary) / 0.05)" /><XAxis dataKey="name" hide /><YAxis axisLine={false} tickLine={false} tick={{fill: 'oklch(var(--primary))', fontSize: 10, fontWeight: 900}} unit="%" /><Tooltip contentStyle={{borderRadius: '16px', border: 'none', background: 'white', fontWeight: 900, fontSize: 10}} /><Bar dataKey="rate" fill="oklch(var(--primary))" radius={[8, 8, 8, 8]} barSize={40} /></BarChart></ResponsiveContainer></div>
                    </Card>
                    <Card className="rounded-[32px] border-2 border-primary/10 p-6 bg-white shadow-xl">
                      <h3 className="text-[10px] font-black text-primary/40 mb-6">PERFORMANCE TREND</h3>
                      <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={exams.map(e => { const at = attempts.filter(a => a.examId === e.id); if (at.length === 0) return null; return { name: e.subject, score: parseFloat((at.reduce((acc, c) => acc + c.score, 0) / at.length).toFixed(1)) }; }).filter(Boolean)}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--primary) / 0.05)" /><XAxis dataKey="name" hide /><YAxis axisLine={false} tickLine={false} tick={{fill: 'oklch(var(--primary))', fontSize: 10, fontWeight: 900}} /><Tooltip contentStyle={{borderRadius: '16px', border: 'none', background: 'white', fontWeight: 900, fontSize: 10}} /><Area type="monotone" dataKey="score" stroke="oklch(var(--primary))" fill="oklch(var(--primary) / 0.1)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
                    </Card>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <aside className="space-y-2">
                        <p className="text-[10px] font-black text-primary/30 tracking-widest px-2 mb-4">MODULES</p>
                        {exams.map(e => (
                          <button key={e.id} onClick={() => setSelectedAnalyticsExam(e.id)} className={cn("w-full text-left p-4 rounded-xl border-2 transition-all", selectedAnalyticsExam === e.id ? "bg-primary text-white border-primary shadow-md" : "bg-white border-primary/5 hover:border-primary/10")}>
                            <p className="font-black text-[10px] truncate uppercase">{e.title}</p>
                          </button>
                        ))}
                    </aside>
                    <div className="md:col-span-3">
                      {selectedAnalyticsExam ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              {(() => {
                                const at = attempts.filter(a => a.examId === selectedAnalyticsExam);
                                const avg = at.length > 0 ? at.reduce((acc, c) => acc + c.score, 0) / at.length : 0;
                                return (<><Card className="p-4 bg-white border-2 border-primary/5 rounded-2xl"><p className="text-[8px] font-black text-primary/40 mb-1 uppercase">AVG SCORE</p><h5 className="text-2xl font-black">{avg.toFixed(1)}</h5></Card><Card className="p-4 bg-white border-2 border-primary/5 rounded-2xl"><p className="text-[8px] font-black text-primary/40 mb-1 uppercase">PASS RATE</p><h5 className="text-2xl font-black">{at.length > 0 ? Math.round((at.filter(a => a.score >= a.totalPossible/2).length/at.length)*100) : 0}%</h5></Card><Card className="p-4 bg-white border-2 border-primary/5 rounded-2xl"><p className="text-[8px] font-black text-primary/40 mb-1 uppercase">HIGHEST</p><h5 className="text-2xl font-black">{at.length > 0 ? Math.max(...at.map(a => a.score)) : 0}</h5></Card></>);
                              })()}
                            </div>
                            <div className="space-y-2">
                              {attempts.filter(a => a.examId === selectedAnalyticsExam).map(at => {
                                const c = candidates.find(can => can.examNumber === at.userId || can.id === at.userId);
                                return (
                                  <Card key={at.id} className="p-4 border-2 border-primary/5 bg-white flex justify-between items-center rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/5 rounded-xl border-2 flex items-center justify-center font-black text-primary/40 uppercase">{c?.fullName?.charAt(0) || "U"}</div><div><p className="font-black text-xs uppercase truncate max-w-[150px]">{c?.fullName || "ANONYMOUS"}</p><p className="text-[8px] font-bold text-primary/20">{at.userId}</p></div></div>
                                    <div className="flex items-center gap-4"><p className="text-xl font-black">{at.score}/{at.totalPossible}</p>{at.released ? <Badge className="bg-sky-400 text-white text-[7px] border-none font-black uppercase">SENT</Badge> : <Button onClick={() => handleReleaseResult(at.id)} disabled={releasing === at.id} className="h-8 text-[8px] font-black px-4 bg-primary text-white rounded-lg shadow-md uppercase">RELEASE</Button>}</div>
                                  </Card>
                                );
                              })}
                            </div>
                        </div>
                      ) : (
                        <div className="h-[400px] bg-slate-50 border-2 border-dashed border-primary/10 rounded-[32px] flex flex-col items-center justify-center p-8 text-center opacity-30"><PieChartIcon className="w-10 h-10 mb-4" /><p className="text-[10px] font-black uppercase">SELECT A MODULE TO VIEW ANALYTICS</p></div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                   <aside className="flex gap-2 overflow-x-auto pb-4">
                      {exams.map(e => (
                        <button key={e.id} onClick={() => setSelectedAnalyticsExam(e.id)} className={cn("px-6 py-3 rounded-full border-2 whitespace-nowrap text-[10px] font-black transition-all", selectedAnalyticsExam === e.id ? "bg-primary text-white border-primary" : "bg-white border-primary/5")}>{e.subject}</button>
                      ))}
                   </aside>

                   {selectedAnalyticsExam && analyticsQuestions[selectedAnalyticsExam] ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analyticsQuestions[selectedAnalyticsExam].map((q, idx) => {
                          const atForExam = attempts.filter(a => a.examId === selectedAnalyticsExam || a.results?.some((r: any) => r.examId === selectedAnalyticsExam));
                          const correctCount = atForExam.filter(a => a.answers?.[q.id] === q.correctOptionIndex).length;
                          const totalAns = atForExam.filter(a => a.answers?.[q.id] !== undefined).length;
                          const difficulty = totalAns > 0 ? Math.round((correctCount / totalAns) * 100) : 0;

                          return (
                            <Card key={q.id} className="p-6 bg-white border-2 border-primary/10 rounded-[24px]">
                               <div className="flex justify-between items-start mb-4">
                                  <Badge className="bg-primary/5 text-primary text-[8px] font-black uppercase">Item {idx + 1}</Badge>
                                  <div className="text-right">
                                     <p className="text-[10px] font-black text-primary uppercase">Difficulty: {difficulty}%</p>
                                     <div className="w-24 h-1.5 bg-primary/5 rounded-full mt-1 overflow-hidden">
                                        <div className={cn("h-full transition-all", difficulty > 70 ? "bg-emerald-500" : difficulty > 40 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${difficulty}%` }} />
                                     </div>
                                  </div>
                               </div>
                               <p className="text-[11px] font-bold text-primary/60 mb-4 line-clamp-2 uppercase">{q.text}</p>
                               <div className="flex items-center gap-6 text-[9px] font-black uppercase">
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Correct: {correctCount}</div>
                                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> Wrong: {totalAns - correctCount}</div>
                               </div>
                            </Card>
                          );
                        })}
                     </div>
                   ) : (
                     <div className="h-[400px] bg-slate-50 border-2 border-dashed border-primary/10 rounded-[32px] flex items-center justify-center text-center opacity-30"><p className="text-[10px] font-black uppercase">Select a module to view Item Response data</p></div>
                   )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <XCircle className="w-16 h-16 text-red-200 mb-6" />
            <h2 className="text-3xl font-black text-primary tracking-tighter uppercase">Access Denied</h2>
            <p className="text-primary/40 font-bold max-w-sm mx-auto leading-relaxed mt-4 uppercase">YOUR ACCOUNT PRIVILEGES ARE RESTRICTED TO THE CANDIDATE REGISTRY MODULE ONLY. PLEASE CONTACT A SUPER ADMIN FOR FULL ACCESS.</p>
            <Button onClick={() => setActiveTab('candidates')} className="mt-8 h-12 px-10 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Return to Registry</Button>
          </div>
        )}
      </main>

      {/* Biometric Capture Overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm bg-white rounded-[32px] border-2 border-primary/40 shadow-2xl overflow-hidden uppercase">
              <div className="bg-primary p-4 text-white flex justify-between items-center"><div className="flex items-center gap-2"><Camera className="w-4 h-4" /><h3 className="text-sm font-black tracking-widest uppercase">Identity Capture</h3></div><Button variant="ghost" size="icon" onClick={closeCamera} className="text-white h-8 w-8"><XCircle className="w-5 h-5" /></Button></div>
              <div className="p-6 space-y-6">
                <div className="relative aspect-square max-w-[280px] mx-auto rounded-full bg-black overflow-hidden border-4 border-primary/10 shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-110" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full border-[12px] border-white/10 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={snapPhoto} className="flex-1 h-12 bg-primary text-white rounded-xl font-black shadow-lg border-none uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" /> Snap Photo
                  </Button>
                  <Button
                    onClick={async () => {
                      toast.loading("Scanning Fingerprint...");
                      await new Promise(r => setTimeout(r, 1500));
                      setNewCandidate(p => ({ ...p, fingerprintData: "FP_" + Math.random().toString(36).slice(2, 9) }));
                      toast.dismiss();
                      toast.success("Fingerprint Linked!");
                    }}
                    className="flex-1 h-12 bg-sky-500 text-white rounded-xl font-black shadow-lg border-none uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4" /> Scan Finger
                  </Button>
                </div>
                <Button variant="outline" onClick={closeCamera} className="w-full h-10 rounded-xl border-2 border-primary/20 font-black uppercase text-[9px]">Close Terminal</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-6 z-10 w-full text-center border-t border-primary/5 bg-white uppercase">
        <p className="text-[10px] font-bold text-primary/20 tracking-widest uppercase">&copy; {new Date().getFullYear()} VIVI CBT Systems. Secure Administrative Terminal.</p>
      </footer>
    </div>
  );
}
