import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exam, Question, Attempt, Candidate, UserProfile } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card } from '@/lib/ui/card';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { 
  Trash2, BookOpen, PlusCircle, Users, Search, BarChart2, Shield, LogOut, Camera, Printer, Upload, Database, CameraOff, User, Eye, CircleX, Monitor, MessageCircle, Mail, Lock, Calendar, CheckCircle, BadgeCheck, LayoutDashboard, Settings, Activity, ShieldAlert, Cpu, ChevronRight, Menu, X, HelpCircle, ArrowLeft, Plus, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { cn } from '@/src/lib/utils/utils';
import { getApiUrl } from '@/src/lib/api-config';
import { NIGERIAN_STATES } from '@/src/lib/constants/nigeria-data';

export default function Admin() {
  const { profile, logOut } = useAuth();
  const { socket } = useSocket();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [offeredSubjects, setOfferedSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [viewingSnaps, setViewingSnaps] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Form States
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const [newExam, setNewExam] = useState({ title: '', subject: '', durationMinutes: 30 });
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, topic: 'General' });
  const [newCandidate, setNewCandidate] = useState({ fullName: '', email: '', password: '', examNumber: '', subjects: [] as string[] });
  const [newStaff, setNewStaff] = useState({ displayName: '', email: '', password: '', role: 'admin' as 'admin' | 'reg_admin' });
  const [newOfferedSubject, setNewOfferedSubject] = useState('');
  const [releasingResults, setReleasingResults] = useState(false);

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/analytics/summary'), { headers: getHeaders() });
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/exams'), { headers: getHeaders() });
      if (res.ok) setExams(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/candidates'), { headers: getHeaders() });
      if (res.ok) setCandidates(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/auth/staff'), { headers: getHeaders() });
      if (res.ok) setStaff(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/exams/attempts/all'), { headers: getHeaders() });
      if (res.ok) setAttempts(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  const fetchSeats = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/center/seats'), { headers: getHeaders() });
      if (res.ok) setSeats(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/analytics/logs'), { headers: getHeaders() });
      if (res.ok) setLogs(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  const fetchOfferedSubjects = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/subjects'), { headers: getHeaders() });
      if (res.ok) setOfferedSubjects(await res.json());
    } catch (e) {}
  }, [getHeaders]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-admin');
    socket.on('progress-updated', () => fetchAttempts());
    socket.on('security-alert', (data: any) => {
      toast.error(`Security Alert: ${data.userId} trust score dropped - ${data.reason}`);
      fetchAttempts();
    });
    socket.on('new-message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      toast.info(`New message from ${msg.fromName}`);
    });
    return () => {
      socket.off('progress-updated');
      socket.off('security-alert');
      socket.off('new-message');
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
      fetchLogs(),
      fetchOfferedSubjects()
    ]).then(() => {
       if (profile.role === 'super_admin') fetchStaff();
       setLoading(false);
    });
  }, [profile, fetchExams, fetchCandidates, fetchAttempts, fetchStaff, fetchAnalytics, fetchSeats, fetchLogs, fetchOfferedSubjects]);

  const fetchQuestions = useCallback(async (examId: string) => {
    const res = await fetch(getApiUrl(`/exams/${examId}`), { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions || []);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (selectedExamId) fetchQuestions(selectedExamId);
  }, [selectedExamId, fetchQuestions]);

  const handleGenerateSeats = async () => {
    if (!confirm("Initialize 50 standard examination seats?")) return;
    setLoading(true);
    try {
      for (let i = 1; i <= 50; i++) {
        await fetch(getApiUrl('/center/seats'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ seatNumber: i, status: 'available' })
        });
      }
      toast.success("Hall initialized with 50 seats");
      fetchSeats();
    } catch (e) {
      toast.error("Initialization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/exams'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...newExam, createdBy: profile?.displayName })
      });
      if (res.ok) {
        toast.success("Exam module created");
        setShowAddExam(false);
        fetchExams();
      }
    } catch (e) { toast.error("Failed to create exam"); }
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
      toast.success("Question added");
      setShowAddQuestion(false);
      fetchQuestions(selectedExamId);
      fetchExams();
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
        subjectCombination: newCandidate.subjects,
        registrationDate: new Date().toISOString()
      })
    });
    if (res.ok) {
      toast.success("Candidate enrolled");
      setShowAddCandidate(false);
      fetchCandidates();
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/auth/register'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newStaff)
    });
    if (res.ok) {
      toast.success("Staff registered");
      setShowAddStaff(false);
      fetchStaff();
    } else {
      const data = await res.json();
      toast.error(data.message || "Failed to register");
    }
  };

  const handleCreateOfferedSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferedSubject.trim()) return;
    try {
      const res = await fetch(getApiUrl('/subjects'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newOfferedSubject.trim() })
      });
      if (res.ok) {
        toast.success("Subject added");
        setNewOfferedSubject('');
        setShowAddSubject(false);
        fetchOfferedSubjects();
      }
    } catch (e) { toast.error("Error adding subject"); }
  };

  const toggleSubjectStatus = async (id: string) => {
    await fetch(getApiUrl(`/subjects/${id}`), { method: 'PUT', headers: getHeaders() });
    fetchOfferedSubjects();
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Remove staff access?")) return;
    await fetch(getApiUrl(`/auth/staff/${id}`), { method: 'DELETE', headers: getHeaders() });
    fetchStaff();
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !socket) return;
    const msg = {
      from: 'admin',
      to: activeChatId,
      fromName: profile?.displayName || 'Admin',
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    socket.emit('admin-message', msg);
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleExamStatus = async (exam: Exam) => {
    await fetch(getApiUrl(`/exams/${exam.id}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isActive: !exam.isActive })
    });
    fetchExams();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'enrollment', label: 'Candidates & Hall', icon: Users, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'academic', label: 'Academic Setup', icon: BookOpen, roles: ['super_admin', 'admin'] },
    { id: 'exams', label: 'Exams & Results', icon: Activity, roles: ['super_admin', 'admin'] },
    { id: 'proctor', label: 'Live Proctoring', icon: Monitor, roles: ['super_admin', 'admin'] },
    { id: 'system', label: 'System Admin', icon: Shield, roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(m => m.roles.includes(profile?.role || ''));

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase">Initializing...</div>;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 bg-white border-r border-primary/5 transition-all duration-300 z-[100] flex flex-col", isSidebarOpen ? "w-64" : "w-20")}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg">V</div>
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter text-primary">Admin Portal</span>}
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-4">
            {filteredMenuItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedExamId(null); }} className={cn("w-full flex items-center gap-3 px-3 h-11 rounded-xl transition-all group", activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-primary/5 hover:text-primary")}>
                <item.icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-wider truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-primary/5">
          <button onClick={() => { logOut?.(); navigate('/'); }} className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-black uppercase text-[10px]">
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-300", isSidebarOpen ? "ml-64" : "ml-20")}>
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-primary/5 px-8 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-primary/40 hover:text-primary bg-primary/5 rounded-lg"><Menu className="w-4 h-4" /></button>
            <h2 className="text-xs font-black uppercase tracking-widest text-primary/40">{menuItems.find(m => m.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-3 text-right">
             <div className="hidden sm:block"><p className="font-black text-[12px] leading-none mb-1">{profile?.displayName}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{profile?.role}</p></div>
             <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary/20 text-sm">{profile?.displayName?.charAt(0)}</div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab + (selectedExamId || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

              {/* DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Candidates', value: candidates.length, icon: Users, color: 'text-purple-500' },
                        { label: 'Active Exams', value: exams.filter(e => e.isActive).length, icon: Activity, color: 'text-blue-500' },
                        { label: 'Avg Performance', value: analytics?.averageScore || '0', icon: BarChart2, color: 'text-emerald-500' },
                        { label: 'Security High', value: attempts.filter(a => (a.trustScore || 100) > 80).length, icon: Shield, color: 'text-amber-500' }
                      ].map((stat, i) => (
                        <Card key={i} className="p-8 rounded-[32px] border-none shadow-xl bg-white group">
                          <div className={cn("w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6", stat.color)}><stat.icon className="w-6 h-6" /></div>
                          <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{stat.label}</p>
                          <h4 className="text-4xl font-black tracking-tighter">{stat.value}</h4>
                        </Card>
                      ))}
                   </div>
                   <div className="grid md:grid-cols-2 gap-8">
                      <Card className="p-10 rounded-[48px] bg-slate-900 text-white shadow-2xl flex flex-col justify-center items-center text-center">
                         <ShieldCheck className="w-16 h-16 text-primary/40 mb-6" />
                         <h4 className="text-xl font-black uppercase mb-2">Integrity Shield: Active</h4>
                         <p className="text-[11px] font-medium text-white/40 leading-relaxed uppercase tracking-wider">Metrics are aggregating across {attempts.length} active academic transcripts.</p>
                      </Card>
                      <Card className="p-10 rounded-[48px] bg-white shadow-2xl space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</h4>
                        <div className="space-y-4">
                           <div className="flex justify-between"><span>Database Connection</span><Badge className="bg-emerald-100 text-emerald-600">Stable</Badge></div>
                           <div className="flex justify-between"><span>Real-time Socket</span><Badge className="bg-emerald-100 text-emerald-600">Online</Badge></div>
                           <div className="flex justify-between"><span>AI Proctor Hub</span><Badge className="bg-blue-100 text-blue-600">Ready</Badge></div>
                        </div>
                      </Card>
                   </div>
                </div>
              )}

              {/* ENROLLMENT (Candidates & Hall) */}
              {activeTab === 'enrollment' && (
                <div className="space-y-12">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black">Candidate Registry & Center Hub</h3>
                      <Button onClick={() => setShowAddCandidate(true)} className="bg-primary text-white font-black text-[10px] uppercase">Register Student</Button>
                   </div>

                   <Card className="p-10 rounded-[48px] bg-white shadow-xl">
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <h4 className="font-black text-sm uppercase">Center Hall Management</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Real-time Seat Visualization</p>
                        </div>
                        {seats.length === 0 && <Button onClick={handleGenerateSeats} variant="outline" className="text-primary border-primary/20">Initialize 50 Seats</Button>}
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                        {seats.length === 0 ? (
                          <div className="col-span-full py-20 text-center opacity-10 font-black uppercase border-2 border-dashed border-primary/5 rounded-[32px]">Center Hall Not Initialized</div>
                        ) : seats.map(s => (
                          <div key={s.id} className={cn("aspect-square rounded-xl flex items-center justify-center font-black text-[9px] border-2", s.status === 'occupied' ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md animate-pulse" : "bg-slate-50 border-slate-100 text-slate-300")}>{s.seatNumber}</div>
                        ))}
                      </div>
                   </Card>

                   <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50/50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Student</th><th className="p-8">Exam Number</th><th className="p-8">Email</th><th className="p-8 text-right">Actions</th></tr></thead>
                         <tbody className="divide-y divide-primary/5">
                            {candidates.map(c => (
                               <tr key={c.examNumber} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="p-8 font-black uppercase">{c.fullName}</td>
                                  <td className="p-8 font-bold text-primary">{c.examNumber}</td>
                                  <td className="p-8 font-bold text-slate-500">{c.email}</td>
                                  <td className="p-8 text-right"><Button variant="ghost" size="icon" onClick={() => navigate(`/exam-slip/${c.examNumber}`)} className="text-slate-400 hover:text-primary"><Printer className="w-4 h-4" /></Button></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {/* ACADEMIC (Curriculum & Exams) */}
              {activeTab === 'academic' && (
                <div className="space-y-12">
                   <div className="grid md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center"><h3 className="text-xl font-black">Curriculum</h3><Button onClick={() => setShowAddSubject(true)} size="sm">Add Subject</Button></div>
                        <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-xl">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase"><th className="p-6">Name</th><th className="p-6 text-center">Status</th><th className="p-6 text-right">Op</th></tr></thead>
                            <tbody className="divide-y divide-primary/5">
                              {offeredSubjects.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="p-6 font-black uppercase text-xs">{s.name}</td>
                                  <td className="p-6 text-center"><Badge className={s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}>{s.isActive ? "Active" : "Off"}</Badge></td>
                                  <td className="p-6 text-right"><button onClick={() => toggleSubjectStatus(s.id)} className="text-slate-300 hover:text-primary"><CheckCircle className="w-4 h-4" /></button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center"><h3 className="text-xl font-black">Modules</h3><Button onClick={() => setShowAddExam(true)} size="sm">New Module</Button></div>
                        <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-xl">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase"><th className="p-6">Title</th><th className="p-6 text-center">Items</th><th className="p-6 text-right">Actions</th></tr></thead>
                            <tbody className="divide-y divide-primary/5">
                              {exams.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="p-6 font-black uppercase text-xs">{e.title}</td>
                                  <td className="p-6 text-center font-bold text-xs">{e.totalQuestions || 0}</td>
                                  <td className="p-6 text-right"><Button variant="outline" size="sm" onClick={() => { setActiveTab('exams'); setSelectedExamId(e.id); }} className="text-[8px] h-7 px-3 uppercase font-black">Set Questions</Button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* EXAMS & RESULTS */}
              {activeTab === 'exams' && !selectedExamId && (
                <div className="space-y-8">
                   <h3 className="text-xl font-black">Academic Transcripts & Assessments</h3>
                   <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50/50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Candidate</th><th className="p-8 text-center">Performance</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Actions</th></tr></thead>
                         <tbody className="divide-y divide-primary/5">
                            {attempts.filter(a => a.status === 'completed').map(a => (
                               <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="p-8"><div><p className="font-black text-xs uppercase">{candidates.find(c => c.examNumber === a.userId)?.fullName || a.userId}</p><p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{a.examId}</p></div></td>
                                  <td className="p-8 text-center font-black text-lg">{a.score} / {a.totalPossible}</td>
                                  <td className="p-8 text-center"><Badge className={a.isReleased ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}>{a.isReleased ? "Authenticated" : "Queued"}</Badge></td>
                                  <td className="p-8 text-right"><Button variant="ghost" size="icon" onClick={() => navigate(`/result-slip/${a.userId}`)} className="text-slate-400 hover:text-primary"><Eye className="w-4 h-4" /></Button></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {activeTab === 'exams' && selectedExamId && (
                <div className="space-y-8">
                   <div className="flex items-center gap-4">
                      <Button variant="ghost" onClick={() => setSelectedExamId(null)} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
                      <h3 className="text-xl font-black">Question Registry: {exams.find(e => e.id === selectedExamId)?.title}</h3>
                      <Button onClick={() => setShowAddQuestion(true)} className="ml-auto bg-slate-900 text-white font-black text-[10px] uppercase">Set New Item</Button>
                   </div>
                   <div className="space-y-4">
                      {questions.map((q, i) => (
                         <Card key={q.id} className="p-8 rounded-[32px] bg-white shadow-xl relative overflow-hidden group">
                            <Badge className="absolute top-8 right-8 bg-slate-100 text-slate-400 border-none">Item #{i+1}</Badge>
                            <div className="space-y-6">
                               <p className="font-bold text-lg leading-relaxed">{q.text}</p>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options.map((opt, idx) => (
                                     <div key={idx} className={cn("p-4 rounded-2xl border font-bold text-sm", idx === q.correctOptionIndex ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-transparent text-slate-500")}>
                                        {String.fromCharCode(65+idx)}. {opt}
                                     </div>
                                  ))}
                               </div>
                               <Button variant="ghost" onClick={async () => { await fetch(getApiUrl(`/exams/${selectedExamId}/questions/${q.id}`), { method: 'DELETE', headers: getHeaders() }); fetchQuestions(selectedExamId); }} className="text-rose-300 hover:text-rose-500 p-0 font-black text-[10px] uppercase">Delete Item</Button>
                            </div>
                         </Card>
                      ))}
                   </div>
                </div>
              )}

              {/* PROCTORING (Monitor, Security, Chat) */}
              {activeTab === 'proctor' && (
                <div className="space-y-8">
                   <div className="flex justify-between items-center"><h3 className="text-xl font-black">Surveillance & Integrity Hub</h3><Badge className="bg-emerald-500 text-white animate-pulse">{attempts.filter(a => a.status === 'in-progress').length} Active Terminals</Badge></div>

                   <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {attempts.filter(a => a.status === 'in-progress').map(s => (
                             <Card key={s.id} className="p-6 rounded-[32px] bg-white shadow-xl group border-t-4 border-emerald-500 overflow-hidden relative">
                                <div className="flex justify-between items-start mb-6">
                                   <div><h4 className="font-black text-sm uppercase">{candidates.find(c => c.examNumber === s.userId)?.fullName || s.userId}</h4><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal #{s.id.substring(0,4)}</p></div>
                                   <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase">Integrity</p><p className={cn("font-black text-xl tracking-tighter", (s.trustScore || 100) < 70 ? "text-rose-500" : "text-emerald-500")}>{Math.round(s.trustScore || 100)}%</p></div>
                                </div>
                                <div className="flex gap-2">
                                   <Button onClick={() => setViewingSnaps(s.id)} size="sm" className="flex-1 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-primary transition-all"><Camera className="w-4 h-4 mr-2" /> Live Snaps</Button>
                                   <Button onClick={() => setActiveChatId(s.userId)} size="icon" className="bg-primary/5 text-primary hover:bg-primary hover:text-white"><MessageCircle className="w-4 h-4" /></Button>
                                </div>
                             </Card>
                           ))}
                           {attempts.filter(a => a.status === 'in-progress').length === 0 && <div className="col-span-full py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-primary/5 opacity-20 font-black uppercase">No Active Terminal Sessions</div>}
                        </div>

                        {/* Security Incident Log */}
                        <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                           <thead className="bg-slate-50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase p-4"><th className="p-6 text-left">Incident Log</th></tr></thead>
                           <div className="divide-y divide-primary/5">
                              {attempts.filter(a => (a.violationLogs?.length || 0) > 0).slice(0, 10).map(a => (
                                <div key={a.id} className="p-6 flex justify-between items-center">
                                   <p className="font-bold text-xs uppercase">{candidates.find(c => c.examNumber === a.userId)?.fullName || a.userId} - {a.violationLogs?.[a.violationLogs.length-1].reason}</p>
                                   <Badge className="bg-rose-50 text-rose-500">{new Date(a.violationLogs?.[a.violationLogs.length-1].timestamp || "").toLocaleTimeString()}</Badge>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>

                      {/* Integrated Chat Panel */}
                      <Card className="h-[75vh] flex flex-col rounded-[48px] shadow-2xl overflow-hidden border border-primary/5">
                        <div className="p-8 border-b border-primary/5 bg-slate-50/50">
                           <h4 className="font-black text-xs uppercase tracking-widest text-primary flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Proctor Chat</h4>
                        </div>
                        {activeChatId ? (
                           <>
                              <ScrollArea className="flex-1 p-8">
                                 <div className="space-y-6">
                                    {messages.filter(m => m.from === activeChatId || (m.from === 'admin' && m.to === activeChatId)).map((m, i) => (
                                       <div key={i} className={cn("flex flex-col", m.from === 'admin' ? "items-end" : "items-start")}>
                                          <div className={cn("max-w-[90%] p-4 rounded-2xl font-bold text-sm shadow-sm", m.from === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none")}>{m.message}</div>
                                          <span className="text-[8px] font-black opacity-20 mt-2">{new Date(m.timestamp).toLocaleTimeString()}</span>
                                       </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                 </div>
                              </ScrollArea>
                              <form onSubmit={sendChatMessage} className="p-6 border-t border-primary/5 bg-white flex gap-3">
                                 <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type message..." className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                                 <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-primary text-white"><Send className="w-4 h-4" /></Button>
                              </form>
                           </>
                        ) : (
                           <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-center p-10"><MessageCircle className="w-16 h-16 mb-4" /><p className="font-black text-xs uppercase">Select candidate to start chat</p></div>
                        )}
                      </Card>
                   </div>
                </div>
              )}

              {/* SYSTEM (Staff & Logs) */}
              {activeTab === 'system' && (
                <div className="space-y-12">
                   <div className="flex justify-between items-center"><h3 className="text-xl font-black">System Administration</h3><Button onClick={() => setShowAddStaff(true)}>Add Staff</Button></div>
                   <div className="grid lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-xl">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase"><th className="p-8">Staff Member</th><th className="p-8 text-center">Role</th><th className="p-8 text-right">Actions</th></tr></thead>
                          <tbody className="divide-y divide-primary/5">
                            {staff.map(s => (
                              <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="p-8 font-black uppercase text-xs">{s.displayName}</td>
                                <td className="p-8 text-center"><Badge className="bg-slate-100 text-slate-400 uppercase text-[8px]">{s.role}</Badge></td>
                                <td className="p-8 text-right">{s.role !== 'super_admin' && <Button variant="ghost" onClick={() => handleDeleteStaff(s.id)} className="text-rose-400"><Trash2 className="w-4 h-4" /></Button>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-xl h-[500px] flex flex-col">
                        <div className="p-8 border-b border-primary/5 bg-slate-50/50"><h4 className="font-black text-xs uppercase tracking-widest opacity-30">Audit Trail</h4></div>
                        <ScrollArea className="flex-1">
                          <div className="p-4 space-y-4">
                            {logs.map(l => (
                              <div key={l.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-start">
                                 <div><p className="font-bold text-[10px] uppercase text-primary mb-1">{l.message}</p><p className="text-[8px] font-black opacity-20 uppercase">{new Date(l.timestamp).toLocaleString()}</p></div>
                                 <Badge className="text-[8px] font-black uppercase" variant="outline">{l.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                   </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showAddExam && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><h3 className="text-xl font-black uppercase">Initialize Module</h3><Button variant="ghost" onClick={() => setShowAddExam(false)} className="rounded-xl"><X className="w-6 h-6" /></Button></div><form onSubmit={handleCreateExam} className="p-10 space-y-8"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Subject Category</Label><select value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none uppercase">{offeredSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Title</Label><Input placeholder="Assessment Title" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold" /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Duration (Min)</Label><Input type="number" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold" /></div><Button type="submit" className="h-14 bg-primary text-white font-black uppercase mt-auto rounded-2xl">Confirm Initiation</Button></div></form></motion.div></div>
        )}

        {showAddQuestion && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><h3 className="text-xl font-black uppercase">Item Entry</h3><Button variant="ghost" onClick={() => setShowAddQuestion(false)} className="rounded-xl"><X className="w-6 h-6" /></Button></div><form onSubmit={handleAddQuestion} className="p-10 space-y-6"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Question Context</Label><textarea value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} required className="w-full h-32 px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner resize-none outline-none focus:ring-2 focus:ring-primary/10" /></div><div className="grid grid-cols-2 gap-4">{[0,1,2,3].map(i => (<div key={i} className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Option {String.fromCharCode(65+i)}</Label><Input value={newQuestion.options[i]} onChange={e => { const opts = [...newQuestion.options]; opts[i] = e.target.value; setNewQuestion({...newQuestion, options: opts}); }} required className="h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs" /></div>))}</div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Correct Answer</Label><select value={newQuestion.correctOptionIndex} onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value)})} className="w-full h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none"><option value={0}>Option A</option><option value={1}>Option B</option><option value={2}>Option C</option><option value={3}>Option D</option></select></div><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Topic</Label><Input value={newQuestion.topic} onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})} className="h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs" /></div></div><Button type="submit" className="w-full h-16 bg-slate-900 text-white font-black rounded-2xl uppercase mt-4">Commit to Database</Button></form></motion.div></div>
        )}

        {showAddSubject && (
           <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><h3 className="text-xl font-black uppercase">Add Subject</h3><Button variant="ghost" onClick={() => setShowAddSubject(false)} className="rounded-xl"><X className="w-5 h-5" /></Button></div><form onSubmit={handleCreateOfferedSubject} className="p-10 space-y-8"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Name</Label><Input placeholder="e.g. Mathematics" value={newOfferedSubject} onChange={e => setNewOfferedSubject(e.target.value)} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold" /></div><Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl uppercase">Confirm Entry</Button></form></motion.div></div>
        )}

        {showAddCandidate && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><div className="space-y-1"><h3 className="text-xl font-black text-primary uppercase">Enroll Student</h3></div><Button variant="ghost" onClick={() => setShowAddCandidate(false)} className="h-12 w-12 rounded-2xl text-primary/20 hover:text-primary"><X className="w-6 h-6" /></Button></div><ScrollArea className="max-h-[70vh]"><form onSubmit={handleCreateCandidate} className="p-10 space-y-8"><div className="grid grid-cols-2 gap-6"><div className="col-span-2 space-y-2"><Label className="text-[9px] font-black opacity-40 ml-2 uppercase">Full Legal Name</Label><Input value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})} placeholder="Surname Firstname" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="space-y-2"><Label className="text-[9px] font-black opacity-40 ml-2 uppercase">Auth Email</Label><Input type="email" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} placeholder="email@vivi.com" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="space-y-2"><Label className="text-[9px] font-black opacity-40 ml-2 uppercase">Auth Credentials</Label><Input type="password" value={newCandidate.password} onChange={e => setNewCandidate({...newCandidate, password: e.target.value})} placeholder="Password" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div></div><Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl tracking-widest uppercase mt-4">Confirm Enrollment</Button></form></ScrollArea></motion.div></div>
        )}

        {showAddStaff && (
           <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><h3 className="text-xl font-black uppercase">Provision Staff</h3><Button variant="ghost" onClick={() => setShowAddStaff(false)} className="rounded-xl"><X className="w-6 h-6" /></Button></div><form onSubmit={handleCreateStaff} className="p-10 space-y-8"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Full Name</Label><Input value={newStaff.displayName} onChange={e => setNewStaff({...newStaff, displayName: e.target.value})} placeholder="Display Name" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Auth Email</Label><Input type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="staff@vivi.com" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold" /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Role</Label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none"><option value="admin">Administrator</option><option value="reg_admin">Registry Officer</option></select></div><Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl uppercase mt-auto">Finalize Auth</Button></div></form></motion.div></div>
        )}

        {/* Evidence Viewer */}
        {viewingSnaps && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden"><div className="p-8 bg-primary text-white flex justify-between items-center"><div><h3 className="text-sm font-black tracking-widest uppercase">Security Review</h3><p className="text-[9px] font-bold text-white/40 uppercase">{viewingSnaps}</p></div><Button variant="ghost" onClick={() => setViewingSnaps(null)} className="text-white/20 h-10 w-10"><CircleX className="w-5 h-5" /></Button></div><div className="p-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10"><div className="space-y-6"><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Biometric Evidence</h4><div className="grid grid-cols-4 gap-4">{(attempts.find(s => s.id === viewingSnaps) as any)?.proctoringSnaps?.map((snap: string, i: number) => (<div key={i} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border-2 border-primary/5 relative group"><img src={snap} className="w-full h-full object-cover grayscale contrast-125" /><div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="ghost" size="icon" className="text-white" onClick={() => window.open(snap)}><Eye className="w-4 h-4" /></Button></div></div>)) || <div className="col-span-4 py-20 text-center opacity-10 font-black uppercase text-xs border-2 border-dashed border-primary/5 rounded-[40px]">No visual data</div>}</div></div><div className="space-y-6"><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Incident History</h4><ScrollArea className="h-[300px] pr-4 bg-slate-50 p-6 rounded-[32px] border border-primary/5"><div className="space-y-4">{(attempts.find(s => s.id === viewingSnaps) as any)?.violationLogs?.map((v: any, i: number) => (<div key={i} className="p-5 bg-white rounded-2xl border border-primary/5 shadow-sm relative overflow-hidden group"><div className={cn("absolute left-0 top-0 w-1 h-full", v.severity === 'critical' ? "bg-rose-500" : "bg-amber-500")} /><p className="text-[9px] font-black opacity-30">{new Date(v.timestamp).toLocaleTimeString()}</p><p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase">{v.reason}</p></div>)) || <p className="text-[11px] font-black opacity-10 italic text-center py-20 uppercase tracking-widest">Record Integrity High</p>}</div></ScrollArea></div></div></motion.div></div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
