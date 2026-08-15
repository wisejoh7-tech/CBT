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
  Trash2, BookOpen, PlusCircle, Users, Search, BarChart2, Shield, LogOut, Camera, Printer, Upload, Database, CameraOff, User, Eye, CircleX, Monitor, MessageCircle, Mail, Lock, Calendar, CheckCircle, BadgeCheck, LayoutDashboard, Settings, Activity, ShieldAlert, Cpu, ChevronRight, Menu, X, HelpCircle, ArrowLeft, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { cn } from '@/src/lib/utils/utils';
import { getApiUrl } from '@/src/lib/api-config';
import { NIGERIAN_STATES, STATE_LGAS } from '@/src/lib/constants/nigeria-data';

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

  const fetchOfferedSubjects = useCallback(async () => {
    const res = await fetch(getApiUrl('/subjects'), { headers: getHeaders() });
    if (res.ok) setOfferedSubjects(await res.json());
  }, [getHeaders]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-admin');
    socket.on('progress-updated', () => fetchAttempts());
    socket.on('security-alert', (data: any) => {
      toast.error(`Security Alert: ${data.userId} trust score dropped - ${data.reason}`, { duration: 5000 });
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
    if (selectedExamId) {
      fetchQuestions(selectedExamId);
    }
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
    const payload: any = { ...newExam, createdBy: profile?.displayName || "Administrator", totalQuestions: 0 };
    try {
      const res = await fetch(getApiUrl('/exams'), { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success("Exam module created");
        setNewExam({ title: '', subject: '', durationMinutes: 30, startTime: '', endTime: '' });
        setShowAddExam(false);
        fetchExams();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create");
      }
    } catch (e) {
      toast.error("Network error");
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
      toast.success("Question added successfully");
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, topic: 'General' });
      setShowAddQuestion(false);
      fetchQuestions(selectedExamId);
      fetchExams(); // Update question count
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
      setNewCandidate({ fullName: '', email: '', password: '', examNumber: '', pin: '', subjects: [], assignedIp: '', assignedSeatNumber: '', faceUrl: '', waecResultUrl: '' });
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
      toast.success("Staff provisioned successfully");
      setNewStaff({ displayName: '', email: '', password: '', role: 'admin' });
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
        toast.success("Subject added to curriculum");
        setNewOfferedSubject('');
        setShowAddSubject(false);
        fetchOfferedSubjects();
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const toggleSubjectStatus = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`/subjects/${id}`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({})
      });
      if (res.ok) {
        toast.success("Status updated");
        fetchOfferedSubjects();
      }
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const handleDeleteOfferedSubject = async (id: string) => {
    if (!confirm("Are you sure? This will remove the subject from all new enrollments.")) return;
    try {
      const res = await fetch(getApiUrl(`/subjects/${id}`), {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Subject removed");
        fetchOfferedSubjects();
      }
    } catch (e) {
      toast.error("Deletion failed");
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
        const parts = line.split(',').map(s => s.trim());
        if (parts[0] && parts[1]) {
          payload.push({
            fullName: parts[0],
            examNumber: `${new Date().getFullYear()}${Math.floor(Math.random()*1000000)}`,
            dateOfBirth: parts[1],
            subjectCombination: parts.slice(2, 6),
            status: 'active',
            registrationDate: new Date().toISOString()
          });
        }
      }
      const res = await fetch(getApiUrl('/candidates/bulk'), { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
      if (res.ok) { toast.success("Bulk Upload Successful"); fetchCandidates(); }
    };
    reader.readAsText(file);
  };

  const handleReleaseResults = async (attemptIds: string[]) => {
    if (attemptIds.length === 0) return;
    setReleasingResults(true);
    try {
      const res = await fetch(getApiUrl('/exams/admin/release-results'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ attemptIds })
      });
      if (res.ok) {
        toast.success("Results released successfully");
        fetchAttempts();
      }
    } finally {
      setReleasingResults(false);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !socket) return;

    const msg = {
      from: 'admin',
      to: activeChatId,
      fromName: profile?.displayName || 'System Admin',
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    socket.emit('admin-message', msg);
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    if (activeChatId) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeChatId, messages]);

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="w-10 h-10 bg-primary rounded-xl animate-bounce mb-4 flex items-center justify-center text-white font-black">V</div>
      <p className="font-black text-xs tracking-widest text-primary/40 animate-pulse">Initializing Terminal...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans relative antialiased tracking-tight">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-white border-r border-primary/5 transition-all duration-300 z-[100] flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0">V</div>
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter text-primary truncate">Admin Portal</span>}
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-4">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSelectedExamId(null); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 h-11 rounded-xl transition-all group",
                  activeTab === item.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-primary/40 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "text-white" : "group-hover:scale-110 transition-transform")} />
                {isSidebarOpen && <span className="text-[11px] font-black tracking-wider truncate">{item.label}</span>}
                {activeTab === item.id && isSidebarOpen && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-primary/5">
          <button
            onClick={() => { logOut?.(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-[11px] font-black tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        <header className="h-16 bg-white border-b border-primary/5 px-8 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-primary/40 hover:text-primary bg-primary/5 rounded-lg transition-colors">
              {isSidebarOpen ? <Menu className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <h2 className="text-sm font-black tracking-widest text-primary/40">
              {menuItems.find(m => m.id === activeTab)?.label}
              {selectedExamId && " > Questions"}
            </h2>
          </div>
          <div className="flex items-center gap-6 text-right">
             <div className="hidden sm:block">
                <p className="font-black text-[12px] text-primary tracking-tight leading-none mb-1">{profile?.displayName}</p>
                <p className="text-[9px] font-bold text-primary/40 tracking-widest leading-none">{profile?.role?.replace('_', ' ')}</p>
             </div>
             <div className="w-9 h-9 rounded-xl bg-slate-100 border border-primary/5 flex items-center justify-center font-black text-primary/20 text-sm">
                {profile?.displayName?.charAt(0)}
             </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-6xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (selectedExamId || '')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                          { label: 'Exams', value: exams.length, icon: BookOpen, color: 'text-blue-500' },
                          { label: 'Candidates', value: candidates.length, icon: Users, color: 'text-purple-500' },
                          { label: 'Avg Score', value: analytics?.averageScore || '0.0', icon: BarChart2, color: 'text-emerald-500' },
                          { label: 'Pass Rate', value: (analytics?.passRate || '0') + '%', icon: Shield, color: 'text-amber-500' }
                        ].map((stat, i) => (
                          <Card key={i} className="p-8 rounded-[32px] border-none shadow-xl bg-white group hover:scale-[1.02] transition-all">
                            <div className={cn("w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors", stat.color)}>
                              <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-black text-primary/30 mb-1 tracking-widest">{stat.label}</p>
                            <h4 className="text-4xl font-black text-primary tracking-tighter">{stat.value}</h4>
                          </Card>
                        ))}
                     </div>
                     <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-10 rounded-[40px] border-none shadow-2xl bg-primary text-white overflow-hidden relative">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
                           <div className="relative z-10 space-y-6">
                              <h3 className="text-xl font-black tracking-tight">System Status</h3>
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-[11px] font-bold text-white/60">Cloud Database</span>
                                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">Active</Badge>
                                 </div>
                                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-[11px] font-bold text-white/60">Real-time Node</span>
                                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">Online</Badge>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-white/60">AI Processor</span>
                                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">Idle</Badge>
                                 </div>
                              </div>
                           </div>
                        </Card>
                        <Card className="p-10 rounded-[40px] border-none shadow-2xl bg-white flex flex-col justify-center items-center text-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                              <ShieldAlert className="w-10 h-10 text-primary/10" />
                           </div>
                           <h3 className="font-black text-lg text-primary">Command Center</h3>
                           <p className="text-[11px] font-medium text-primary/40 mt-2 max-w-xs leading-relaxed uppercase">Full oversight of the VIVI examination ecosystem. Monitor integrity and manage institutional data.</p>
                        </Card>
                     </div>
                  </div>
                )}

                {activeTab === 'subjects' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black text-primary">Institutional Curriculum</h3>
                           <p className="text-[10px] font-bold text-primary/30 tracking-[0.2em]">{offeredSubjects.length} Registered Subjects</p>
                        </div>
                        <Button onClick={() => setShowAddSubject(true)} className="h-11 px-8 bg-primary text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg shadow-primary/20">Provision New Subject</Button>
                     </div>

                     <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50/50 border-b border-primary/5">
                              <tr className="text-[10px] font-black tracking-widest text-primary/30">
                                 <th className="p-8">Subject Name</th>
                                 <th className="p-8 text-center">Status</th>
                                 <th className="p-8 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-primary/5">
                              {offeredSubjects.map(s => (
                                 <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="p-8">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary/20"><BookOpen className="w-5 h-5" /></div>
                                          <span className="font-black text-sm text-primary uppercase">{s.name}</span>
                                       </div>
                                    </td>
                                    <td className="p-8 text-center">
                                       <Badge className={cn("text-[9px] font-black border-none px-3 py-1 rounded-lg", s.isActive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                          {s.isActive ? "ACTIVE" : "DISABLED"}
                                       </Badge>
                                    </td>
                                    <td className="p-8 text-right">
                                       <div className="flex justify-end gap-3">
                                          <Button variant="ghost" size="icon" onClick={() => toggleSubjectStatus(s.id)} className="h-10 w-10 text-primary/30 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl">
                                             <CheckCircle className="w-4.5 h-4.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => handleDeleteOfferedSubject(s.id)} className="h-10 w-10 text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl">
                                             <Trash2 className="w-4.5 h-4.5" />
                                          </Button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}

                {activeTab === 'exams' && !selectedExamId && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black text-primary">Examination Modules</h3>
                           <p className="text-[10px] font-bold text-primary/30 tracking-[0.2em]">{exams.length} Configured Assessments</p>
                        </div>
                        <Button onClick={() => setShowAddExam(true)} className="h-11 px-8 bg-primary text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg shadow-primary/20">Initialize New Module</Button>
                     </div>

                     <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50/50 border-b border-primary/5">
                              <tr className="text-[10px] font-black tracking-widest text-primary/30">
                                 <th className="p-8">Assessment Details</th>
                                 <th className="p-8 text-center">Questions</th>
                                 <th className="p-8 text-center">Duration</th>
                                 <th className="p-8 text-center">Status</th>
                                 <th className="p-8 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-primary/5">
                              {exams.map(exam => (
                                 <tr key={exam.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="p-8">
                                       <p className="font-black text-[13px] text-primary leading-tight">{exam.title}</p>
                                       <p className="text-[9px] font-bold text-primary/30 tracking-widest mt-1 uppercase">{exam.subject}</p>
                                    </td>
                                    <td className="p-8 text-center">
                                       <span className="font-black text-lg text-primary">{exam.totalQuestions || 0}</span>
                                    </td>
                                    <td className="p-8 text-center text-[12px] font-bold text-slate-600">{exam.durationMinutes} min</td>
                                    <td className="p-8 text-center">
                                       <Badge className={cn("text-[9px] font-black border-none px-3 py-1 rounded-lg", exam.isActive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                          {exam.isActive ? "PUBLISHED" : "DRAFT"}
                                       </Badge>
                                    </td>
                                    <td className="p-8 text-right">
                                       <div className="flex justify-end gap-3">
                                          <Button variant="ghost" size="icon" onClick={() => setSelectedExamId(exam.id)} className="h-10 w-10 text-primary/30 hover:text-primary hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/5">
                                             <Settings className="w-4.5 h-4.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => toggleExamStatus(exam)} className={cn("h-10 w-10 rounded-xl", exam.isActive ? "text-rose-300 hover:text-rose-500 bg-rose-50/0 hover:bg-rose-50" : "text-emerald-300 hover:text-emerald-500")}>
                                             {exam.isActive ? <X className="w-4.5 h-4.5" /> : <CheckCircle className="w-4.5 h-4.5" />}
                                          </Button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}

                {activeTab === 'exams' && selectedExamId && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                      <Button variant="ghost" onClick={() => setSelectedExamId(null)} className="h-10 w-10 rounded-xl text-primary/30 hover:text-primary bg-primary/5"><ArrowLeft className="w-5 h-5" /></Button>
                      <div>
                        <h3 className="text-xl font-black text-primary">Question Registry</h3>
                        <p className="text-[10px] font-bold text-primary/30 tracking-widest">{exams.find(e => e.id === selectedExamId)?.title}</p>
                      </div>
                      <Button onClick={() => setShowAddQuestion(true)} className="ml-auto h-11 px-8 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-widest shadow-xl">SET NEW QUESTION</Button>
                    </div>

                    <div className="space-y-4">
                      {questions.length === 0 ? (
                        <div className="p-20 text-center bg-white rounded-[40px] border-2 border-dashed border-primary/5 opacity-20">
                          <PlusCircle className="w-12 h-12 mx-auto mb-4" />
                          <p className="font-black text-sm uppercase">Empty Question Bank</p>
                        </div>
                      ) : (
                        questions.map((q, i) => (
                          <Card key={q.id} className="p-8 rounded-[32px] border border-primary/5 bg-white shadow-xl hover:shadow-2xl transition-all">
                             <div className="flex justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                   <div className="flex items-center gap-3">
                                      <Badge className="bg-slate-100 text-primary/40 border-none font-black text-[10px]">Q.{i + 1}</Badge>
                                      <span className="text-[9px] font-black text-primary/20 tracking-widest uppercase">{q.topic}</span>
                                   </div>
                                   <p className="text-[14px] font-bold text-slate-800 leading-relaxed">{q.text}</p>
                                   <div className="grid grid-cols-2 gap-3 pt-2">
                                      {q.options.map((opt, idx) => (
                                         <div key={idx} className={cn(
                                            "px-5 py-3 rounded-2xl border text-[12px] font-bold transition-all",
                                            idx === q.correctOptionIndex ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-slate-50 border-transparent text-slate-500"
                                         )}>
                                            {String.fromCharCode(65 + idx)}. {opt}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl" onClick={async () => {
                                   if(confirm("Delete this question?")) {
                                      await fetch(getApiUrl(`/exams/${selectedExamId}/questions/${q.id}`), { method: 'DELETE', headers: getHeaders() });
                                      fetchQuestions(selectedExamId);
                                   }
                                }}>
                                   <Trash2 className="w-5 h-5" />
                                </Button>
                             </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="h-[75vh] grid md:grid-cols-[320px_1fr] border border-primary/5 bg-white rounded-[40px] overflow-hidden shadow-2xl">
                    <aside className="border-r border-primary/5 flex flex-col bg-slate-50/50">
                      <div className="p-8 border-b border-primary/5"><h3 className="text-[11px] font-black text-primary/40 tracking-[0.3em]">Institutional Support</h3></div>
                      <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                          {Array.from(new Set([...messages.map(m => m.from === 'admin' ? m.to : m.from), ...attempts.filter(a => a.status === 'in-progress').map(a => a.userId)])).map(id => {
                            if (!id) return null;
                            const lastMsg = [...messages].reverse().find(m => m.from === id || (m.from === 'admin' && m.to === id));
                            const isActive = attempts.find(a => a.userId === id && a.status === 'in-progress');
                            const name = candidates.find(c => c.examNumber === id)?.fullName;
                            return (
                              <button key={id} onClick={() => setActiveChatId(id)} className={cn("w-full p-6 rounded-[28px] text-left transition-all border-2 flex flex-col gap-1 relative overflow-hidden group", activeChatId === id ? "bg-primary border-primary text-white shadow-xl" : "bg-white border-transparent hover:border-primary/5 shadow-sm")}>
                                <div className="flex justify-between items-center mb-1"><p className="font-black text-[11px] truncate flex-1 uppercase">{name || id}</p>{isActive && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />}</div>
                                <p className={cn("text-[10px] font-medium truncate", activeChatId === id ? "text-white/60" : "text-primary/30")}>{lastMsg?.message || "Encrypted tunnel established"}</p>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </aside>
                    <section className="flex flex-col bg-white">
                      {activeChatId ? (
                        <>
                          <div className="p-8 border-b border-primary/5 flex justify-between items-center bg-white">
                             <div>
                                <h4 className="font-black text-sm text-primary tracking-widest uppercase">{activeChatId}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                   <p className="text-[9px] font-black text-emerald-500 tracking-widest leading-none pt-0.5">BIOMETRIC AUTHENTICATED TUNNEL</p>
                                </div>
                             </div>
                             <Button variant="ghost" size="icon" onClick={() => setActiveChatId(null)} className="h-10 w-10 text-primary/20 hover:text-primary rounded-xl transition-all"><CircleX className="w-5 h-5" /></Button>
                          </div>
                          <ScrollArea className="flex-1 p-10 bg-slate-50/30">
                             <div className="space-y-6">
                                {messages.filter(m => m.from === activeChatId || (m.from === 'admin' && m.to === activeChatId)).map((m, i) => (
                                   <div key={i} className={cn("flex flex-col", m.from === 'admin' ? "items-end" : "items-start")}>
                                      <div className={cn("max-w-[80%] p-5 rounded-[24px] text-[13px] font-bold shadow-sm", m.from === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-white text-primary border border-primary/5 rounded-tl-none")}>
                                         {m.message}
                                      </div>
                                      <span className="text-[8px] font-black text-primary/20 mt-2 tracking-widest">{new Date(m.timestamp).toLocaleTimeString()}</span>
                                   </div>
                                ))}
                                <div ref={chatEndRef} />
                             </div>
                          </ScrollArea>
                          <form onSubmit={sendChatMessage} className="p-8 border-t border-primary/5 bg-white flex gap-4">
                             <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type authorized response..." className="h-14 px-8 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:bg-slate-100 transition-all shadow-inner" />
                             <Button type="submit" className="h-14 px-10 bg-primary text-white rounded-2xl font-black tracking-widest text-[10px] shadow-xl uppercase transition-transform active:scale-95">TRANSMIT</Button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-20 space-y-4 bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:40px_40px]">
                           <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-4"><MessageCircle className="w-12 h-12 text-primary" /></div>
                           <h3 className="text-xl font-black text-primary tracking-widest uppercase">Communication Core</h3>
                           <p className="max-w-xs font-bold text-xs tracking-widest">Select an active candidate session from the directory to initiate secure proctor-to-terminal messaging.</p>
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {/* Audit, Security, Results table views go here (similar pattern to subjects/exams) */}
                {activeTab === 'results' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black text-primary">Academic Transcripts</h3>
                           <p className="text-[10px] font-bold text-primary/30 tracking-[0.2em]">{attempts.filter(a => a.status === 'completed').length} Verified Submissions</p>
                        </div>
                        <Button onClick={() => { const unreleased = attempts.filter(a => a.status === 'completed' && !a.isReleased).map(a => a.id); handleReleaseResults(unreleased); }} disabled={releasingResults || attempts.filter(a => a.status === 'completed' && !a.isReleased).length === 0} className="h-12 px-10 bg-emerald-600 text-white font-black text-[10px] tracking-widest rounded-xl shadow-xl hover:bg-emerald-700">{releasingResults ? "RELEASING..." : "RELEASE ALL RESULTS"}</Button>
                     </div>
                     <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50/50 border-b border-primary/5">
                              <tr className="text-[10px] font-black tracking-widest text-primary/30">
                                 <th className="p-8">Candidate Profile</th>
                                 <th className="p-8 text-center">Performance</th>
                                 <th className="p-8 text-center">Casing</th>
                                 <th className="p-8 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-primary/5">
                              {attempts.filter(a => a.status === 'completed').map(a => {
                                const candidate = candidates.find(c => c.examNumber === a.userId);
                                return (
                                  <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                                     <td className="p-8">
                                        <div className="flex items-center gap-4">
                                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary/20 text-xs">{candidate?.fullName?.charAt(0) || '?'}</div>
                                           <div><p className="font-black text-[13px] text-primary leading-tight">{candidate?.fullName || "REMOVED"}</p><p className="text-[9px] font-bold text-primary/30 tracking-widest mt-0.5">{a.userId}</p></div>
                                        </div>
                                     </td>
                                     <td className="p-8 text-center"><span className="text-xl font-black text-primary leading-none">{a.score} / {a.totalPossible}</span></td>
                                     <td className="p-8 text-center"><Badge className={cn("text-[9px] font-black border-none px-3 py-1 rounded-lg", a.isReleased ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>{a.isReleased ? "AUTHENTICATED" : "QUEUED"}</Badge></td>
                                     <td className="p-8 text-right"><div className="flex justify-end gap-3"><Button variant="ghost" size="icon" onClick={() => navigate(`/result-slip/${a.userId}`)} className="h-10 w-10 text-primary/30 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Eye className="w-4.5 h-4.5" /></Button>{!a.isReleased && <Button variant="ghost" size="icon" onClick={() => handleReleaseResults([a.id])} className="h-10 w-10 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"><BadgeCheck className="w-4.5 h-4.5" /></Button>}</div></td>
                                  </tr>
                                );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showAddExam && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden border border-primary/5"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><div className="space-y-1"><h3 className="text-xl font-black text-primary uppercase">New Exam Module</h3><p className="text-[10px] font-bold text-primary/30 tracking-widest uppercase">Define Curricular Assessment</p></div><Button variant="ghost" onClick={() => setShowAddExam(false)} className="h-12 w-12 rounded-2xl text-primary/20 hover:text-primary"><X className="w-6 h-6" /></Button></div><form onSubmit={handleCreateExam} className="p-10 space-y-8"><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Subject Category</Label><select value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none"><option value="">Select Primary Subject</option>{offeredSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Assessment Title</Label><Input placeholder="e.g. Advanced Placement 2026" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Session Minutes</Label><Input type="number" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="space-y-2 flex flex-col justify-end"><Button type="submit" className="h-14 w-full bg-primary text-white font-black rounded-2xl tracking-widest uppercase shadow-xl">Initialize Module</Button></div></div></form></motion.div></div>
        )}

        {showAddQuestion && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-primary/5"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><div className="space-y-1"><h3 className="text-xl font-black text-primary uppercase">Set Question</h3><p className="text-[10px] font-bold text-primary/30 tracking-widest uppercase">Assessment Item Entry</p></div><Button variant="ghost" onClick={() => setShowAddQuestion(false)} className="h-12 w-12 rounded-2xl text-primary/20 hover:text-primary"><X className="w-6 h-6" /></Button></div><form onSubmit={handleAddQuestion} className="p-10 space-y-6"><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Question Text</Label><textarea value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} required className="w-full h-32 px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner resize-none focus:ring-2 focus:ring-primary/10 outline-none" /></div><div className="grid grid-cols-2 gap-4">{[0,1,2,3].map(i => (<div key={i} className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Option {String.fromCharCode(65+i)}</Label><Input value={newQuestion.options[i]} onChange={e => { const opts = [...newQuestion.options]; opts[i] = e.target.value; setNewQuestion({...newQuestion, options: opts}); }} required className="h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" /></div>))}</div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Correct Answer</Label><select value={newQuestion.correctOptionIndex} onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value)})} className="w-full h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none"><option value={0}>Option A</option><option value={1}>Option B</option><option value={2}>Option C</option><option value={3}>Option D</option></select></div><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Topic / Tag</Label><Input value={newQuestion.topic} onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})} className="h-12 px-6 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" /></div></div><Button type="submit" className="w-full h-16 bg-slate-900 text-white font-black rounded-2xl tracking-widest uppercase shadow-xl mt-4">Commit to Bank</Button></form></motion.div></div>
        )}

        {showAddSubject && (
           <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white rounded-[48px] shadow-2xl overflow-hidden border border-primary/5"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><div><h3 className="text-xl font-black text-primary uppercase">Add Subject</h3></div><Button variant="ghost" onClick={() => setShowAddSubject(false)} className="h-10 w-10 text-primary/20"><X className="w-5 h-5" /></Button></div><form onSubmit={handleCreateOfferedSubject} className="p-10 space-y-8"><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Curricular Name</Label><Input placeholder="e.g. Mathematics" value={newOfferedSubject} onChange={e => setNewOfferedSubject(e.target.value)} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl tracking-widest uppercase shadow-xl">Confirm Entry</Button></form></motion.div></div>
        )}

        {/* Existing Add Candidate/Staff modals... (I will keep them but clean them up if needed) */}
        {showAddCandidate && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-primary/5"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><div className="space-y-1"><h3 className="text-xl font-black text-primary uppercase">Candidate Enrollment</h3><p className="text-[10px] font-bold text-primary/30 tracking-widest uppercase">Institution Identification</p></div><Button variant="ghost" onClick={() => setShowAddCandidate(false)} className="h-12 w-12 rounded-2xl text-primary/20 hover:text-primary"><X className="w-6 h-6" /></Button></div><ScrollArea className="max-h-[70vh]"><form onSubmit={handleCreateCandidate} className="p-10 space-y-8"><div className="grid grid-cols-2 gap-6"><div className="col-span-2 space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Full Legal Name</Label><Input value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})} placeholder="Surname Firstname" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Access Email</Label><Input type="email" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} placeholder="email@vivi.com" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Credentials</Label><Input type="password" value={newCandidate.password} onChange={e => setNewCandidate({...newCandidate, password: e.target.value})} placeholder="Password" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div></div><Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl tracking-widest uppercase shadow-2xl mt-4">Confirm Enrollment</Button></form></ScrollArea></motion.div></div>
        )}

        {showAddStaff && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden border border-primary/5"><div className="p-10 border-b border-primary/5 flex justify-between items-center"><div className="space-y-1"><h3 className="text-xl font-black text-primary uppercase">Staff Provisioning</h3><p className="text-[10px] font-bold text-primary/30 tracking-widest uppercase">Administrative Access</p></div><Button variant="ghost" onClick={() => setShowAddStaff(false)} className="h-12 w-12 rounded-2xl text-primary/20 hover:text-primary"><X className="w-6 h-6" /></Button></div><form onSubmit={handleCreateStaff} className="p-10 space-y-8"><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Identity Name</Label><Input value={newStaff.displayName} onChange={e => setNewStaff({...newStaff, displayName: e.target.value})} placeholder="Full Name" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Auth Email</Label><Input type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="staff@vivi.com" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm shadow-inner" /></div><div className="space-y-2"><Label className="text-[9px] font-black text-primary/40 ml-2 uppercase">Role</Label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none"><option value="admin">Administrator</option><option value="reg_admin">Registry Officer</option></select></div><Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl tracking-widest uppercase shadow-2xl mt-4">Finalize Provisioning</Button></form></motion.div></div>
        )}

        {/* Evidence Viewer */}
        {viewingSnaps && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-white/20"><div className="p-8 bg-primary text-white flex justify-between items-center"><div><h3 className="text-sm font-black tracking-widest uppercase">Security Evidence Review</h3><p className="text-[9px] font-bold text-white/40 tracking-widest uppercase">{viewingSnaps}</p></div><Button variant="ghost" onClick={() => setViewingSnaps(null)} className="text-white/20 h-10 w-10"><CircleX className="w-5 h-5" /></Button></div><div className="p-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10"><div className="space-y-6"><h4 className="text-[11px] font-black text-primary/30 tracking-[0.3em] uppercase">Visual Evidence</h4><div className="grid grid-cols-4 gap-4">{(attempts.find(s => s.id === viewingSnaps) as any)?.proctoringSnaps?.map((snap: string, i: number) => (<div key={i} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border-2 border-primary/5 hover:border-primary/40 transition-all relative group shadow-md"><img src={snap} className="w-full h-full object-cover grayscale contrast-125" /><div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="ghost" size="icon" className="text-white" onClick={() => window.open(snap)}><Eye className="w-4 h-4" /></Button></div></div>)) || <div className="col-span-4 py-20 text-center opacity-10 font-black text-xs border-2 border-dashed border-primary/5 rounded-[40px] uppercase">No biometric evidence</div>}</div></div><div className="space-y-6"><h4 className="text-[11px] font-black text-primary/30 tracking-[0.3em] uppercase">Anomaly Logs</h4><ScrollArea className="h-[300px] pr-4 bg-slate-50 p-6 rounded-[32px] border border-primary/5 shadow-inner"><div className="space-y-4">{(attempts.find(s => s.id === viewingSnaps) as any)?.violationLogs?.map((v: any, i: number) => (<div key={i} className="p-5 bg-white rounded-2xl border border-primary/5 shadow-sm relative overflow-hidden group"><div className={cn("absolute left-0 top-0 w-1 h-full", v.severity === 'critical' ? "bg-rose-500" : "bg-amber-500")} /><p className="text-[9px] font-black text-primary/30 tracking-widest">{new Date(v.timestamp).toLocaleTimeString()}</p><p className="text-[11px] font-bold text-primary mt-1 leading-relaxed uppercase">{v.reason}</p></div>)) || <p className="text-[11px] font-black opacity-10 italic text-center py-20 tracking-widest uppercase">Integrity Record Clear</p>}</div></ScrollArea></div></div></motion.div></div>
        )}
      </AnimatePresence>
    </div>
  );
}
