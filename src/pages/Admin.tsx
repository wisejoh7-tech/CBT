import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exam, Question, Attempt, Candidate, UserProfile } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Card } from '@/lib/ui/card';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { 
  Trash2, BookOpen, PlusCircle, Users, Search, BarChart2, Shield, LogOut, Camera, Printer, Upload, Database, CameraOff, User, Eye, XCircle, Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { cn } from '@/src/lib/utils/utils';
import { getApiUrl } from '@/src/lib/api-config';

export default function Admin() {
  const { profile, logOut } = useAuth();
  const { socket } = useSocket();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'candidates' | 'monitor' | 'staff' | 'analytics' | 'center' | 'audit' | 'security'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [viewingSnaps, setViewingSnaps] = useState<string | null>(null);

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  const fetchAnalytics = useCallback(async () => {
    const res = await fetch(getApiUrl('/analytics/summary'), { headers: getHeaders() });
    if (res.ok) setAnalytics(await res.json());
  }, [getHeaders]);

  const fetchExams = useCallback(async () => {
    const res = await fetch(getApiUrl('/exams'), { headers: getHeaders() });
    if (res.ok) setExams(await res.json());
  }, [getHeaders]);

  const fetchCandidates = useCallback(async () => {
    const res = await fetch(getApiUrl('/candidates'), { headers: getHeaders() });
    if (res.ok) setCandidates(await res.json());
  }, [getHeaders]);

  const fetchStaff = useCallback(async () => {
    const res = await fetch(getApiUrl('/auth/staff'), { headers: getHeaders() });
    if (res.ok) setStaff(await res.json());
  }, [getHeaders]);

  const fetchAttempts = useCallback(async () => {
    const res = await fetch(getApiUrl('/exams/attempts/all'), { headers: getHeaders() });
    if (res.ok) setAttempts(await res.json());
  }, [getHeaders]);

  const fetchSeats = useCallback(async () => {
    const res = await fetch(getApiUrl('/center/seats'), { headers: getHeaders() });
    if (res.ok) setSeats(await res.json());
  }, [getHeaders]);

  const fetchLogs = useCallback(async () => {
    const res = await fetch(getApiUrl('/analytics/logs'), { headers: getHeaders() });
    if (res.ok) setLogs(await res.json());
  }, [getHeaders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('progress-updated', () => fetchAttempts());
    socket.on('security-alert', (data: any) => {
      toast.error(`SECURITY ALERT: ${data.userId} trust score dropped to ${Math.round(data.trustScore)}% - ${data.reason}`, { duration: 5000 });
      fetchAttempts();
    });
    return () => {
      socket.off('progress-updated');
      socket.off('security-alert');
    };
  }, [socket, fetchAttempts]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      fetchExams(),
      fetchCandidates(),
      fetchAttempts(),
      fetchAnalytics(),
      fetchSeats(),
      fetchLogs()
    ]).then(() => {
       if (profile.role === 'super_admin') fetchStaff();
       setLoading(false);
    });
  }, [profile, fetchExams, fetchCandidates, fetchAttempts, fetchStaff, fetchAnalytics, fetchSeats, fetchLogs]);

  useEffect(() => {
    if (selectedExamId) {
      fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setQuestions(data.questions || []));
    }
  }, [selectedExamId, getHeaders]);

  const [newExam, setNewExam] = useState({ title: '', subject: '', durationMinutes: 30, startTime: '', endTime: '' });
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, topic: 'General' });
  const [newCandidate, setNewCandidate] = useState({ fullName: '', email: '', examNumber: '', subjects: [] as string[], assignedIp: '', assignedSeatNumber: '', faceUrl: '' });

  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCapture = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch(e) { toast.error("Camera access denied."); setIsCapturing(false); }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setNewCandidate({ ...newCandidate, faceUrl: canvas.toDataURL('image/jpeg') });
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/exams'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...newExam, createdBy: profile?.displayName, totalQuestions: 0 })
    });
    if (res.ok) {
      toast.success("Exam Created");
      setNewExam({ title: '', subject: '', durationMinutes: 30, startTime: '', endTime: '' });
      fetchExams();
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    const res = await fetch(getApiUrl(`/exams/${selectedExamId}/questions`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newQuestion)
    });
    if (res.ok) {
      toast.success("Question Added");
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, topic: 'General' });
      fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setQuestions(data.questions || []));
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/candidates'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...newCandidate,
        status: 'active',
        thumbprinted: false,
        subjectCombination: newCandidate.subjects,
        registrationDate: new Date().toISOString()
      })
    });
    if (res.ok) {
      toast.success("Candidate Registered");
      setNewCandidate({ fullName: '', email: '', examNumber: '', subjects: [], assignedIp: '', assignedSeatNumber: '', faceUrl: '' });
      fetchCandidates();
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = (ev.target?.result as string).split('\n').filter(l => l.trim());
      const payload: any[] = [];
      for (const line of lines) {
        const [name, dob, s1, s2, s3, s4] = line.split(',').map(s => s.trim());
        if (name && dob) {
          payload.push({
            fullName: name.toUpperCase(),
            examNumber: `${new Date().getFullYear()}${Math.floor(Math.random()*1000000)}`,
            dateOfBirth: dob,
            subjectCombination: [s1, s2, s3, s4],
            status: 'active',
            thumbprinted: false,
            registrationDate: new Date().toISOString()
          });
        }
      }
      const res = await fetch(getApiUrl('/candidates/bulk'), { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
      if (res.ok) { toast.success("Bulk Upload Successful"); fetchCandidates(); }
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="p-20 text-center font-black">ACCESSING SECURE DATA...</div>;

  const isSuperAdmin = profile?.role === 'super_admin';
  const isRegStaff = profile?.role === 'reg_admin';
  const isFullAdmin = profile?.role === 'admin' || isSuperAdmin;

  const tabs = [
    { id: 'overview', label: 'Overview', roles: ['super_admin', 'admin'] },
    { id: 'candidates', label: 'Candidates', roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'exams', label: 'Exams', roles: ['super_admin', 'admin'] },
    { id: 'monitor', label: 'Monitor', roles: ['super_admin', 'admin'] },
    { id: 'analytics', label: 'Analytics', roles: ['super_admin', 'admin'] },
    { id: 'center', label: 'Center', roles: ['super_admin', 'admin'] },
    { id: 'staff', label: 'Staff', roles: ['super_admin'] },
    { id: 'security', label: 'Security', roles: ['super_admin'] },
  ];

  const filteredTabs = tabs.filter(t => t.roles.includes(profile?.role || ''));

  useEffect(() => {
    if (filteredTabs.length > 0 && !filteredTabs.find(t => t.id === activeTab)) {
      setActiveTab(filteredTabs[0].id as any);
    }
  }, [profile, activeTab, filteredTabs]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 uppercase">
      <header className="h-16 bg-white border-b-2 border-primary/10 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><Shield className="w-5 h-5" /></div>
            <h1 className="font-black tracking-tighter text-primary">ADMIN CONTROL</h1>
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-primary/40 leading-none">{profile?.role?.replace('_', ' ')}</p>
            <p className="font-bold text-xs">{profile?.displayName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logOut?.(); navigate('/'); }} className="rounded-full"><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="flex bg-white border-b-2 border-primary/5 p-2 gap-2 overflow-x-auto justify-center">
        {filteredTabs.map((tab) => (
          <Button key={tab.id} variant={activeTab === tab.id ? 'default' : 'ghost'} onClick={() => setActiveTab(tab.id as any)} className={cn("h-10 px-6 font-black text-[10px] tracking-widest rounded-xl", activeTab === tab.id ? "bg-primary text-white" : "text-primary/40")}>
            {tab.label.toUpperCase()}
          </Button>
        ))}
      </div>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Exams', value: exams.length, icon: BookOpen },
                  { label: 'Candidates', value: candidates.length, icon: Users },
                  { label: 'Avg Score', value: analytics?.averageScore || '0.00', icon: BarChart2 },
                  { label: 'Pass Rate', value: (analytics?.passRate || '0') + '%', icon: Shield }
                ].map((stat, i) => (
                  <Card key={i} className="p-8 rounded-[32px] border-2 border-primary/10 shadow-xl bg-white">
                    <stat.icon className="w-6 h-6 text-primary/20 mb-4" />
                    <p className="text-[10px] font-black text-primary/40 mb-1">{stat.label.toUpperCase()}</p>
                    <h4 className="text-4xl font-black">{stat.value}</h4>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black">SYSTEM INTELLIGENCE</h2>
                   <Button onClick={async () => {
                      const res = await fetch(getApiUrl('/analytics/export-results'), { headers: getHeaders() });
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'cbt_results_export.csv';
                        a.click();
                      }
                   }} className="h-10 bg-primary text-white font-black text-[10px] tracking-widest rounded-xl px-6 flex gap-2">
                      <Database className="w-4 h-4" /> EXPORT ALL RESULTS
                   </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                   <Card className="p-8 rounded-[32px] border-2 bg-white">
                      <h3 className="text-xs font-black mb-6 uppercase tracking-widest">Performance Metrics</h3>
                      <div className="space-y-6">
                         <div className="flex justify-between items-end border-b pb-4">
                            <span className="text-[10px] font-black opacity-30">CUMULATIVE PASS RATE</span>
                            <span className="text-3xl font-black text-emerald-500">{analytics?.passRate}%</span>
                         </div>
                         <div className="flex justify-between items-end border-b pb-4">
                            <span className="text-[10px] font-black opacity-30">AVERAGE RAW SCORE</span>
                            <span className="text-3xl font-black text-primary">{analytics?.averageScore}</span>
                         </div>
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black opacity-30">TOTAL SUBMISSIONS</span>
                            <span className="text-3xl font-black">{analytics?.totalAttempts}</span>
                         </div>
                      </div>
                   </Card>
                   <Card className="p-8 rounded-[32px] border-2 bg-white flex flex-col justify-center items-center text-center">
                      <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                         <Shield className="w-10 h-10 text-primary/20" />
                      </div>
                      <h3 className="font-black text-sm uppercase">Secure System</h3>
                      <p className="text-[10px] font-bold opacity-30 mt-2">All analytics are computed in real-time from encrypted session logs.</p>
                   </Card>
                </div>
             </div>
          )}

          {activeTab === 'exams' && (
            <div className="grid md:grid-cols-[300px_1fr] gap-8">
              <aside className="space-y-4">
                <Card className="p-6 rounded-[24px] border-2">
                  <h3 className="text-xs font-black mb-4">NEW MODULE</h3>
                  <form onSubmit={handleCreateExam} className="space-y-4">
                    <Input placeholder="SUBJECT" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} required className="h-12 text-[10px] font-bold" />
                    <Input placeholder="TITLE" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} required className="h-12 text-[10px] font-bold" />
                    <Input type="number" placeholder="MINUTES" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} required className="h-12 text-[10px] font-bold" />
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <p className="text-[8px] font-black opacity-30">START</p>
                          <Input type="datetime-local" value={newExam.startTime} onChange={e => setNewExam({...newExam, startTime: e.target.value})} className="h-10 text-[9px]" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[8px] font-black opacity-30">END</p>
                          <Input type="datetime-local" value={newExam.endTime} onChange={e => setNewExam({...newExam, endTime: e.target.value})} className="h-10 text-[9px]" />
                       </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-primary text-white font-black rounded-xl">CREATE</Button>
                  </form>
                </Card>
                <div className="space-y-2">
                  {exams.map(e => (
                    <button key={e.id} onClick={() => setSelectedExamId(e.id)} className={cn("w-full text-left p-4 rounded-xl border-2 transition-all", selectedExamId === e.id ? "bg-primary text-white border-primary" : "bg-white border-primary/5")}>
                      <p className="font-black text-xs">{e.subject}</p>
                      <p className="text-[10px] opacity-60">{e.title}</p>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="space-y-6">
                {selectedExamId ? (
                  <div className="space-y-6">
                    <Card className="p-8 rounded-[32px] border-2 bg-white">
                      <h3 className="text-xs font-black mb-6">ADD QUESTION</h3>
                      <form onSubmit={handleAddQuestion} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <textarea className="col-span-2 w-full h-24 p-4 rounded-xl border-2 border-primary/5 bg-slate-50 font-bold text-xs" placeholder="QUESTION TEXT" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} required />
                           <Input placeholder="TOPIC" value={newQuestion.topic} onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})} className="h-12 text-[10px] font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {newQuestion.options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                              <Input placeholder={`OPTION ${i+1}`} value={opt} onChange={e => {
                                const o = [...newQuestion.options]; o[i] = e.target.value; setNewQuestion({...newQuestion, options: o});
                              }} className="h-12 text-[10px] font-bold" />
                              <button type="button" onClick={() => setNewQuestion({...newQuestion, correctOptionIndex: i})} className={cn("w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black", newQuestion.correctOptionIndex === i ? "bg-primary text-white" : "bg-primary/5")}>{i+1}</button>
                            </div>
                          ))}
                        </div>
                        <Button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-xl">SAVE QUESTION</Button>
                      </form>
                    </Card>

                    <Card className="p-8 rounded-[32px] border-2 bg-gradient-to-br from-primary/5 to-sky-50 border-primary/10">
                       <div className="flex items-center gap-3 mb-6">
                          <PlusCircle className="w-5 h-5 text-primary" />
                          <h3 className="text-xs font-black uppercase tracking-widest">AI Quest Engine</h3>
                       </div>
                       <p className="text-[10px] font-bold opacity-40 mb-4">Generate multiple questions instantly using Gemini 2.0 Flash.</p>
                       <form onSubmit={async (e) => {
                          e.preventDefault();
                          const syllabus = (e.currentTarget.elements.namedItem('syllabus') as HTMLTextAreaElement).value;
                          const count = parseInt((e.currentTarget.elements.namedItem('count') as HTMLInputElement).value);
                          toast.promise(fetch(getApiUrl(`/exams/${selectedExamId}/ai-generate`), {
                             method: 'POST',
                             headers: getHeaders(),
                             body: JSON.stringify({ syllabus, count })
                          }), {
                             loading: 'AI is thinking...',
                             success: () => {
                                fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() })
                                  .then(res => res.json())
                                  .then(data => setQuestions(data.questions || []));
                                return 'Questions Generated!';
                             },
                             error: 'AI Failed to respond.'
                          });
                       }} className="space-y-4">
                          <textarea name="syllabus" className="w-full h-24 p-4 rounded-xl border-2 border-primary/5 bg-white font-bold text-xs" placeholder="Paste syllabus content here..." required />
                          <div className="flex gap-4">
                             <Input name="count" type="number" defaultValue="10" className="h-12 text-[10px] font-bold" />
                             <Button type="submit" className="flex-1 h-12 bg-primary text-white font-black rounded-xl">GENERATE</Button>
                          </div>
                       </form>
                    </Card>

                    <div className="space-y-3">
                      {questions.map((q, i) => (
                        <Card key={q.id} className="p-6 rounded-2xl border-2 bg-white flex justify-between items-center">
                          <div className="flex-1">
                            <Badge className="bg-primary/5 text-primary text-[8px] mb-2">ITEM {i+1} • {q.topic}</Badge>
                            <p className="font-bold text-xs">{q.text}</p>
                          </div>
                          <Button variant="ghost" onClick={async () => {
                            await fetch(getApiUrl(`/exams/questions/${q.id}`), { method: 'DELETE', headers: getHeaders() });
                            fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() }).then(res => res.json()).then(data => setQuestions(data.questions || []));
                          }} className="text-red-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-10 font-black">SELECT A MODULE</div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-8">
              <Card className="p-8 rounded-[32px] border-2 border-primary/10 bg-white shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-xl font-black text-primary tracking-tighter uppercase">Bulk Enrollment</h3>
                       <p className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Register multiple candidates via CSV</p>
                    </div>
                    <Upload className="w-5 h-5 text-primary" />
                 </div>
                 <div className="relative group">
                    <Input type="file" accept=".csv" onChange={handleBulkUpload} className="h-24 border-2 border-dashed border-primary/20 rounded-2xl cursor-pointer pt-14 text-center text-[10px] font-black" />
                    <div className="absolute top-6 left-0 right-0 pointer-events-none flex flex-col items-center">
                       <Database className="w-8 h-8 text-primary/10 mb-1" />
                       <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">Select Enrollment Data (.csv)</span>
                    </div>
                 </div>
              </Card>

              <div className="grid md:grid-cols-[350px_1fr] gap-8">
                <Card className="p-8 rounded-[32px] border-2 bg-white h-fit">
                  <h3 className="text-xs font-black mb-6 uppercase">Register Candidate</h3>
                  <form onSubmit={handleCreateCandidate} className="space-y-4">
                    <div className="flex justify-center mb-4">
                       {newCandidate.faceUrl ? (
                          <div className="relative group">
                             <img src={newCandidate.faceUrl} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
                             <button type="button" onClick={() => setNewCandidate({...newCandidate, faceUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-3 h-3" /></button>
                          </div>
                       ) : isCapturing ? (
                          <div className="space-y-2 text-center">
                             <video ref={videoRef} autoPlay className="w-48 h-36 rounded-2xl bg-black object-cover" />
                             <Button type="button" onClick={capturePhoto} className="h-8 px-4 text-[8px] bg-primary text-white font-black rounded-lg">SNAP PHOTO</Button>
                          </div>
                       ) : (
                          <button type="button" onClick={startCapture} className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 hover:border-primary transition-all">
                             <Camera className="w-6 h-6 text-primary/20" />
                             <span className="text-[8px] font-black opacity-30">CAPTURE FACE</span>
                          </button>
                       )}
                    </div>
                    <Input placeholder="FULL NAME" value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})} required className="h-12 text-[10px] font-bold" />
                    <Input placeholder="EXAM NUMBER" value={newCandidate.examNumber} onChange={e => setNewCandidate({...newCandidate, examNumber: e.target.value})} required className="h-12 text-[10px] font-bold" />
                    <Input placeholder="EMAIL" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} className="h-12 text-[10px] font-bold" />
                    <div className="grid grid-cols-2 gap-2">
                       <Input placeholder="ASSIGNED IP" value={newCandidate.assignedIp} onChange={e => setNewCandidate({...newCandidate, assignedIp: e.target.value})} className="h-10 text-[9px]" />
                       <Input placeholder="SEAT NO" value={newCandidate.assignedSeatNumber} onChange={e => setNewCandidate({...newCandidate, assignedSeatNumber: e.target.value})} className="h-10 text-[9px]" />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                      <p className="text-[9px] font-black opacity-30">SUBJECTS (MAX 4)</p>
                      {["English", "Math", "Physics", "Chemistry", "Biology"].map(s => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={newCandidate.subjects.includes(s)} onChange={e => {
                            const subs = e.target.checked ? [...newCandidate.subjects, s] : newCandidate.subjects.filter(x => x !== s);
                            if (subs.length <= 4) setNewCandidate({...newCandidate, subjects: subs});
                          }} />
                          <span className="text-[10px] font-black">{s.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                    <Button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-xl">REGISTER</Button>
                  </form>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates.map(c => (
                    <Card key={c.examNumber} className="p-6 rounded-2xl border-2 bg-white flex justify-between items-center shadow-sm">
                      <div>
                        <h4 className="font-black text-xs">{c.fullName}</h4>
                        <p className="text-[10px] font-bold text-primary/30">{c.examNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => navigate(`/exam-slip/${c.examNumber}`)} className="text-primary/40 hover:text-primary"><Printer className="w-4 h-4" /></Button>
                        <Button variant="ghost" onClick={async () => {
                          if(confirm("Delete candidate?")) {
                            await fetch(getApiUrl(`/candidates/${c.examNumber}`), { method: 'DELETE', headers: getHeaders() });
                            fetchCandidates();
                          }
                        }} className="text-red-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'center' && (
            <div className="space-y-8">
               <h2 className="text-2xl font-black">EXAM ROOM ARCHITECTURE</h2>
               <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-4 bg-slate-100 p-8 rounded-[40px] border-4 border-white shadow-inner">
                  {seats.map(s => {
                     const activeAttempt = attempts.find(a => a.status === 'in-progress' && a.userId === s.assignedCandidateId);
                     const isFlagged = activeAttempt && (activeAttempt.trustScore || 100) < 70;
                     return (
                        <Card key={s.id} className={cn("aspect-square rounded-2xl border-2 flex flex-col items-center justify-center relative", s.status === 'occupied' ? (isFlagged ? "border-red-500 bg-red-50" : "border-emerald-500 bg-emerald-50") : "border-white bg-white/50")}>
                           <p className="text-[8px] font-black opacity-30 absolute top-2">#{s.seatNumber}</p>
                           {s.status === 'occupied' ? <User className={cn("w-6 h-6", isFlagged ? "text-red-500 animate-pulse" : "text-emerald-500")} /> : <PlusCircle className="w-4 h-4 text-slate-200" />}
                        </Card>
                     );
                  })}
               </div>
            </div>
          )}

          {activeTab === 'monitor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attempts.filter(a => a.status === 'in-progress').map(s => (
                <Card key={s.id} className="p-6 rounded-[24px] border-2 bg-white flex flex-col gap-4 overflow-hidden relative">
                  <div className={cn("absolute top-0 right-0 left-0 h-1", (s.trustScore || 100) < 70 ? "bg-red-500" : "bg-emerald-500")} />
                  <div className="flex justify-between items-start">
                    <div><h4 className="font-black text-xs">{s.userId}</h4><p className="text-[10px] font-bold opacity-30">EXAM: {s.examId}</p></div>
                    <div className="text-right">
                       <p className="text-[8px] font-black opacity-30">TRUST</p>
                       <p className={cn("font-black text-lg", (s.trustScore || 100) < 70 ? "text-red-500" : "text-emerald-500")}>{Math.round(s.trustScore || 100)}%</p>
                    </div>
                  </div>
                  <Button onClick={() => setViewingSnaps(s.id)} className="w-full h-9 rounded-xl border border-primary/10 text-primary text-[8px] font-bold uppercase flex items-center justify-center gap-1.5"><Camera className="w-3 h-3" /> View Snaps</Button>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'staff' && isSuperAdmin && (
             <div className="grid md:grid-cols-2 gap-8">
                {staff.map(s => (
                   <Card key={s.id} className="p-6 rounded-2xl border-2 bg-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center font-black text-primary/20">{s.displayName.charAt(0)}</div>
                         <div><h4 className="font-black text-xs">{s.displayName}</h4><p className="text-[10px] font-bold text-primary/30 uppercase">{s.role.replace('_', ' ')}</p></div>
                      </div>
                      {s.role !== 'super_admin' && (
                        <Button variant="ghost" onClick={async () => {
                           if(confirm("Revoke staff access?")) {
                              await fetch(getApiUrl(`/auth/staff/${s.id}`), { method: 'DELETE', headers: getHeaders() });
                              fetchStaff();
                           }
                        }} className="text-red-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      )}
                   </Card>
                ))}
             </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
               <h2 className="text-2xl font-black">SYSTEM AUDIT TRAIL</h2>
               <div className="bg-white rounded-[32px] border-2 overflow-hidden">
                  <table className="w-full">
                     <thead className="bg-slate-50 border-b-2">
                        <tr className="text-left text-[10px] font-black tracking-widest opacity-40">
                           <th className="p-6">TIMESTAMP</th><th className="p-6">TYPE</th><th className="p-6">EVENT</th><th className="p-6">USER</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {logs.map(log => (
                           <tr key={log.id} className="text-[10px] font-bold">
                              <td className="p-6 opacity-40">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="p-6"><Badge className={cn("text-[8px] font-black border-none", log.type === 'security' ? "bg-red-100 text-red-500" : "bg-sky-100 text-sky-500")}>{log.type.toUpperCase()}</Badge></td>
                              <td className="p-6">{log.message}</td>
                              <td className="p-6 opacity-40">{log.userId || 'SYSTEM'}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-8">
                <h2 className="text-2xl font-black">PROCTORING INTELLIGENCE</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {attempts.filter(a => (a.violationLogs?.length || 0) > 0 || a.isIdentityVerified === false).map(a => (
                      <Card key={a.id} className="p-8 rounded-[40px] border-2 border-red-100 bg-white shadow-xl relative">
                         <div className="absolute top-0 right-0 p-6"><Badge className="bg-red-500 text-white border-none">{Math.round(a.trustScore || 0)}% TRUST</Badge></div>
                         <h3 className="text-lg font-black mb-1">{a.userId}</h3>
                         <div className="space-y-4 mt-6">
                            {a.isIdentityVerified === false && <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 font-black text-[10px]">IDENTITY MISMATCH</div>}
                            {a.violationLogs?.map((v: any, i: number) => (
                               <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-primary/5">
                                  <p className="text-[9px] font-black uppercase text-primary">AI FLAG</p>
                                  <p className="text-[10px] font-bold">{v.reason}</p>
                               </div>
                            ))}
                         </div>
                         <Button onClick={() => setViewingSnaps(a.id)} className="w-full mt-8 h-12 border-2 border-primary/10 text-primary font-black text-[10px] rounded-xl uppercase">Review Evidence</Button>
                      </Card>
                   ))}
                </div>
             </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {viewingSnaps && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden">
              <div className="p-6 bg-primary text-white flex justify-between items-center">
                <h3 className="text-sm font-black tracking-widest uppercase">Evidence Review</h3>
                <Button variant="ghost" onClick={() => setViewingSnaps(null)} className="text-white h-8 w-8"><XCircle className="w-5 h-5" /></Button>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black opacity-30 uppercase tracking-widest">Security Overview</h4>
                      <div className={cn("p-4 rounded-2xl border-2 flex items-center gap-3", (attempts.find(s => s.id === viewingSnaps) as any)?.isIdentityVerified ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100")}>
                         <Shield className={cn("w-5 h-5", (attempts.find(s => s.id === viewingSnaps) as any)?.isIdentityVerified ? "text-emerald-500" : "text-rose-500")} />
                         <div>
                            <p className="text-[9px] font-black uppercase">Identity Verification</p>
                            <p className="text-[11px] font-black">{(attempts.find(s => s.id === viewingSnaps) as any)?.isIdentityVerified ? "AUTHENTICATED" : "NOT VERIFIED"}</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black opacity-30 uppercase tracking-widest">Incident Log</h4>
                      <ScrollArea className="h-[140px] pr-4">
                         <div className="space-y-2">
                            {(attempts.find(s => s.id === viewingSnaps) as any)?.violationLogs?.map((v: any, i: number) => (
                               <div key={i} className="p-3 bg-red-50 rounded-xl border border-red-100">
                                  <p className="text-[8px] font-black text-red-500 uppercase">{new Date(v.timestamp).toLocaleTimeString()}</p>
                                  <p className="text-[9px] font-bold">{v.reason}</p>
                               </div>
                            )) || <p className="text-[10px] font-bold opacity-20 italic">No violations recorded.</p>}
                         </div>
                      </ScrollArea>
                   </div>
                </div>
                <h4 className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-4">Proctoring Snapshots</h4>
                <div className="grid grid-cols-5 gap-3">
                  {(attempts.find(s => s.id === viewingSnaps) as any)?.proctoringSnaps?.map((snap: string, i: number) => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden border-2 border-primary/5 hover:border-primary/40 transition-all relative group">
                      <img src={snap} className="w-full h-full object-cover grayscale contrast-125" />
                      <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Button variant="ghost" size="icon" className="text-white" onClick={() => window.open(snap)}><Eye className="w-4 h-4" /></Button></div>
                    </div>
                  )) || <div className="col-span-5 py-20 text-center opacity-20"><CameraOff className="w-12 h-12 mx-auto mb-2" /><p className="text-[10px] font-black uppercase">No Snaps Captured</p></div>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
