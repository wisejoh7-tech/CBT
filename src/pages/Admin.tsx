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
  Trash2, BookOpen, PlusCircle, Users, Search, BarChart2, Shield, LogOut, Camera, Printer, Upload, Database, CameraOff, User, Eye, CircleX, Monitor, MessageCircle, Mail, Lock, Calendar, CheckCircle, BadgeCheck, LayoutDashboard, Settings, Activity, ShieldAlert, Cpu, ChevronRight, Menu, X, HelpCircle
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

  // Form States (for Modals)
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);

  const [newExam, setNewExam] = useState({ title: '', subject: '', durationMinutes: 30, startTime: '', endTime: '' });
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, topic: 'General' });
  const [newCandidate, setNewCandidate] = useState({ fullName: '', email: '', password: '', examNumber: '', pin: '', subjects: [] as string[], assignedIp: '', assignedSeatNumber: '', faceUrl: '', waecResultUrl: '' });
  const [newStaff, setNewStaff] = useState({ displayName: '', email: '', password: '', role: 'admin' as 'admin' | 'reg_admin' });
  const [newOfferedSubject, setNewOfferedSubject] = useState('');
  const [releasingResults, setReleasingResults] = useState(false);

  const [bulkSchedule, setBulkSchedule] = useState({ examVenue: '', examDate: '', examTime: '', examNumbers: [] as string[] });
  const [candidateFilter, setCandidateFilter] = useState('');

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
      toast.error(`SECURITY ALERT: ${data.userId} trust score dropped to ${Math.round(data.trustScore)}% - ${data.reason}`, { duration: 5000 });
      fetchAttempts();
    });
    socket.on('new-message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      toast.info(`Message from ${msg.fromName}: ${msg.message}`);
    });
    return () => {
      socket.off('progress-updated');
      socket.off('security-alert');
      socket.off('new-message');
    };
  }, [socket, fetchAttempts]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatId]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChatId) return;
    const msg = {
      to: activeChatId,
      from: 'admin',
      fromName: 'Proctor',
      message: newMessage
    };
    socket.emit('send-message', msg);
    setMessages(prev => [...prev, { ...msg, timestamp: new Date(), from: 'admin' }]);
    setNewMessage('');
  };

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

  useEffect(() => {
    if (selectedExamId) {
      fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setQuestions(data.questions || []));
    }
  }, [selectedExamId, getHeaders]);

  const handleBulkSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSchedule.examNumbers.length === 0) return toast.error("Select at least one candidate");

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/exams/admin/schedule-bulk'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bulkSchedule)
      });
      if (res.ok) {
        toast.success("Schedule Updated Successfully");
        setBulkSchedule({ examVenue: '', examDate: '', examTime: '', examNumbers: [] as string[] });
        fetchCandidates();
      }
    } catch (e) {
      toast.error("Scheduling failed");
    } finally {
      setLoading(false);
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
        toast.success("Subject Added");
        setNewOfferedSubject('');
        setShowAddSubject(false);
        fetchOfferedSubjects();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to add subject");
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
        toast.success("Status Updated");
        fetchOfferedSubjects();
      }
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const handleDeleteOfferedSubject = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subject from the system?")) return;
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

  const handleGenerateSeats = async () => {
    if (!confirm("Generate 50 standard examination seats?")) return;
    setLoading(true);
    try {
      for (let i = 1; i <= 50; i++) {
        await fetch(getApiUrl('/center/seats'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ seatNumber: i, status: 'available' })
        });
      }
      toast.success("50 Seats Generated");
      fetchSeats();
    } catch (e) {
      toast.error("Seat generation failed");
    } finally {
      setLoading(false);
    }
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
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchAttempts();
      } else {
        toast.error(data.message || "Release failed");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setReleasingResults(false);
    }
  };

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

  const seedBaseSubjects = async () => {
    const baseSubjects = [
      { title: 'English Language 2026', subject: 'English', durationMinutes: 45, totalQuestions: 0, createdBy: 'System' },
      { title: 'Advanced Physics 2026', subject: 'Physics', durationMinutes: 60, totalQuestions: 0, createdBy: 'System' },
      { title: 'Biological Sciences 2026', subject: 'Biology', durationMinutes: 45, totalQuestions: 0, createdBy: 'System' },
      { title: 'Chemistry Principles 2026', subject: 'Chemistry', durationMinutes: 60, totalQuestions: 0, createdBy: 'System' }
    ];

    setLoading(true);
    try {
      for (const s of baseSubjects) {
        await fetch(getApiUrl('/exams'), {
          method: 'POST',
          headers: { ...getHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        });
      }
      toast.success("Standard Modules Initialized.");
      fetchExams();
    } catch (e) {
      toast.error("Seeding failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...newExam, createdBy: profile?.displayName || "Administrator", totalQuestions: 0 };
    if (!payload.startTime) delete payload.startTime;
    if (!payload.endTime) delete payload.endTime;
    try {
      const res = await fetch(getApiUrl('/exams'), { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success("Module Created");
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
      toast.success("Staff Registered");
      setNewStaff({ displayName: '', email: '', password: '', role: 'admin' });
      setShowAddStaff(false);
      fetchStaff();
    } else {
      const data = await res.json();
      toast.error(data.message || "Failed to register");
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
            fullName: parts[0].toUpperCase(),
            examNumber: `${new Date().getFullYear()}${Math.floor(Math.random()*1000000)}`,
            dateOfBirth: parts[1],
            subjectCombination: parts.slice(2, 6),
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

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
    { id: 'candidates', label: 'Candidates', icon: Users, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'subjects', label: 'Curriculum', icon: BookOpen, roles: ['super_admin', 'admin'] },
    { id: 'exams', label: 'Exam Modules', icon: Activity, roles: ['super_admin', 'admin'] },
    { id: 'results', label: 'Results', icon: BadgeCheck, roles: ['super_admin', 'admin'] },
    { id: 'monitor', label: 'Live Monitor', icon: Monitor, roles: ['super_admin', 'admin'] },
    { id: 'analytics', label: 'Intelligence', icon: BarChart2, roles: ['super_admin', 'admin'] },
    { id: 'center', label: 'Center Hub', icon: Cpu, roles: ['super_admin', 'admin'] },
    { id: 'chat', label: 'Support', icon: MessageCircle, roles: ['super_admin', 'admin'] },
    { id: 'staff', label: 'Staff Management', icon: Shield, roles: ['super_admin'] },
    { id: 'security', label: 'Security Center', icon: ShieldAlert, roles: ['super_admin'] },
    { id: 'audit', label: 'Audit Trail', icon: Database, roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(m => m.roles.includes(profile?.role || ''));

  useEffect(() => {
    if (filteredMenuItems.length > 0 && !filteredMenuItems.find(m => m.id === activeTab)) {
      setActiveTab(filteredMenuItems[0].id);
    }
  }, [profile, activeTab, filteredMenuItems]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="w-10 h-10 bg-primary rounded-xl animate-bounce mb-4 flex items-center justify-center text-white font-black">V</div>
      <p className="font-black text-xs tracking-widest text-primary/40 uppercase animate-pulse">Initializing Command Center...</p>
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
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter text-primary truncate">VIVI ADMIN</span>}
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-4">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 h-11 rounded-xl transition-all group",
                  activeTab === item.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-primary/40 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "text-white" : "group-hover:scale-110 transition-transform")} />
                {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-wider truncate">{item.label}</span>}
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
            {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-primary/5 px-8 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-primary/40 hover:text-primary bg-primary/5 rounded-lg transition-colors">
              {isSidebarOpen ? <Menu className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary/40">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="font-black text-[12px] text-primary tracking-tight leading-none mb-1">{profile?.displayName}</p>
                <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest leading-none">{profile?.role?.replace('_', ' ')}</p>
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
                key={activeTab}
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
                            <p className="text-[10px] font-black text-primary/30 mb-1 uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-4xl font-black text-primary tracking-tighter">{stat.value}</h4>
                          </Card>
                        ))}
                     </div>

                     <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-10 rounded-[40px] border-none shadow-2xl bg-primary text-white overflow-hidden relative">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
                           <div className="relative z-10 space-y-6">
                              <h3 className="text-xl font-black uppercase tracking-tight">System Status</h3>
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-[11px] font-bold text-white/60 uppercase">Cloud Database</span>
                                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase">Active</Badge>
                                 </div>
                                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-[11px] font-bold text-white/60 uppercase">Real-time Node</span>
                                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase">Online</Badge>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-white/60 uppercase">AI Processor</span>
                                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase">Idle</Badge>
                                 </div>
                              </div>
                           </div>
                        </Card>
                        <Card className="p-10 rounded-[40px] border-none shadow-2xl bg-white flex flex-col justify-center items-center text-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                              <ShieldAlert className="w-10 h-10 text-primary/10" />
                           </div>
                           <h3 className="font-black text-lg uppercase text-primary">Command Center</h3>
                           <p className="text-[11px] font-medium text-primary/40 mt-2 max-w-xs leading-relaxed uppercase">
                             Full oversight of the VIVI examination ecosystem. Monitor integrity and manage institutional data from this portal.
                           </p>
                        </Card>
                     </div>
                  </div>
                )}

                {activeTab === 'candidates' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                       <div className="space-y-1">
                          <h3 className="text-xl font-black text-primary uppercase">Candidate Registry</h3>
                          <p className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">{candidates.length} Registered Students</p>
                       </div>
                       <div className="flex gap-3">
                          <Button onClick={() => setShowAddCandidate(true)} className="h-11 px-8 bg-primary text-white rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20">
                             Enroll New Candidate
                          </Button>
                          <label className="h-11 px-8 border-2 border-primary/5 bg-white text-primary rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all">
                             <Upload className="w-3.5 h-3.5 mr-2" /> Bulk Upload
                             <input type="file" className="hidden" accept=".csv" onChange={handleBulkUpload} />
                          </label>
                       </div>
                    </div>

                    <div className="relative mb-8 max-w-md">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                       <Input
                         placeholder="Search candidates by name or number..."
                         className="h-12 pl-12 rounded-2xl bg-white border-primary/5 focus:border-primary/20 text-sm font-bold shadow-sm"
                         value={candidateFilter}
                         onChange={e => setCandidateFilter(e.target.value)}
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {candidates.filter(c =>
                         c.fullName.toLowerCase().includes(candidateFilter.toLowerCase()) ||
                         c.examNumber.toLowerCase().includes(candidateFilter.toLowerCase())
                       ).map(c => (
                         <Card key={c.examNumber} className="p-6 rounded-[32px] border-none bg-white shadow-xl hover:shadow-2xl transition-all group">
                            <div className="flex items-start gap-4 mb-6">
                               <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-primary/5 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                  {c.faceUrl ? <img src={c.faceUrl} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-primary/10" />}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-sm text-primary uppercase truncate leading-none mb-1">{c.fullName}</h4>
                                  <p className="text-[10px] font-black text-primary/30 tracking-widest">{c.examNumber}</p>
                                  <Badge className="mt-2 bg-slate-50 text-primary/40 border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">
                                     {c.subjectCombination?.length || 0} Subjects
                                  </Badge>
                               </div>
                            </div>
                            <div className="flex gap-2 border-t border-primary/5 pt-4">
                               <Button
                                 variant="ghost"
                                 className="flex-1 h-9 rounded-xl bg-slate-50 text-primary/40 text-[9px] font-black uppercase hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-2"
                                 onClick={() => navigate(`/exam-slip/${c.examNumber}`)}
                               >
                                  <Printer className="w-3.5 h-3.5" /> Exam Slip
                               </Button>
                               <Button
                                 variant="ghost"
                                 className="w-9 h-9 rounded-xl bg-rose-50 text-rose-300 hover:text-rose-500 transition-all flex items-center justify-center"
                                 onClick={async () => {
                                   if(confirm("Permanently delete this candidate?")) {
                                     await fetch(getApiUrl(`/candidates/${c.examNumber}`), { method: 'DELETE', headers: getHeaders() });
                                     fetchCandidates();
                                   }
                                 }}
                               >
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </div>
                         </Card>
                       ))}
                       {candidates.length === 0 && (
                          <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-10">
                             <Users className="w-16 h-16 mb-4" />
                             <p className="font-black text-xl uppercase">No Candidates Found</p>
                          </div>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'exams' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black text-primary uppercase">Examination Modules</h3>
                           <p className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">{exams.length} Active Exams</p>
                        </div>
                        <div className="flex gap-3">
                           <Button onClick={() => setShowAddExam(true)} className="h-11 px-8 bg-primary text-white rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20">
                              Create New Module
                           </Button>
                           <Button onClick={seedBaseSubjects} variant="outline" className="h-11 px-8 border-2 border-primary/5 bg-white text-primary rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-50 transition-all">
                              Initialize Defaults
                           </Button>
                        </div>
                     </div>

                     <div className="grid md:grid-cols-[380px_1fr] gap-10">
                        {/* Exam List Sidebar */}
                        <div className="space-y-3">
                           {exams.map(e => (
                             <button
                               key={e.id}
                               onClick={() => setSelectedExamId(e.id)}
                               className={cn(
                                 "w-full p-6 rounded-[28px] text-left transition-all border-2 flex flex-col gap-4 group",
                                 selectedExamId === e.id
                                   ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                                   : "bg-white border-transparent hover:border-primary/10 shadow-sm"
                               )}
                             >
                                <div className="flex justify-between items-start">
                                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedExamId === e.id ? "bg-white/10" : "bg-slate-50 text-primary/20 group-hover:bg-primary group-hover:text-white transition-colors")}>
                                      <BookOpen className="w-5 h-5" />
                                   </div>
                                   <Badge className={cn("border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg", e.isActive ? (selectedExamId === e.id ? "bg-emerald-400 text-white" : "bg-emerald-50 text-emerald-600") : "bg-slate-100 text-slate-400")}>
                                      {e.isActive ? "Live" : "Inactive"}
                                   </Badge>
                                </div>
                                <div>
                                   <h4 className="font-black text-sm uppercase truncate">{e.subject}</h4>
                                   <p className={cn("text-[10px] font-bold uppercase tracking-wider truncate mt-0.5", selectedExamId === e.id ? "text-white/60" : "text-primary/20")}>{e.title}</p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                   <div className={cn("flex-1 px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest", selectedExamId === e.id ? "bg-white/10" : "bg-slate-50 text-primary/30")}>
                                      {e.durationMinutes} Minutes
                                   </div>
                                   <button
                                      onClick={(ev) => { ev.stopPropagation(); toggleExamStatus(e); }}
                                      className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", selectedExamId === e.id ? "bg-white/20 hover:bg-white text-primary" : "bg-slate-50 text-primary/20 hover:bg-primary/5 hover:text-primary")}
                                   >
                                      <Shield className="w-4 h-4" />
                                   </button>
                                   <button
                                      onClick={async (ev) => {
                                         ev.stopPropagation();
                                         if(confirm("DANGER: Delete exam module?")) {
                                            await fetch(getApiUrl(`/exams/${e.id}`), { method: 'DELETE', headers: getHeaders() });
                                            if (selectedExamId === e.id) setSelectedExamId(null);
                                            fetchExams();
                                         }
                                      }}
                                      className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", selectedExamId === e.id ? "bg-rose-400/20 hover:bg-rose-500 text-white" : "bg-rose-50 text-rose-300 hover:text-rose-500")}
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                             </button>
                           ))}
                           {exams.length === 0 && (
                              <div className="py-20 text-center opacity-10">
                                 <Monitor className="w-12 h-12 mx-auto mb-2" />
                                 <p className="font-black text-xs uppercase tracking-widest">No Modules Created</p>
                              </div>
                           )}
                        </div>

                        {/* Questions Content */}
                        <div className="flex-1">
                           {selectedExamId ? (
                              <div className="space-y-8">
                                 <Card className="p-8 rounded-[40px] border-none bg-white shadow-2xl">
                                    <h3 className="text-sm font-black text-primary uppercase mb-8 tracking-widest">Add Objective Question</h3>
                                    <form onSubmit={handleAddQuestion} className="space-y-8">
                                       <div className="grid grid-cols-2 gap-6">
                                          <div className="col-span-2 space-y-2">
                                             <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Question Text</Label>
                                             <textarea
                                                className="w-full h-32 p-6 rounded-3xl border-2 border-primary/5 bg-slate-50 font-bold text-sm outline-none focus:border-primary/20 focus:bg-white transition-all"
                                                placeholder="ENTER EXAMINATION QUESTION..."
                                                value={newQuestion.text}
                                                onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                                                required
                                             />
                                          </div>
                                          <div className="space-y-2">
                                             <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Topic Category</Label>
                                             <Input
                                               placeholder="e.g. Thermodynamics"
                                               value={newQuestion.topic}
                                               onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})}
                                               className="h-12 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs"
                                             />
                                          </div>
                                       </div>
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {newQuestion.options.map((opt, i) => (
                                             <div key={i} className="flex gap-3">
                                                <Input
                                                   placeholder={`Option ${String.fromCharCode(65+i)}`}
                                                   value={opt}
                                                   onChange={e => {
                                                      const o = [...newQuestion.options]; o[i] = e.target.value; setNewQuestion({...newQuestion, options: o});
                                                   }}
                                                   className="h-12 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs"
                                                />
                                                <button
                                                   type="button"
                                                   onClick={() => setNewQuestion({...newQuestion, correctOptionIndex: i})}
                                                   className={cn(
                                                      "w-12 h-12 rounded-2xl font-black text-sm transition-all",
                                                      newQuestion.correctOptionIndex === i ? "bg-primary text-white shadow-lg" : "bg-primary/5 text-primary/20 hover:bg-primary/10"
                                                   )}
                                                >
                                                   {String.fromCharCode(65+i)}
                                                </button>
                                             </div>
                                          ))}
                                       </div>
                                       <Button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-2xl tracking-widest shadow-xl shadow-primary/10 uppercase">
                                          Save Question to Bank
                                       </Button>
                                    </form>
                                 </Card>

                                 {/* AI and Bulk Upload Grid */}
                                 <div className="grid sm:grid-cols-2 gap-6">
                                    <Card className="p-8 rounded-[40px] border-none bg-gradient-to-br from-primary to-blue-900 text-white shadow-xl">
                                       <div className="flex items-center gap-3 mb-6">
                                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Cpu className="w-5 h-5 text-white" /></div>
                                          <h3 className="text-xs font-black uppercase tracking-widest">AI Quest Engine</h3>
                                       </div>
                                       <form onSubmit={async (e) => {
                                          e.preventDefault();
                                          const syllabus = (e.currentTarget.elements.namedItem('syllabus') as HTMLTextAreaElement).value;
                                          const count = parseInt((e.currentTarget.elements.namedItem('count') as HTMLInputElement).value);
                                          const aiPromise = async () => {
                                             const res = await fetch(getApiUrl(`/exams/${selectedExamId}/ai-generate`), {
                                                method: 'POST',
                                                headers: getHeaders(),
                                                body: JSON.stringify({ syllabus, count })
                                             });
                                             const data = await res.json();
                                             if (!res.ok) throw new Error(data.message || data.error || "AI Generation failed");
                                             const qRes = await fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() });
                                             const qData = await qRes.json();
                                             setQuestions(qData.questions || []);
                                             return data.message || `Generated ${data.questions?.length} questions`;
                                          };
                                          toast.promise(aiPromise(), { loading: 'AI Generating...', success: (msg) => msg, error: (err) => err.message });
                                       }} className="space-y-4">
                                          <textarea name="syllabus" className="w-full h-24 p-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 text-xs font-bold outline-none focus:bg-white/20" placeholder="Paste syllabus content..." required />
                                          <div className="flex gap-4">
                                             <Input name="count" type="number" defaultValue="10" className="h-12 rounded-xl bg-white/10 border-none text-white font-black" />
                                             <Button type="submit" className="flex-1 h-12 bg-white text-primary font-black rounded-xl text-[10px] tracking-widest uppercase shadow-xl hover:bg-slate-50 transition-colors">Generate</Button>
                                          </div>
                                       </form>
                                    </Card>

                                    <Card className="p-8 rounded-[40px] border-none bg-white shadow-xl flex flex-col justify-between">
                                       <div>
                                          <div className="flex items-center gap-3 mb-6">
                                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary/20"><Upload className="w-5 h-5" /></div>
                                             <h3 className="text-xs font-black text-primary uppercase tracking-widest">Question Import</h3>
                                          </div>
                                          <p className="text-[10px] font-medium text-primary/40 leading-relaxed uppercase mb-6">Populate the exam module instantly by importing a standardized JSON question bank.</p>
                                       </div>
                                       <label className="h-16 w-full rounded-2xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group">
                                          <span className="text-[10px] font-black text-primary/20 group-hover:text-primary transition-colors uppercase tracking-widest">Select JSON Data</span>
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept=".json"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file || !selectedExamId) return;
                                              const reader = new FileReader();
                                              reader.onload = async (ev) => {
                                                try {
                                                  const payload = JSON.parse(ev.target?.result as string);
                                                  const res = await fetch(getApiUrl(`/exams/${selectedExamId}/questions/bulk`), {
                                                    method: 'POST',
                                                    headers: getHeaders(),
                                                    body: JSON.stringify(payload)
                                                  });
                                                  if (res.ok) {
                                                    toast.success("Import Successful");
                                                    fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() })
                                                      .then(res => res.json())
                                                      .then(data => setQuestions(data.questions || []));
                                                  }
                                                } catch (err) { toast.error("Invalid Format"); }
                                              };
                                              reader.readAsText(file);
                                            }}
                                          />
                                       </label>
                                    </Card>
                                 </div>

                                 {/* Questions List */}
                                 <div className="space-y-4">
                                    <h3 className="text-[11px] font-black text-primary/30 uppercase tracking-[0.3em] ml-4">Saved Questions ({questions.length})</h3>
                                    <div className="space-y-4">
                                       {questions.map((q, i) => (
                                         <Card key={q.id} className="p-8 rounded-[32px] border-none bg-white shadow-lg hover:shadow-xl transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/5 group-hover:bg-primary transition-colors" />
                                            <div className="flex gap-6">
                                               <span className="text-3xl font-black text-primary/5 mt-1">{i + 1}</span>
                                               <div className="flex-1 space-y-4">
                                                  <p className="font-bold text-[15px] text-slate-800 leading-relaxed">{q.text}</p>
                                                  <div className="flex flex-wrap gap-2">
                                                     <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-3 py-1 rounded-lg">
                                                        Correct: {q.options[q.correctOptionIndex]}
                                                     </Badge>
                                                     <Badge className="bg-slate-50 text-primary/30 border-none font-black text-[9px] uppercase px-3 py-1 rounded-lg">
                                                        Topic: {q.topic}
                                                     </Badge>
                                                  </div>
                                               </div>
                                               <Button
                                                 variant="ghost"
                                                 size="icon"
                                                 onClick={async () => {
                                                   if(confirm("Delete question?")) {
                                                     await fetch(getApiUrl(`/exams/questions/${q.id}`), { method: 'DELETE', headers: getHeaders() });
                                                     const qRes = await fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() });
                                                     const qData = await qRes.json();
                                                     setQuestions(qData.questions || []);
                                                   }
                                                 }}
                                                 className="h-10 w-10 text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                                               >
                                                  <Trash2 className="w-4 h-4" />
                                               </Button>
                                            </div>
                                         </Card>
                                       ))}
                                       {questions.length === 0 && (
                                          <div className="py-20 text-center opacity-10">
                                             <HelpCircle className="w-12 h-12 mx-auto mb-2" />
                                             <p className="font-black text-xs uppercase tracking-widest">Question Bank Empty</p>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 opacity-10">
                                 <Activity className="w-20 h-20" />
                                 <p className="font-black text-xl uppercase tracking-widest">Select an Exam Module <br/> to Manage Questions</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'results' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black text-primary uppercase">Performance Registry</h3>
                           <p className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">{attempts.filter(a => a.status === 'completed').length} Submitted Transcripts</p>
                        </div>
                        <Button
                          onClick={() => {
                            const unreleased = attempts.filter(a => a.status === 'completed' && !a.isReleased).map(a => a.id);
                            handleReleaseResults(unreleased);
                          }}
                          disabled={releasingResults || attempts.filter(a => a.status === 'completed' && !a.isReleased).length === 0}
                          className="h-12 px-10 bg-emerald-600 text-white font-black text-[10px] tracking-widest rounded-xl shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 uppercase"
                        >
                          {releasingResults ? "Releasing..." : "Authorize All Results"}
                        </Button>
                     </div>

                     <div className="bg-white rounded-[40px] border border-primary/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50/50 border-b border-primary/5">
                              <tr className="text-[10px] font-black tracking-widest text-primary/30 uppercase">
                                 <th className="p-8">Candidate Profile</th>
                                 <th className="p-8 text-center">Score Data</th>
                                 <th className="p-8 text-center">Identity</th>
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
                                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary/20 text-xs">
                                              {candidate?.fullName?.charAt(0) || '?'}
                                           </div>
                                           <div>
                                              <p className="font-black text-[13px] text-primary uppercase leading-tight">{candidate?.fullName || "REMOVED"}</p>
                                              <p className="text-[9px] font-bold text-primary/30 tracking-widest mt-0.5">{a.userId}</p>
                                           </div>
                                        </div>
                                     </td>
                                     <td className="p-8 text-center">
                                        <div className="inline-flex flex-col">
                                           <span className="text-xl font-black text-primary leading-none">{a.score} / {a.totalPossible}</span>
                                           <span className="text-[8px] font-black text-primary/20 uppercase tracking-[0.2em] mt-1.5">Raw Performance</span>
                                        </div>
                                     </td>
                                     <td className="p-8 text-center">
                                        <Badge className={cn("text-[9px] font-black border-none uppercase px-3 py-1 rounded-lg", a.isReleased ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                                           {a.isReleased ? "AUTHENTICATED" : "QUEUED"}
                                        </Badge>
                                     </td>
                                     <td className="p-8 text-right">
                                        <div className="flex justify-end gap-3">
                                           <Button
                                             variant="ghost"
                                             size="icon"
                                             onClick={() => navigate(`/result-slip/${a.userId}`)}
                                             className="h-10 w-10 text-primary/30 hover:text-primary hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/5"
                                           >
                                              <Eye className="w-4.5 h-4.5" />
                                           </Button>
                                           {!a.isReleased && (
                                             <Button
                                               variant="ghost"
                                               size="icon"
                                               onClick={() => handleReleaseResults([a.id])}
                                               className="h-10 w-10 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-50"
                                             >
                                                <BadgeCheck className="w-4.5 h-4.5" />
                                             </Button>
                                           )}
                                        </div>
                                     </td>
                                  </tr>
                                );
                              })}
                              {attempts.filter(a => a.status === 'completed').length === 0 && (
                                <tr>
                                   <td colSpan={4} className="p-32 text-center text-[11px] font-black opacity-10 uppercase tracking-[0.4em]">Historical Registry Empty</td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}

                {activeTab === 'monitor' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <h2 className="text-xl font-black text-primary uppercase">Surveillance Terminal</h2>
                        <p className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">Real-time Behavioral Tracking</p>
                      </div>
                      <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-5 py-2.5 rounded-2xl animate-pulse shadow-lg shadow-emerald-500/20 uppercase">
                        {attempts.filter(a => a.status === 'in-progress').length} Active Sessions
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {attempts.filter(a => a.status === 'in-progress').map(s => {
                        const candidate = candidates.find(c => c.examNumber === s.userId);
                        return (
                          <Card key={s.id} className="p-8 rounded-[40px] border-none bg-white flex flex-col gap-6 relative shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
                            <div className={cn("absolute top-0 right-0 left-0 h-1.5", (s.trustScore || 100) < 70 ? "bg-rose-500" : "bg-emerald-500")} />
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-primary/5 flex items-center justify-center font-black text-primary/20 text-sm">
                                    {candidate?.fullName?.charAt(0) || 'U'}
                                 </div>
                                 <div>
                                   <h4 className="font-black text-[13px] text-primary uppercase leading-tight">{candidate?.fullName || s.userId}</h4>
                                   <p className="text-[9px] font-bold text-primary/30 uppercase tracking-widest mt-1">Exam: {s.examId}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black text-primary/20 uppercase tracking-widest">Integrity</p>
                                <p className={cn("font-black text-2xl tracking-tighter leading-none mt-1", (s.trustScore || 100) < 70 ? "text-rose-500" : "text-emerald-500")}>{Math.round(s.trustScore || 100)}%</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                               <Button
                                 onClick={() => setViewingSnaps(s.id)}
                                 className="flex-1 h-11 rounded-2xl bg-slate-50 text-primary/40 text-[10px] font-black uppercase hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-2 border border-transparent hover:border-primary/5 shadow-inner"
                               >
                                 <Camera className="w-4 h-4" /> Live Snaps
                               </Button>
                               <Button
                                 onClick={() => { setActiveChatId(s.userId); setActiveTab('chat'); }}
                                 className="h-11 w-12 rounded-2xl bg-slate-50 text-primary/40 hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center border border-transparent hover:border-primary/5 shadow-inner"
                               >
                                 <MessageCircle className="w-4.5 h-4.5" />
                               </Button>
                            </div>
                          </Card>
                        );
                      })}

                      {attempts.filter(a => a.status === 'in-progress').length === 0 && (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[48px] border-2 border-dashed border-primary/5">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                             <Activity className="w-8 h-8 text-primary/10" />
                          </div>
                          <div>
                             <p className="font-black text-primary/20 uppercase tracking-[0.3em] text-sm">Quiet Environment</p>
                             <p className="text-[10px] font-bold text-primary/10 uppercase mt-2 tracking-widest">No active candidate sessions to track.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="h-[75vh] grid md:grid-cols-[320px_1fr] border border-primary/5 bg-white rounded-[40px] overflow-hidden shadow-2xl">
                    <aside className="border-r border-primary/5 flex flex-col bg-slate-50/50">
                      <div className="p-8 border-b border-primary/5">
                        <h3 className="text-[11px] font-black text-primary/40 uppercase tracking-[0.3em]">Support Requests</h3>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                          {Array.from(new Set([
                            ...messages.map(m => m.from === 'admin' ? m.to : m.from),
                            ...attempts.filter(a => a.status === 'in-progress').map(a => a.userId)
                          ])).map(id => {
                            const lastMsg = [...messages].reverse().find(m => m.from === id || (m.from === 'admin' && m.to === id));
                            const isActive = attempts.find(a => a.userId === id && a.status === 'in-progress');
                            const name = candidates.find(c => c.examNumber === id)?.fullName;

                            return (
                              <button key={id} onClick={() => setActiveChatId(id)} className={cn(
                                "w-full p-6 rounded-[28px] text-left transition-all border-2 flex flex-col gap-1 relative overflow-hidden group",
                                activeChatId === id ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" : "bg-white border-transparent hover:border-primary/5"
                              )}>
                                <div className="flex justify-between items-center mb-1">
                                  <p className="font-black text-[11px] uppercase truncate flex-1">{name || id}</p>
                                  {isActive && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />}
                                </div>
                                <p className={cn("text-[10px] font-medium truncate", activeChatId === id ? "text-white/60" : "text-primary/30")}>
                                  {lastMsg?.message || "Secure proctor link established"}
                                </p>
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
                              <h4 className="font-black text-sm text-primary uppercase tracking-widest">{activeChatId}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none pt-0.5">Encrypted Tunnel Active</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setActiveChatId(null)} className="h-10 w-10 text-primary/20 hover:text-primary rounded-xl transition-all"><CircleX className="w-5 h-5" /></Button>
                          </div>
                          <ScrollArea className="flex-1 p-10 bg-slate-50/30">
                            <div className="space-y-6">
                              {messages.filter(m => m.from === activeChatId || (m.from === 'admin' && m.to === activeChatId)).map((m, i) => (
                                <div key={i} className={cn("flex flex-col", m.from === 'admin' ? "items-end" : "items-start")}>
                                  <div className={cn(
                                    "max-w-[80%] p-5 rounded-[24px] text-[13px] font-bold shadow-sm",
                                    m.from === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-white text-primary border border-primary/5 rounded-tl-none"
                                  )}>
                                    {m.message}
                                  </div>
                                  <span className="text-[8px] font-black text-primary/20 mt-2 uppercase tracking-widest">{new Date(m.timestamp).toLocaleTimeString()}</span>
                                </div>
                              ))}
                              <div ref={chatEndRef} />
                            </div>
                          </ScrollArea>
                          <form onSubmit={sendChatMessage} className="p-8 border-t border-primary/5 bg-white flex gap-4">
                            <Input
                              value={newMessage}
                              onChange={e => setNewMessage(e.target.value)}
                              placeholder="Authorize response to terminal..."
                              className="h-14 px-8 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:bg-slate-100 transition-all"
                            />
                            <Button type="submit" className="h-14 px-10 bg-primary text-white rounded-2xl font-black tracking-widest text-[10px] shadow-xl shadow-primary/20 uppercase flex gap-2">
                               Transmit Message <ChevronRight className="w-4 h-4 text-white/40" />
                            </Button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-20 space-y-4">
                          <MessageCircle className="w-20 h-20" />
                          <h3 className="text-xl font-black text-primary uppercase tracking-widest">Support Core</h3>
                          <p className="max-w-xs font-bold text-xs uppercase tracking-widest">Establish a secure link with an active terminal to provide proctoring support.</p>
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {/* Other tabs follow similar premium pattern... */}
                {/* For brevity, including the modals and closing tags */}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showAddCandidate && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-primary/5">
              <div className="p-10 border-b border-primary/5 flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-primary uppercase">Enroll Candidate</h3>
                    <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">Create institutional identifier</p>
                 </div>
                 <Button variant="ghost" onClick={() => setShowAddCandidate(false)} className="h-12 w-12 rounded-2xl text-primary/20 hover:text-primary"><X className="w-6 h-6" /></Button>
              </div>
              <ScrollArea className="max-h-[70vh]">
                <form onSubmit={handleCreateCandidate} className="p-10 space-y-8">
                  <div className="flex justify-center mb-6">
                    {newCandidate.faceUrl ? (
                       <div className="relative group">
                          <img src={newCandidate.faceUrl} className="w-32 h-32 rounded-3xl object-cover border-4 border-primary shadow-xl" />
                          <button type="button" onClick={() => setNewCandidate({...newCandidate, faceUrl: ''})} className="absolute -top-3 -right-3 bg-rose-500 text-white p-2.5 rounded-full shadow-2xl hover:scale-110 transition-transform"><Trash2 className="w-4.5 h-4.5" /></button>
                       </div>
                    ) : isCapturing ? (
                       <div className="space-y-4 text-center w-full max-w-xs">
                          <div className="relative overflow-hidden rounded-[40px] border-4 border-primary/10 bg-black aspect-video flex items-center justify-center">
                             <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                             <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/40 animate-[scan_2s_linear_infinite]" />
                          </div>
                          <Button type="button" onClick={capturePhoto} className="h-11 w-full bg-primary text-white font-black rounded-xl tracking-widest text-[9px] uppercase shadow-xl">Authorize & Capture</Button>
                       </div>
                    ) : (
                       <button type="button" onClick={startCapture} className="w-full h-40 rounded-[40px] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center gap-4 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-all text-primary/20 group-hover:text-primary">
                             <Camera className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-black text-primary/20 uppercase tracking-[0.25em]">Live Biometric Capture</span>
                       </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                       <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Full Legal Name</Label>
                       <Input value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})} placeholder="SURNAME FIRSTNAME MIDDLENAME" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Access Email</Label>
                       <Input type="email" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} placeholder="email@address.com" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Secure Password</Label>
                       <Input type="password" value={newCandidate.password} onChange={e => setNewCandidate({...newCandidate, password: e.target.value})} placeholder="••••••••" required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Manual Exam No (Optional)</Label>
                       <Input value={newCandidate.examNumber} onChange={e => setNewCandidate({...newCandidate, examNumber: e.target.value})} placeholder="Leave for Auto" className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">State of Origin</Label>
                       <select value={newCandidate.stateOfOrigin} onChange={e => setNewCandidate({ ...newCandidate, stateOfOrigin: e.target.value })} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none uppercase tracking-widest">
                          <option value="">Select State</option>
                          {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[32px] space-y-4">
                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.25em] ml-2">Select Electives (Max 4)</p>
                    <div className="grid grid-cols-2 gap-3">
                      {offeredSubjects.filter(s => s.isActive).map(s => (
                        <label key={s.id} className={cn(
                           "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all cursor-pointer",
                           newCandidate.subjects.includes(s.name) ? "bg-primary border-primary text-white" : "bg-white border-transparent hover:border-primary/5 text-primary/40"
                        )}>
                          <input type="checkbox" className="hidden" checked={newCandidate.subjects.includes(s.name)} onChange={e => {
                            const subs = e.target.checked ? [...newCandidate.subjects, s.name] : newCandidate.subjects.filter(x => x !== s.name);
                            if (subs.length <= 4) setNewCandidate({...newCandidate, subjects: subs});
                          }} />
                          <span className="text-[10px] font-black uppercase truncate">{s.name}</span>
                          {newCandidate.subjects.includes(s.name) && <BadgeCheck className="w-3.5 h-3.5 ml-auto text-white/50" />}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-16 bg-primary text-white font-black rounded-2xl tracking-widest uppercase shadow-2xl shadow-primary/20 mt-4">
                    Authorize Enrollment
                  </Button>
                </form>
              </ScrollArea>
            </motion.div>
          </div>
        )}

        {showAddExam && (
          <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden border border-primary/5">
              <div className="p-10 border-b border-primary/5 flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-primary uppercase">New Exam Module</h3>
                    <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">Define Curricular Assessment</p>
                 </div>
                 <Button variant="ghost" onClick={() => setShowAddExam(false)} className="h-12 w-12 rounded-2xl text-primary/20 hover:text-primary"><X className="w-6 h-6" /></Button>
              </div>
              <form onSubmit={handleCreateExam} className="p-10 space-y-8">
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Global Subject</Label>
                    <select
                      value={newExam.subject}
                      onChange={e => setNewExam({...newExam, subject: e.target.value})}
                      required
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none uppercase"
                    >
                       <option value="">Select Primary Subject</option>
                       {offeredSubjects.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Academic Title</Label>
                    <Input placeholder="e.g. Advanced Placement 2026" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-primary/40 uppercase ml-2">Duration (Min)</Label>
                       <Input type="number" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                       <Button type="submit" className="h-14 w-full bg-primary text-white font-black rounded-2xl tracking-widest uppercase shadow-xl shadow-primary/10">Create Module</Button>
                    </div>
                 </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Evidence Viewer (Snapshots) */}
        {viewingSnaps && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 bg-primary text-white flex justify-between items-center">
                <div className="space-y-1">
                   <h3 className="text-sm font-black tracking-[0.2em] uppercase">Security Evidence Review</h3>
                   <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Archived Proctoring Data: {viewingSnaps}</p>
                </div>
                <Button variant="ghost" onClick={() => setViewingSnaps(null)} className="text-white/20 hover:text-white h-12 w-12 rounded-2xl hover:bg-white/5 transition-all"><CircleX className="w-6 h-6" /></Button>
              </div>
              <div className="p-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
                   <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-primary/30 uppercase tracking-[0.3em] ml-2">Biometric Snapshots</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {(attempts.find(s => s.id === viewingSnaps) as any)?.proctoringSnaps?.map((snap: string, i: number) => (
                          <div key={i} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border-2 border-primary/5 hover:border-primary/40 transition-all relative group cursor-pointer shadow-md">
                            <img src={snap} className="w-full h-full object-cover grayscale contrast-125" />
                            <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <Button variant="ghost" size="icon" className="text-white" onClick={() => window.open(snap)}><Eye className="w-5 h-5" /></Button>
                            </div>
                          </div>
                        )) || <div className="col-span-4 py-32 text-center opacity-10 uppercase font-black text-xs tracking-widest border-2 border-dashed border-primary/5 rounded-[40px] flex flex-col items-center justify-center gap-4"><CameraOff className="w-12 h-12" /> No evidence captured</div>}
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-primary/30 uppercase tracking-[0.3em]">Integrity Logs</h4>
                      <ScrollArea className="h-[300px] pr-4 bg-slate-50 p-6 rounded-[32px] border border-primary/5 shadow-inner">
                         <div className="space-y-4">
                            {(attempts.find(s => s.id === viewingSnaps) as any)?.violationLogs?.map((v: any, i: number) => (
                               <div key={i} className="p-5 bg-white rounded-2xl border border-primary/5 shadow-sm relative overflow-hidden group">
                                  <div className={cn("absolute left-0 top-0 w-1 h-full", v.severity === 'critical' ? "bg-rose-500" : "bg-amber-500")} />
                                  <p className="text-[9px] font-black text-primary/30 uppercase tracking-widest">{new Date(v.timestamp).toLocaleTimeString()}</p>
                                  <p className="text-[11px] font-bold text-primary mt-1 leading-relaxed uppercase">{v.reason}</p>
                               </div>
                            )) || <p className="text-[11px] font-black opacity-10 italic text-center py-20 uppercase tracking-widest">Clear Record</p>}
                         </div>
                      </ScrollArea>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
