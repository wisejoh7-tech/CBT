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

  const [activeTab, setActiveTab] = useState<string>('overview');
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

  const [newExam, setNewExam] = useState({ title: '', subject: '', durationMinutes: 30, startTime: '', endTime: '' });
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, topic: 'General' });
  const [newCandidate, setNewCandidate] = useState({ fullName: '', email: '', password: '', examNumber: '', pin: '', subjects: [] as string[], assignedIp: '', assignedSeatNumber: '', faceUrl: '', waecResultUrl: '' });
  const [newStaff, setNewStaff] = useState({ displayName: '', email: '', password: '', role: 'admin' as 'admin' | 'reg_admin' });
  const [newOfferedSubject, setNewOfferedSubject] = useState('');
  const [releasingResults, setReleasingResults] = useState(false);

  const [bulkSchedule, setBulkSchedule] = useState({ examVenue: '', examDate: '', examTime: '', examNumbers: [] as string[] });

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
      toast.info(`New support request from ${msg.fromName}`);
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

  const toggleExamStatus = async (exam: Exam) => {
    try {
      const res = await fetch(getApiUrl(`/exams/${exam.id}`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !exam.isActive })
      });
      if (res.ok) {
        toast.success(`Exam ${exam.isActive ? 'Deactivated' : 'Activated'}`);
        fetchExams();
      }
    } catch (e) {
      toast.error("Status update failed");
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

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
    { id: 'candidates', label: 'Candidates', icon: Users, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'subjects', label: 'Curriculum', icon: BookOpen, roles: ['super_admin', 'admin'] },
    { id: 'exams', label: 'Exam Modules', icon: Activity, roles: ['super_admin', 'admin'] },
    { id: 'results', label: 'Results', icon: BadgeCheck, roles: ['super_admin', 'admin'] },
    { id: 'monitor', label: 'Live Monitor', icon: Monitor, roles: ['super_admin', 'admin'] },
    { id: 'analytics', label: 'Intelligence', icon: BarChart2, roles: ['super_admin', 'admin'] },
    { id: 'center', label: 'Center Hub', icon: Cpu, roles: ['super_admin', 'admin'] },
    { id: 'chat', label: 'Support & Chat', icon: MessageCircle, roles: ['super_admin', 'admin'] },
    { id: 'staff', label: 'Staff Management', icon: Shield, roles: ['super_admin'] },
    { id: 'security', label: 'Security Center', icon: ShieldAlert, roles: ['super_admin'] },
    { id: 'audit', label: 'Audit Trail', icon: Database, roles: ['super_admin'] },
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
            <h2 className="text-xs font-black uppercase tracking-widest text-primary/40">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3 text-right">
             <div className="hidden sm:block"><p className="font-black text-[12px] leading-none mb-1">{profile?.displayName}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{profile?.role}</p></div>
             <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary/20 text-sm">{profile?.displayName?.charAt(0)}</div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab + (selectedExamId || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Exams', value: exams.length, icon: BookOpen, color: 'text-blue-500' },
                        { label: 'Candidates', value: candidates.length, icon: Users, color: 'text-purple-500' },
                        { label: 'Avg Score', value: analytics?.averageScore || '0', icon: BarChart2, color: 'text-emerald-500' },
                        { label: 'Pass Rate', value: (analytics?.passRate || '0') + '%', icon: Shield, color: 'text-amber-500' }
                      ].map((stat, i) => (
                        <Card key={i} className="p-8 rounded-[32px] border-none shadow-xl bg-white group">
                          <div className={cn("w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6", stat.color)}><stat.icon className="w-6 h-6" /></div>
                          <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{stat.label}</p>
                          <h4 className="text-4xl font-black tracking-tighter">{stat.value}</h4>
                        </Card>
                      ))}
                   </div>
                </div>
              )}

              {/* Curriculum - Table View */}
              {activeTab === 'subjects' && (
                <div className="space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black">Institutional Curriculum</h3>
                      <Button onClick={() => setShowAddSubject(true)} className="bg-primary text-white font-black text-[10px] tracking-widest uppercase">Add Subject</Button>
                   </div>
                   <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50/50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Subject Name</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Actions</th></tr></thead>
                         <tbody className="divide-y divide-primary/5">
                            {offeredSubjects.map(s => (
                               <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="p-8 font-black uppercase">{s.name}</td>
                                  <td className="p-8 text-center"><Badge className={cn("text-[9px] font-black", s.isActive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>{s.isActive ? "ACTIVE" : "DISABLED"}</Badge></td>
                                  <td className="p-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => toggleSubjectStatus(s.id)} className="text-emerald-400 hover:bg-emerald-50"><CheckCircle className="w-5 h-5" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteOfferedSubject(s.id)} className="text-rose-400 hover:bg-rose-50"><Trash2 className="w-5 h-5" /></Button></div></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {/* Exam Modules - Question Management */}
              {activeTab === 'exams' && !selectedExamId && (
                <div className="space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black">Assessment Modules</h3>
                      <Button onClick={() => setShowAddExam(true)} className="bg-primary text-white font-black text-[10px] tracking-widest uppercase">New Module</Button>
                   </div>
                   <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50/50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Module</th><th className="p-8 text-center">Questions</th><th className="p-8 text-center">Duration</th><th className="p-8 text-right">Settings</th></tr></thead>
                         <tbody className="divide-y divide-primary/5">
                            {exams.map(e => (
                               <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="p-8 font-black uppercase">{e.title}</td>
                                  <td className="p-8 text-center font-bold">{e.totalQuestions || 0} Items</td>
                                  <td className="p-8 text-center">{e.durationMinutes} Min</td>
                                  <td className="p-8 text-right"><Button variant="outline" size="sm" onClick={() => setSelectedExamId(e.id)} className="h-9 px-4 rounded-xl font-black text-[9px] uppercase transition-all hover:bg-slate-100">Set Questions</Button></td>
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
                      <h3 className="text-xl font-black">{exams.find(e => e.id === selectedExamId)?.title} - Questions</h3>
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

              {/* Support & Chat */}
              {activeTab === 'chat' && (
                <div className="h-[75vh] grid md:grid-cols-[300px_1fr] border border-primary/5 bg-white rounded-[40px] overflow-hidden shadow-2xl">
                   <aside className="bg-slate-50/50 border-r border-primary/5 flex flex-col">
                      <div className="p-8 border-b border-primary/5"><h4 className="text-[11px] font-black uppercase tracking-widest opacity-30">Directories</h4></div>
                      <ScrollArea className="flex-1">
                         <div className="p-4 space-y-2">
                            {Array.from(new Set([...messages.map(m => m.from === 'admin' ? m.to : m.from), ...attempts.filter(a => a.status === 'in-progress').map(a => a.userId)])).map(id => {
                               if (!id) return null;
                               const name = candidates.find(c => c.examNumber === id)?.fullName || id;
                               return (
                                  <button key={id} onClick={() => setActiveChatId(id)} className={cn("w-full p-5 rounded-2xl text-left transition-all font-black text-[11px] uppercase", activeChatId === id ? "bg-primary text-white shadow-lg" : "hover:bg-primary/5 text-slate-400")}>
                                     {name}
                                  </button>
                               );
                            })}
                         </div>
                      </ScrollArea>
                   </aside>
                   <section className="flex flex-col">
                      {activeChatId ? (
                        <>
                           <div className="p-8 border-b border-primary/5 flex justify-between items-center bg-white"><h4 className="font-black uppercase tracking-widest text-sm">{activeChatId}</h4><Button variant="ghost" size="icon" onClick={() => setActiveChatId(null)} className="text-slate-300 hover:text-rose-500"><CircleX className="w-5 h-5" /></Button></div>
                           <ScrollArea className="flex-1 p-8 bg-slate-50/30">
                              <div className="space-y-6">
                                 {messages.filter(m => m.from === activeChatId || (m.from === 'admin' && m.to === activeChatId)).map((m, i) => (
                                    <div key={i} className={cn("flex flex-col", m.from === 'admin' ? "items-end" : "items-start")}>
                                       <div className={cn("max-w-[80%] p-4 rounded-2xl font-bold text-sm shadow-sm", m.from === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 border border-primary/5 rounded-tl-none")}>{m.message}</div>
                                       <span className="text-[8px] font-black opacity-20 mt-2">{new Date(m.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                 ))}
                                 <div ref={chatEndRef} />
                              </div>
                           </ScrollArea>
                           <form onSubmit={sendChatMessage} className="p-6 border-t border-primary/5 flex gap-4"><Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type authorized response..." className="h-14 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" /><Button type="submit" className="h-14 px-8 bg-primary text-white rounded-2xl font-black uppercase shadow-lg"><Send className="w-4 h-4" /></Button></form>
                        </>
                      ) : <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-center p-20"><MessageCircle className="w-24 h-24 mb-6" /><h3 className="text-2xl font-black uppercase">Support Core</h3><p className="max-w-xs font-bold text-xs">Establish secure biometric link with active terminals.</p></div>}
                   </section>
                </div>
              )}

              {/* Staff Management - Table View */}
              {activeTab === 'staff' && (
                <div className="space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black">Authorized Personnel</h3>
                      <Button onClick={() => setShowAddStaff(true)} className="bg-primary text-white font-black text-[10px] tracking-widest uppercase">Provision Staff</Button>
                   </div>
                   <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50/50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Display Name</th><th className="p-8">Access Email</th><th className="p-8 text-center">Role</th><th className="p-8 text-right">Actions</th></tr></thead>
                         <tbody className="divide-y divide-primary/5">
                            {staff.map(s => (
                               <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="p-8 font-black uppercase">{s.displayName}</td>
                                  <td className="p-8 font-bold text-slate-500">{s.email}</td>
                                  <td className="p-8 text-center"><Badge className="bg-slate-100 text-slate-400 border-none font-black text-[8px] uppercase">{s.role.replace('_', ' ')}</Badge></td>
                                  <td className="p-8 text-right">{s.role !== 'super_admin' && <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(s.id)} className="text-rose-400 hover:bg-rose-50"><Trash2 className="w-5 h-5" /></Button>}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {/* Center Hub */}
              {activeTab === 'center' && (
                 <div className="space-y-10">
                    <div className="flex justify-between items-end">
                       <h3 className="text-xl font-black">Operational Center Hub</h3>
                       <div className="flex gap-4"><div className="px-6 py-4 bg-white rounded-2xl shadow-xl border border-primary/5 text-center"><p className="text-[8px] font-black opacity-30 uppercase">Capacity</p><p className="text-xl font-black">{seats.length} Seats</p></div><div className="px-6 py-4 bg-primary text-white rounded-2xl shadow-xl text-center"><p className="text-[8px] font-black opacity-30 uppercase">In Use</p><p className="text-xl font-black">{seats.filter(s => s.status === 'occupied').length}</p></div></div>
                    </div>
                    <div className="bg-white p-10 rounded-[56px] shadow-2xl border border-primary/5 grid grid-cols-5 sm:grid-cols-10 gap-3">
                       {seats.length === 0 ? <p className="col-span-full py-20 text-center opacity-10 font-black uppercase">Center Hall Not Initialized</p> : seats.map(s => (<div key={s.id} className={cn("aspect-square rounded-xl flex items-center justify-center font-black text-[9px] border-2", s.status === 'occupied' ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md" : "bg-slate-50 border-slate-100 text-slate-300")}>{s.seatNumber}</div>))}
                    </div>
                 </div>
              )}

              {/* Intelligence (Analytics) */}
              {activeTab === 'analytics' && (
                 <div className="space-y-10">
                    <h3 className="text-xl font-black">Institutional Intelligence</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                       <Card className="p-10 rounded-[48px] bg-white shadow-2xl space-y-8">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Matrix</h4>
                          <div className="flex justify-between items-end"><span className="text-slate-400 font-bold">Academic Rating</span><span className="text-5xl font-black tracking-tighter text-primary">{analytics?.averageScore || '0.0'}</span></div>
                          <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${analytics?.passRate || 0}%` }} className="h-full bg-primary" /></div>
                          <p className="text-[11px] font-black text-emerald-500 uppercase">{analytics?.passRate || 0}% Proficiency Verified</p>
                       </Card>
                       <Card className="p-10 rounded-[48px] bg-slate-900 text-white shadow-2xl flex flex-col justify-center items-center text-center">
                          <Shield className="w-16 h-16 text-primary/40 mb-6" />
                          <h4 className="text-xl font-black uppercase mb-2">Integrity Shield: Active</h4>
                          <p className="text-[11px] font-medium text-white/40 leading-relaxed uppercase tracking-wider">Metrics are currently being aggregated across {attempts.length} active academic transcripts.</p>
                       </Card>
                    </div>
                 </div>
              )}

              {/* Security Center */}
              {activeTab === 'security' && (
                 <div className="space-y-8">
                    <h3 className="text-xl font-black">Integrity Intelligence</h3>
                    <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Candidate Profile</th><th className="p-8 text-center">Integrity</th><th className="p-8">Identity</th><th className="p-8">Evidence</th></tr></thead>
                          <tbody className="divide-y divide-primary/5">
                             {attempts.filter(a => (a.violationLogs?.length || 0) > 0 || a.isIdentityVerified === false).map(a => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                   <td className="p-8 font-black uppercase text-xs">{candidates.find(c => c.examNumber === a.userId)?.fullName || a.userId}</td>
                                   <td className="p-8 text-center font-black text-lg" className={cn(a.trustScore < 70 ? "text-rose-500" : "text-emerald-500")}>{Math.round(a.trustScore || 0)}%</td>
                                   <td className="p-8"><Badge className={cn("text-[9px] font-black", a.isIdentityVerified ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{a.isIdentityVerified ? "VERIFIED" : "MISMATCH"}</Badge></td>
                                   <td className="p-8 text-right"><Button variant="ghost" onClick={() => setViewingSnaps(a.id)} className="h-10 w-10 text-primary/30 hover:text-primary"><Camera className="w-5 h-5" /></Button></td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}

              {/* Audit Trail */}
              {activeTab === 'audit' && (
                 <div className="space-y-8">
                    <h3 className="text-xl font-black">System Audit Trail</h3>
                    <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Timestamp</th><th className="p-8">Category</th><th className="p-8">Incident Details</th><th className="p-8">Actor</th></tr></thead>
                          <tbody className="divide-y divide-primary/5">
                             {logs.map(l => (
                                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                   <td className="p-8 text-[11px] font-bold text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                                   <td className="p-8"><Badge className={cn("text-[9px] font-black uppercase", l.type === 'security' ? "bg-red-50 text-rose-500" : "bg-blue-50 text-sky-500")}>{l.type}</Badge></td>
                                   <td className="p-8 font-bold text-[12px] uppercase">{l.message}</td>
                                   <td className="p-8 font-black text-primary/20 text-[10px] uppercase">{l.userId || 'System'}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
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

        {showAddStaff && (
           <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><h3 className="text-xl font-black uppercase">Provision Staff</h3><Button variant="ghost" onClick={() => setShowAddStaff(false)} className="rounded-xl"><X className="w-6 h-6" /></Button></div><form onSubmit={handleCreateStaff} className="p-10 space-y-8"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Full Name</Label><Input value={newStaff.displayName} onChange={e => setNewStaff({...newStaff, displayName: e.target.value})} placeholder="Display Name" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Auth Email</Label><Input type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="staff@vivi.com" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold" /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40 ml-2">Role</Label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none"><option value="admin">Administrator</option><option value="reg_admin">Registry Officer</option></select></div><Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl uppercase mt-auto">Finalize Auth</Button></div></form></motion.div></div>
        )}

        {/* Biometric Evidence Review */}
        {viewingSnaps && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden"><div className="p-8 bg-primary text-white flex justify-between items-center"><div><h3 className="text-sm font-black tracking-widest uppercase">Security Review</h3><p className="text-[9px] font-bold text-white/40 uppercase">{viewingSnaps}</p></div><Button variant="ghost" onClick={() => setViewingSnaps(null)} className="text-white/20 h-10 w-10"><CircleX className="w-5 h-5" /></Button></div><div className="p-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10"><div className="space-y-6"><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Biometric Evidence</h4><div className="grid grid-cols-4 gap-4">{(attempts.find(s => s.id === viewingSnaps) as any)?.proctoringSnaps?.map((snap: string, i: number) => (<div key={i} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border-2 border-primary/5 relative group"><img src={snap} className="w-full h-full object-cover grayscale contrast-125" /><div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="ghost" size="icon" className="text-white" onClick={() => window.open(snap)}><Eye className="w-4 h-4" /></Button></div></div>)) || <div className="col-span-4 py-20 text-center opacity-10 font-black uppercase text-xs border-2 border-dashed border-primary/5 rounded-[40px]">No visual data</div>}</div></div><div className="space-y-6"><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Incident History</h4><ScrollArea className="h-[300px] pr-4 bg-slate-50 p-6 rounded-[32px] border border-primary/5"><div className="space-y-4">{(attempts.find(s => s.id === viewingSnaps) as any)?.violationLogs?.map((v: any, i: number) => (<div key={i} className="p-5 bg-white rounded-2xl border border-primary/5 shadow-sm relative overflow-hidden group"><div className={cn("absolute left-0 top-0 w-1 h-full", v.severity === 'critical' ? "bg-rose-500" : "bg-amber-500")} /><p className="text-[9px] font-black opacity-30">{new Date(v.timestamp).toLocaleTimeString()}</p><p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase">{v.reason}</p></div>)) || <p className="text-[11px] font-black opacity-10 italic text-center py-20 uppercase tracking-widest">Record Integrity High</p>}</div></ScrollArea></div></div></motion.div></div>
        )}
      </AnimatePresence>
    </div>
  );
}
