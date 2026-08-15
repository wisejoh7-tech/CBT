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
  Trash2, BookOpen, PlusCircle, Users, BarChart2, Shield, LogOut, Camera, Printer, Monitor, MessageCircle, Lock, CheckCircle, BadgeCheck, LayoutDashboard, Activity, ShieldAlert, Cpu, ChevronRight, Menu, X, ArrowLeft, Send
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
  const [newCandidate, setNewCandidate] = useState({ fullName: '', email: '', password: '' });
  const [newStaff, setNewStaff] = useState({ displayName: '', email: '', password: '', role: 'admin' as 'admin' | 'reg_admin' });
  const [newOfferedSubject, setNewOfferedSubject] = useState('');

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  const fetchData = useCallback(async () => {
    try {
      const endpoints = [
        ['/analytics/summary', setAnalytics],
        ['/exams', setExams],
        ['/candidates', setCandidates],
        ['/exams/attempts/all', setAttempts],
        ['/center/seats', setSeats],
        ['/analytics/logs', setLogs],
        ['/subjects', setOfferedSubjects]
      ];

      await Promise.allSettled(endpoints.map(async ([url, setter]: any) => {
        const res = await fetch(getApiUrl(url), { headers: getHeaders() });
        if (res.ok) setter(await res.json());
      }));

      if (profile?.role === 'super_admin') {
        const res = await fetch(getApiUrl('/auth/staff'), { headers: getHeaders() });
        if (res.ok) setStaff(await res.json());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders, profile]);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile, fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-admin');
    socket.on('progress-updated', () => fetchData());
    socket.on('new-message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      toast.info(`Message from ${msg.fromName}`);
    });
    return () => {
      socket.off('progress-updated');
      socket.off('new-message');
    };
  }, [socket, fetchData]);

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
    if (!confirm("Initialize 50 seats for the exam hall?")) return;
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
      fetchData();
    } catch (e) { toast.error("Initialization failed"); }
    finally { setLoading(false); }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/exams'), { method: 'POST', headers: getHeaders(), body: JSON.stringify({ ...newExam, createdBy: profile?.displayName }) });
    if (res.ok) { toast.success("Module created"); setShowAddExam(false); fetchData(); }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    const res = await fetch(getApiUrl(`/exams/${selectedExamId}/questions`), { method: 'POST', headers: getHeaders(), body: JSON.stringify(newQuestion) });
    if (res.ok) { toast.success("Question added"); setShowAddQuestion(false); fetchQuestions(selectedExamId); fetchData(); }
  };

  const toggleSubjectStatus = async (id: string) => {
    await fetch(getApiUrl(`/subjects/${id}`), { method: 'PUT', headers: getHeaders() });
    fetchData();
  };

  const handleCreateOfferedSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/subjects'), { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name: newOfferedSubject }) });
    if (res.ok) { toast.success("Subject added"); setShowAddSubject(false); fetchData(); }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/candidates'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...newCandidate, status: 'active', subjectCombination: [] })
    });
    if (res.ok) { toast.success("Candidate registered"); setShowAddCandidate(false); fetchData(); }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/auth/register'), { method: 'POST', headers: getHeaders(), body: JSON.stringify(newStaff) });
    if (res.ok) { toast.success("Staff provisioned"); setShowAddStaff(false); fetchData(); }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Revoke access for this staff?")) return;
    await fetch(getApiUrl(`/auth/staff/${id}`), { method: 'DELETE', headers: getHeaders() });
    fetchData();
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !socket) return;
    const msg = { from: 'admin', to: activeChatId, fromName: profile?.displayName || 'Admin', message: newMessage.trim(), timestamp: new Date().toISOString() };
    socket.emit('admin-message', msg);
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'enrollment', label: 'Students', icon: Users, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'academic', label: 'Curriculum', icon: BookOpen, roles: ['super_admin', 'admin'] },
    { id: 'proctor', label: 'Security', icon: Monitor, roles: ['super_admin', 'admin'] },
    { id: 'system', label: 'Admin', icon: Shield, roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(m => m.roles.includes(profile?.role || ''));

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase">Initializing...</div>;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn("bg-white border-r border-primary/5 transition-all duration-300 z-[100] flex flex-col shrink-0 shadow-sm", isSidebarOpen ? "w-64" : "w-20")}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg">V</div>
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter text-primary">VIVI ADMIN</span>}
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-primary/5 px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-primary/40 hover:text-primary bg-primary/5 rounded-lg transition-colors"><Menu className="w-4 h-4" /></button>
            <h2 className="text-xs font-black uppercase tracking-widest text-primary/40">{menuItems.find(m => m.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-3 text-right">
             <div className="hidden sm:block"><p className="font-black text-[12px] leading-none mb-1">{profile?.displayName}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{profile?.role?.replace(\'_\', \' \')}</p></div>
             <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary/20 text-sm">{profile?.displayName?.charAt(0)}</div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-8 max-w-6xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab + (selectedExamId || \'\')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Students', value: candidates.length, icon: Users, color: 'text-purple-500' },
                        { label: 'Exam Modules', value: exams.length, icon: Activity, color: 'text-blue-500' },
                        { label: 'Avg Score', value: analytics?.averageScore || \'0\', icon: BarChart2, color: 'text-emerald-500' },
                        { label: 'System Health', value: \'100%\', icon: Shield, color: 'text-amber-500' }
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
                          <ShieldAlert className="w-16 h-16 text-primary/40 mb-6" />
                          <h4 className="text-xl font-black uppercase mb-2">Integrity Shield: Active</h4>
                          <p className="text-[11px] font-medium text-white/40 max-w-xs uppercase leading-relaxed tracking-wider">Metrics aggregation active for {attempts.length} terminals.</p>
                       </Card>
                       <Card className="p-10 rounded-[48px] bg-white border border-primary/5 shadow-2xl space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cloud Node Status</h4>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center"><span>Database Layer</span><Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px]">ONLINE</Badge></div>
                           <div className="flex justify-between items-center"><span>Real-time Engine</span><Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px]">ACTIVE</Badge></div>
                           <div className="flex justify-between items-center"><span>AI Processor</span><Badge className="bg-blue-100 text-blue-600 border-none font-black text-[9px]">READY</Badge></div>
                        </div>
                       </Card>
                    </div>
                  </div>
                )}

                {/* STUDENTS & HALL */}
                {activeTab === 'enrollment' && (
                  <div className="space-y-10">
                    <Card className="p-10 rounded-[48px] bg-white shadow-xl">
                      <div className="flex justify-between items-end mb-8">
                        <div><h3 className="font-black text-lg uppercase tracking-tight leading-none mb-1">Center Hall Visualization</h3><p className="text-[10px] font-bold text-slate-400 uppercase">Operational Environment v1.0</p></div>
                        {seats.length === 0 \u0026\u0026 <Button onClick={handleGenerateSeats} size="sm">Initialize 50 Seats</Button>}
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                        {seats.length === 0 ? <div className="col-span-full py-16 text-center opacity-10 font-black uppercase border-2 border-dashed border-primary/10 rounded-[32px]">Hall not initialized</div> : seats.map(s => (<div key={s.id} className={cn("aspect-square rounded-xl flex items-center justify-center font-black text-[9px] border-2 transition-all", s.status === \'occupied\' ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md" : "bg-slate-50 border-slate-100 text-slate-200")}>{s.seatNumber}</div>))}
                      </div>
                    </Card>
                    <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black">Student Registry</h3><Button onClick={() => setShowAddCandidate(true)} size="sm">Enroll Student</Button></div>
                    <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase p-4"><th className="p-8">Student</th><th className="p-8">Access ID</th><th className="p-8 text-right">Actions</th></tr></thead>
                          <tbody className="divide-y divide-primary/5">
                             {candidates.map(c => (<tr key={c.examNumber} className="hover:bg-slate-50/30 transition-colors"><td className="p-8 font-black uppercase text-xs">{c.fullName}</td><td className="p-8 font-bold text-primary">{c.examNumber}</td><td className="p-8 text-right"><Button variant="ghost" size="icon" onClick={() => navigate(`/exam-slip/${c.examNumber}`)}><Printer className="w-4 h-4" /></Button></td></tr>))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                )}

                {/* ACADEMIC SETUP */}
                {activeTab === 'academic' && (
                  <div className="space-y-12">
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                       <div className="space-y-6">
                         <div className="flex justify-between items-center"><h3 className="text-xl font-black">Curriculum</h3><Button onClick={() => setShowAddSubject(true)} size="sm" variant="ghost" className="text-primary"><PlusCircle className="w-4 h-4 mr-2" /> Add</Button></div>
                         <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-xl">
                            <table className="w-full text-left">
                               <thead className="bg-slate-50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase p-4"><th className="p-6">Name</th><th className="p-6 text-center">Status</th></tr></thead>
                               <tbody className="divide-y divide-primary/5">
                                  {offeredSubjects.map(s => (<tr key={s.id} className="hover:bg-slate-50/30 transition-colors"><td className="p-6 font-black uppercase text-xs">{s.name}</td><td className="p-6 text-center"><Badge onClick={() => toggleSubjectStatus(s.id)} className={cn("cursor-pointer border-none", s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{s.isActive ? "Active" : "Off"}</Badge></td></tr>))}
                               </tbody>
                            </table>
                         </div>
                       </div>
                       <div className="space-y-6">
                         <div className="flex justify-between items-center"><h3 className="text-xl font-black">Modules</h3><Button onClick={() => setShowAddExam(true)} size="sm" className="bg-primary text-white">Create Module</Button></div>
                         <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-xl">
                            <table className="w-full text-left">
                               <thead className="bg-slate-50 border-b border-primary/5"><tr className="text-[10px] font-black text-slate-400 uppercase p-4"><th className="p-6">Assessment</th><th className="p-6 text-right">Setup</th></tr></thead>
                               <tbody className="divide-y divide-primary/5">
                                  {exams.map(e => (<tr key={e.id} className="hover:bg-slate-50/30 transition-colors"><td className="p-6 font-black uppercase text-xs">{e.title}</td><td className="p-6 text-right"><Button variant="outline" size="sm" onClick={() => { setActiveTab(\'questions\'); setSelectedExamId(e.id); }} className="text-[8px] font-black uppercase h-7 px-3">Set Questions</Button></td></tr>))}
                               </tbody>
                            </table>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* QUESTIONS (Hidden tab) */}
                {activeTab === 'questions' \u0026\u0026 selectedExamId \u0026\u0026 (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4"><Button variant="ghost" onClick={() => setActiveTab(\'academic\')} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button><h3 className="text-xl font-black">{exams.find(e => e.id === selectedExamId)?.title} Items</h3><Button onClick={() => setShowAddQuestion(true)} className="ml-auto bg-slate-900 text-white font-black text-[10px] uppercase">New Item</Button></div>
                    <div className="space-y-4">
                       {questions.map((q, i) => (<Card key={q.id} className="p-8 rounded-[32px] bg-white shadow-xl relative overflow-hidden group"><Badge className="absolute top-8 right-8 bg-slate-50 text-slate-300 border-none font-black text-[10px]">ITEM #{i+1}</Badge><div className="space-y-6"><p className="font-bold text-lg leading-relaxed">{q.text}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{q.options.map((opt, idx) => (<div key={idx} className={cn(\"p-4 rounded-2xl border font-bold text-sm\", idx === q.correctOptionIndex ? \"bg-emerald-50 border-emerald-200 text-emerald-700\" : \"bg-slate-50 border-transparent text-slate-500\")}>{String.fromCharCode(65+idx)}. {opt}</div>))}</div><Button variant=\"ghost\" onClick={async () => { await fetch(getApiUrl(`/exams/${selectedExamId}/questions/${q.id}`), { method: \'DELETE\', headers: getHeaders() }); fetchQuestions(selectedExamId); fetchData(); }} className=\"text-rose-300 hover:text-rose-500 p-0 font-black text-[10px] uppercase\">Delete Item</Button></div></Card>))}
                       {questions.length === 0 \u0026\u0026 <div className=\"py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-primary/5 opacity-20 font-black uppercase\">Bank is empty</div>}
                    </div>
                  </div>
                )}

                {/* PROCTORING */}
                {activeTab === \'proctor\' \u0026\u0026 (
                  <div className=\"space-y-8\">
                    <div className=\"grid lg:grid-cols-[1fr_400px] gap-8 h-[75vh]\">
                       <div className=\"space-y-8 h-full flex flex-col\">
                          <div className=\"flex justify-between items-center\"><h3 className=\"text-xl font-black\">Proctor Surveillance</h3><Badge className=\"bg-emerald-500 text-white animate-pulse\">{attempts.filter(a => a.status === \'in-progress\').length} Active sessions</Badge></div>
                          <ScrollArea className=\"flex-1 pr-4\">
                             <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                                {attempts.filter(a => a.status === \'in-progress\').map(s => (
                                   <Card key={s.id} className=\"p-6 rounded-[32px] bg-white shadow-lg border-l-4 border-emerald-500 relative\">
                                      <div className=\"flex justify-between items-start mb-4\">
                                         <div><p className=\"font-black text-xs uppercase truncate max-w-[150px]\">{candidates.find(c => c.examNumber === s.userId)?.fullName || s.userId}</p><p className=\"text-[8px] font-bold opacity-30 uppercase tracking-widest mt-1\">Session {s.id.substring(0,4)}</p></div>
                                         <Badge className={cn(\"border-none\", (s.trustScore || 100) < 70 ? \"bg-rose-50 text-rose-500\" : \"bg-emerald-50 text-emerald-500\")}>{Math.round(s.trustScore || 100)}%</Badge>
                                      </div>
                                      <div className=\"flex gap-2\">
                                         <Button onClick={() => setViewingSnaps(s.id)} size=\"sm\" variant=\"ghost\" className=\"flex-1 bg-slate-50 text-slate-400\">Snaps</Button>
                                         <Button onClick={() => setActiveChatId(s.userId)} size=\"icon\" className=\"bg-primary/5 text-primary\"><MessageCircle className=\"w-4 h-4\" /></Button>
                                      </div>
                                   </Card>
                                ))}
                             </div>
                          </ScrollArea>
                       </div>
                       <Card className=\"flex flex-col rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden bg-white\">
                          <div className=\"p-8 border-b border-primary/5 bg-slate-50/50 font-black text-xs uppercase tracking-widest text-primary flex items-center gap-2\"><MessageCircle className=\"w-4 h-4\" /> Proctor Chat</div>
                          {activeChatId ? (
                            <>
                              <ScrollArea className=\"flex-1 p-8\"><div className=\"space-y-4\">{messages.filter(m => m.from === activeChatId || (m.from === \'admin\' \u0026\u0026 m.to === activeChatId)).map((m, i) => (<div key={i} className={cn(\"flex flex-col\", m.from === \'admin\' ? \"items-end\" : \"items-start\")}><div className={cn(\"max-w-[90%] p-4 rounded-2xl font-bold text-sm shadow-sm\", m.from === \'admin\' ? \"bg-primary text-white rounded-tr-none\" : \"bg-slate-100 text-slate-800 rounded-tl-none\")}>{m.message}</div><span className=\"text-[8px] font-black opacity-20 mt-1 uppercase\">{new Date(m.timestamp).toLocaleTimeString()}</span></div>))}<div ref={chatEndRef} /></div></ScrollArea>
                              <form onSubmit={sendChatMessage} className=\"p-6 border-t border-primary/5 bg-white flex gap-3\"><Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder=\"Authorized message...\" className=\"h-12 rounded-xl bg-slate-50 border-none font-bold shadow-inner\" /><Button type=\"submit\" size=\"icon\" className=\"h-12 w-12 rounded-xl bg-primary text-white shadow-lg\"><Send className=\"w-4 h-4\" /></Button></form>
                            </>
                          ) : <div className=\"flex-1 flex flex-col items-center justify-center opacity-10 text-center p-10 uppercase font-black text-[9px] tracking-widest\">Engage terminal to chat</div>}
                       </Card>
                    </div>
                  </div>
                )}

                {/* SYSTEM ADMIN */}
                {activeTab === \'system\' \u0026\u0026 (
                  <div className=\"space-y-12\">
                    <div className=\"grid lg:grid-cols-2 gap-8 items-start\">
                       <div className=\"space-y-6\">
                         <div className=\"flex justify-between items-center\"><h3 className=\"text-xl font-black\">Personnel</h3><Button onClick={() => setShowAddStaff(true)} size=\"sm\">Provision Account</Button></div>
                         <div className=\"bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-xl\">
                            <table className=\"w-full text-left\">
                               <thead className=\"bg-slate-50/50 border-b border-primary/5\"><tr className=\"text-[10px] font-black text-slate-400 uppercase p-4\"><th className=\"p-6\">Member</th><th className=\"p-6 text-center\">Role</th></tr></thead>
                               <tbody className=\"divide-y divide-primary/5\">
                                  {staff.map(s => (<tr key={s.id} className=\"hover:bg-slate-50/30 transition-colors\"><td className=\"p-6 font-black uppercase text-xs\">{s.displayName}</td><td className=\"p-6 text-center\"><Badge variant=\"outline\" className=\"text-[7px] uppercase font-black\">{s.role}</Badge></td></tr>))}
                               </tbody>
                            </table>
                         </div>
                       </div>
                       <div className=\"space-y-6\">
                         <h3 className=\"text-xl font-black\">Global Audit</h3>
                         <Card className=\"h-[500px] overflow-hidden rounded-[40px] border border-primary/5 shadow-xl bg-white flex flex-col\">
                            <ScrollArea className=\"flex-1 p-6\"><div className=\"space-y-3\">{logs.map(l => (<div key={l.id} className=\"p-4 bg-slate-50 rounded-2xl flex justify-between items-center group\"><div><p className=\"font-bold text-[10px] uppercase text-primary group-hover:text-black transition-colors\">{l.message}</p><p className=\"text-[8px] opacity-20 mt-1 uppercase\">{new Date(l.timestamp).toLocaleString()}</p></div><Badge className=\"text-[7px] border-none bg-primary/5 text-primary uppercase\">{l.type}</Badge></div>))}</div></ScrollArea>
                         </Card>
                       </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showAddExam \u0026\u0026 (
          <div className=\"fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6\"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className=\"w-full max-w-lg bg-white rounded-[48px] shadow-2xl p-10 space-y-8 border border-primary/5\"><h3 className=\"text-xl font-black uppercase text-primary mb-8 text-center\">New Exam Module</h3><form onSubmit={handleCreateExam} className=\"space-y-6\"><select value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} className=\"w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none uppercase shadow-inner\">{offeredSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select><Input placeholder=\"Assessment Title\" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner\" /><Input type=\"number\" placeholder=\"Duration (min)\" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner\" /><div className=\"flex gap-3\"><Button type=\"submit\" className=\"flex-1 h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl\">Initialize</Button><Button type=\"button\" onClick={() => setShowAddExam(false)} variant=\"outline\" className=\"h-14 px-8 rounded-2xl font-black uppercase\">Cancel</Button></div></form></motion.div></div>
        )}
        {showAddQuestion \u0026\u0026 (
          <div className=\"fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6\"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className=\"w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-10 border border-primary/5 overflow-hidden\"><h3 className=\"text-xl font-black uppercase text-primary mb-8 text-center\">Set Assessment Item</h3><form onSubmit={handleAddQuestion} className=\"space-y-6\"><textarea value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} placeholder=\"Context / question text...\" required className=\"w-full h-32 px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner outline-none focus:ring-2 focus:ring-primary/10 resize-none\" /><div className=\"grid grid-cols-2 gap-4\">{[0,1,2,3].map(i => (<Input key={i} placeholder={`Option ${String.fromCharCode(65+i)}`} value={newQuestion.options[i]} onChange={e => { const opts \u003d [...newQuestion.options]; opts[i] \u003d e.target.value; setNewQuestion({...newQuestion, options: opts}); }} required className=\"h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner\" />))}</div><div className=\"flex gap-4\"><select value={newQuestion.correctOptionIndex} onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value)})} className=\"flex-1 h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none shadow-inner\"><option value={0}>Answer: A</option><option value={1}>Answer: B</option><option value={2}>Answer: C</option><option value={3}>Answer: D</option></select><Input placeholder=\"Topic Tag\" value={newQuestion.topic} onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})} className=\"flex-1 h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner\" /></div><div className=\"flex gap-3\"><Button type=\"submit\" className=\"flex-1 h-14 bg-slate-900 text-white font-black rounded-2xl uppercase shadow-xl\">Commit Item</Button><Button type=\"button\" onClick={() => setShowAddQuestion(false)} variant=\"outline\" className=\"h-14 px-8 rounded-2xl font-black uppercase\">Discard</Button></div></form></motion.div></div>
        )}
        {showAddSubject \u0026\u0026 (
           <div className=\"fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6\"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className=\"w-full max-w-sm bg-white rounded-[48px] shadow-2xl p-10 space-y-8 border border-primary/5\"><h3 className=\"text-xl font-black uppercase text-center text-primary mb-8\">Add Subject</h3><form onSubmit={handleCreateOfferedSubject} className=\"space-y-6\"><Input placeholder=\"Curricular Name\" value={newOfferedSubject} onChange={e \u003d\u003e setNewOfferedSubject(e.target.value)} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-center shadow-inner\" /><div className=\"flex gap-3\"><Button type=\"submit\" className=\"flex-1 h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl\">Confirm</Button><Button type=\"button\" onClick={() => setShowAddSubject(false)} variant=\"outline\" className=\"h-14 rounded-2xl font-black uppercase\">Cancel</Button></div></form></motion.div></div>
        )}
        {showAddCandidate \u0026\u0026 (
          <div className=\"fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6\"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className=\"w-full max-w-xl bg-white rounded-[48px] shadow-2xl p-10 space-y-8 border border-primary/5\"><h3 className=\"text-xl font-black uppercase text-primary mb-8 text-center\">Enroll Student</h3><form onSubmit={handleCreateCandidate} className=\"space-y-6\"><Input placeholder=\"Full Identity Name\" value={newCandidate.fullName} onChange={e \u003d\u003e setNewCandidate({...newCandidate, fullName: e.target.value})} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner\" /><Input type=\"email\" placeholder=\"Auth Email\" value={newCandidate.email} onChange={e \u003d\u003e setNewCandidate({...newCandidate, email: e.target.value})} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner\" /><Input type=\"password\" placeholder=\"Access Password\" value={newCandidate.password} onChange={e \u003d\u003e setNewCandidate({...newCandidate, password: e.target.value})} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner\" /><div className=\"flex gap-3\"><Button type=\"submit\" className=\"flex-1 h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl\">Enroll</Button><Button type=\"button\" onClick={() => setShowAddCandidate(false)} variant=\"outline\" className=\"h-14 rounded-2xl font-black uppercase\">Cancel</Button></div></form></motion.div></div>
        )}
        {showAddStaff \u0026\u0026 (
           <div className=\"fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6\"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className=\"w-full max-w-lg bg-white rounded-[48px] shadow-2xl p-10 space-y-8 border border-primary/5\"><h3 className=\"text-xl font-black uppercase text-primary mb-8 text-center\">Provision Staff</h3><form onSubmit={handleCreateStaff} className=\"space-y-6\"><Input placeholder=\"Display Name\" value={newStaff.displayName} onChange={e \u003d\u003e setNewStaff({...newStaff, displayName: e.target.value})} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner\" /><Input type=\"email\" placeholder=\"Institutional Email\" value={newStaff.email} onChange={e \u003d\u003e setNewStaff({...newStaff, email: e.target.value})} required className=\"h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner\" /><select value={newStaff.role} onChange={e \u003d\u003e setNewStaff({...newStaff, role: e.target.value as any})} className=\"w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none uppercase shadow-inner\"><option value=\"admin\">Administrator</option><option value=\"reg_admin\">Registry Officer</option></select><div className=\"flex gap-3\"><Button type=\"submit\" className=\"flex-1 h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl\">Finalize</Button><Button type=\"button\" onClick={() => setShowAddStaff(false)} variant=\"outline\" className=\"h-14 rounded-2xl font-black uppercase\">Cancel</Button></div></form></motion.div></div>
        )}
        {viewingSnaps \u0026\u0026 (
          <div className=\"fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6\"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className=\"w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col h-[80vh]\"><div className=\"p-8 bg-primary text-white flex justify-between items-center shrink-0\"><div><h3 className=\"text-sm font-black tracking-widest uppercase\">Evidence Review</h3><p className=\"text-[9px] font-bold text-white/40 uppercase\">{viewingSnaps}</p></div><Button variant=\"ghost\" onClick={() => setViewingSnaps(null)} className=\"text-white/20 h-10 w-10 hover:bg-white/10 transition-colors\"><CircleX className=\"w-5 h-5\" /></Button></div><div className=\"p-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 flex-1 overflow-hidden\"><ScrollArea className=\"h-full\"><div className=\"grid grid-cols-4 gap-4\">{(attempts.find(s \u003d\u003e s.id \u003d\u003d\u003d viewingSnaps) as any)?.proctoringSnaps?.map((snap: string, i: number) \u003d\u003e (\u003cdiv key\u003d{i} className=\"aspect-square bg-slate-100 rounded-3xl overflow-hidden border-2 border-primary/5 relative group\"><img src\u003d{snap} className=\"w-full h-full object-cover grayscale contrast-125\" /\u003e\u003cdiv className=\"absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity\"\u003e\u003cButton variant\u003d\"ghost\" size\u003d\"icon\" className=\"text-white\" onClick\u003d{() \u003d\u003e window.open(snap)}\u003e\u003cEye className=\"w-4 h-4\" /\u003e\u003c/Button\u003e\u003c/div\u003e\u003c/div\u003e)) || \u003cdiv className=\"col-span-4 py-20 text-center opacity-10 font-black uppercase text-xs\"\u003eNo visual data\u003c/div\u003e}</div></ScrollArea><div className=\"flex flex-col h-full\"><h4 className=\"text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4\">Anomaly Log</h4><ScrollArea className=\"flex-1 bg-slate-50 p-6 rounded-[32px] border border-primary/5\"><div className=\"space-y-4\">{(attempts.find(s \u003d\u003e s.id \u003d\u003d\u003d viewingSnaps) as any)?.violationLogs?.map((v: any, i: number) \u003d\u003e (\u003cdiv key\u003d{i} className=\"p-4 bg-white rounded-2xl border border-primary/5 shadow-sm relative overflow-hidden group\"\u003e\u003cdiv className\u003d{cn(\"absolute left-0 top-0 w-1 h-full\", v.severity \u003d\u003d\u003d \'critical\' ? \"bg-rose-500\" : \"bg-amber-500\")} /\u003e\u003cp className=\"text-[8px] font-black opacity-30 uppercase\">{new Date(v.timestamp).toLocaleTimeString()}</p><p className=\"text-[10px] font-bold text-slate-700 uppercase mt-1 leading-tight\">{v.reason}</p>\u003c/div\u003e)) || \u003cp className=\"text-[10px] font-black opacity-10 italic uppercase\"\u003eClear record\u003c/p\u003e}</div></ScrollArea></div></div>\u003c/motion.div\u003e\u003c/div\u003e\n        )}\n      \u003c/AnimatePresence\u003e\n    \u003c/div\u003e\n  );\n}\n\nfunction ShieldCheck(props: any) {\n  return (\n    \u003csvg {...props} xmlns\u003d\"http://www.w3.org/2000/svg\" width\u003d\"24\" height\u003d\"24\" viewBox\u003d\"0 0 24 24\" fill\u003d\"none\" stroke\u003d\"currentColor\" strokeWidth\u003d\"2\" strokeLinecap\u003d\"round\" strokeLinejoin\u003d\"round\" \u003e\n      \u003cpath d\u003d\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10\" /\u003e\u003cpath d\u003d\"m9 12 2 2 4-4\" /\u003e\n    \u003c/svg\u003e\n  )\n}\n