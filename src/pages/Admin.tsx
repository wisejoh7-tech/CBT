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
  Trash2, BookOpen, PlusCircle, Users, Search, BarChart2, Shield, LogOut, Camera, Printer, Upload, Database, CameraOff, User, Eye, CircleX, Monitor, MessageCircle, Mail, Lock, Calendar, CheckCircle, BadgeCheck
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

  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'candidates' | 'monitor' | 'staff' | 'analytics' | 'center' | 'audit' | 'security'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [viewingSnaps, setViewingSnaps] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  const [newCandidate, setNewCandidate] = useState({ fullName: '', email: '', password: '', examNumber: '', pin: '', subjects: [] as string[], assignedIp: '', assignedSeatNumber: '', faceUrl: '', waecResultUrl: '' });
  const [newStaff, setNewStaff] = useState({ displayName: '', email: '', password: '', role: 'admin' as 'admin' | 'reg_admin' });
  const [newOfferedSubject, setNewOfferedSubject] = useState('');

  const [bulkSchedule, setBulkSchedule] = useState({ examVenue: '', examDate: '', examTime: '', examNumbers: [] as string[] });
  const [candidateFilter, setCandidateFilter] = useState('');

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
        toast.success("Subject Added to System");
        setNewOfferedSubject('');
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
        toast.success("Subject status updated");
        fetchOfferedSubjects();
      }
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const handleDeleteOfferedSubject = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subject from the system? This will not delete existing exams but will remove it from future registrations.")) return;
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
      toast.success("50 Seats Generated Successfully");
      fetchSeats();
    } catch (e) {
      toast.error("Seat generation failed");
    } finally {
      setLoading(false);
    }
  };

  const [releasingResults, setReleasingResults] = useState(false);

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
      toast.error("Network error during release");
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
      toast.success("Standard Subject Modules Initialized.");
      fetchExams();
    } catch (e) {
      toast.error("Seeding failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize payload: remove empty strings for dates so DB doesn't crash
    const payload: any = {
      ...newExam,
      createdBy: profile?.displayName || "Administrator",
      totalQuestions: 0
    };
    if (!payload.startTime) delete payload.startTime;
    if (!payload.endTime) delete payload.endTime;

    try {
      const res = await fetch(getApiUrl('/exams'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Exam Module Created Successfully");
        setNewExam({ title: '', subject: '', durationMinutes: 30, startTime: '', endTime: '' });
        fetchExams();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create module");
      }
    } catch (e) {
      toast.error("Network error while creating module");
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
      toast.success("Staff Registered Successfully");
      setNewStaff({ displayName: '', email: '', password: '', role: 'admin' });
      fetchStaff();
    } else {
      const data = await res.json();
      toast.error(data.message || "Failed to register staff");
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

  const isSuperAdmin = profile?.role === 'super_admin';
  const isRegStaff = profile?.role === 'reg_admin';
  const isFullAdmin = profile?.role === 'admin' || isSuperAdmin;

  const tabs = [
    { id: 'overview', label: 'Overview', roles: ['super_admin', 'admin'] },
    { id: 'candidates', label: 'Candidates', roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'subjects', label: 'Subjects', roles: ['super_admin', 'admin'] },
    { id: 'exams', label: 'Exams', roles: ['super_admin', 'admin'] },
    { id: 'results', label: 'Results', roles: ['super_admin', 'admin'] },
    { id: 'monitor', label: 'Monitor', roles: ['super_admin', 'admin'] },
    { id: 'analytics', label: 'Analytics', roles: ['super_admin', 'admin'] },
    { id: 'center', label: 'Center', roles: ['super_admin', 'admin'] },
    { id: 'chat', label: 'Support', roles: ['super_admin', 'admin'] },
    { id: 'staff', label: 'Staff', roles: ['super_admin'] },
    { id: 'security', label: 'Security', roles: ['super_admin'] },
  ];

  const filteredTabs = tabs.filter(t => t.roles.includes(profile?.role || ''));

  useEffect(() => {
    if (filteredTabs.length > 0 && !filteredTabs.find(t => t.id === activeTab)) {
      setActiveTab(filteredTabs[0].id as any);
    }
  }, [profile, activeTab, filteredTabs]);

  if (loading) return <div className="p-20 text-center font-black">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 uppercase relative">
      <header className="h-16 bg-white border-b-2 border-primary/10 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><Shield className="w-5 h-5" /></div>
            <h2 className="font-black tracking-tighter text-primary">ADMIN DASHBOARD</h2>
          </div>
          <div className="h-8 w-[1px] bg-primary/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-primary/40">
            <div className="relative">
              <Monitor className="w-6 h-6" />
              <User className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-primary/40 leading-none">{profile?.role?.replace('_', ' ')}</p>
            <p className="font-bold text-xs">{profile?.displayName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logOut?.(); navigate('/'); }} className="rounded-full text-slate-400 hover:text-primary"><LogOut className="w-4 h-4" /></Button>
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
                   <div className="flex gap-3">
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
                      <Button onClick={async () => {
                         if (confirm("CRITICAL ACTION: This will permanently delete all candidate examination data and attempts to reset the metrics. This cannot be undone. Proceed?")) {
                           const res = await fetch(getApiUrl('/analytics/reset'), {
                             method: 'POST',
                             headers: getHeaders()
                           });
                           if (res.ok) {
                             toast.success("System metrics reset successfully");
                             fetchAnalytics();
                             fetchAttempts();
                           } else {
                             toast.error("Failed to reset metrics");
                           }
                         }
                      }} variant="outline" className="h-10 border-2 border-rose-100 text-rose-500 font-black text-[10px] tracking-widest rounded-xl px-6 flex gap-2 hover:bg-rose-50">
                         <Trash2 className="w-4 h-4" /> RESET METRICS
                      </Button>
                   </div>
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

          {activeTab === 'subjects' && (
            <div className="space-y-8">
               <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black uppercase">Subject Management</h2>
                    <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest mt-1">Manage global subjects offered in the portal</p>
                  </div>
               </div>

               <div className="grid md:grid-cols-[350px_1fr] gap-8">
                  <Card className="p-8 rounded-[32px] border-2 bg-white h-fit">
                    <h3 className="text-xs font-black mb-6 uppercase">Register New Subject</h3>
                    <form onSubmit={handleCreateOfferedSubject} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Subject Name</Label>
                        <Input
                          placeholder="e.g. Mathematics"
                          value={newOfferedSubject}
                          onChange={e => setNewOfferedSubject(e.target.value)}
                          className="h-12 rounded-xl font-bold text-xs border-2 border-primary/5 focus:border-primary"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 bg-primary text-white font-black rounded-xl text-[10px] tracking-widest shadow-lg shadow-primary/20">
                         ADD TO SYSTEM
                      </Button>
                    </form>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offeredSubjects.map(s => (
                       <Card key={s.id} className="p-6 rounded-[24px] border-2 bg-white flex justify-between items-center group hover:border-primary/20 transition-all">
                          <div>
                             <h4 className="font-black text-sm uppercase">{s.name}</h4>
                             <p className={cn("text-[8px] font-black uppercase mt-1", s.isActive ? "text-emerald-500" : "text-rose-500")}>
                                {s.isActive ? "ACTIVE OFFER" : "DISABLED"}
                             </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" onClick={() => toggleSubjectStatus(s.id)} className={cn("h-8 w-8 rounded-lg", s.isActive ? "text-emerald-400 hover:text-emerald-600" : "text-slate-400")}>
                                <CheckCircle className="w-4 h-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteOfferedSubject(s.id)} className="h-8 w-8 text-rose-300 hover:text-rose-500 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                       </Card>
                    ))}
                    {offeredSubjects.length === 0 && (
                       <div className="col-span-full py-20 text-center opacity-10">
                          <BookOpen className="w-12 h-12 mx-auto mb-2" />
                          <p className="font-black text-sm uppercase tracking-widest">No subjects offered yet</p>
                       </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="grid md:grid-cols-[300px_1fr] gap-8">
              <aside className="space-y-4">
                <Card className="p-6 rounded-[24px] border-2">
                  <h3 className="text-xs font-black mb-4">NEW SUBJECT</h3>
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

                {exams.length === 0 && (
                  <Card className="p-6 rounded-[24px] border-2 border-dashed border-primary/20 bg-primary/5">
                    <div className="space-y-4 text-center">
                       <p className="text-[9px] font-black text-primary/60">SYSTEM EMPTY</p>
                       <Button onClick={seedBaseSubjects} variant="outline" className="w-full h-12 border-primary/20 text-primary font-black rounded-xl text-[10px]">
                          SEED DEFAULT SUBJECT
                       </Button>
                    </div>
                  </Card>
                )}

                <div className="space-y-2">
                  {exams.map(e => (
                    <div key={e.id} className="relative group">
                       <div className="flex gap-2">
                          <button onClick={() => setSelectedExamId(e.id)} className={cn("flex-1 text-left p-4 rounded-xl border-2 transition-all", selectedExamId === e.id ? "bg-primary text-white border-primary" : "bg-white border-primary/5 hover:border-primary/20")}>
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="font-black text-sm">{e.subject}</p>
                                  <p className="text-[10px] opacity-60">{e.title}</p>
                               </div>
                               <div className={cn("w-2 h-2 rounded-full", e.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                            </div>
                          </button>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleExamStatus(e)}
                              className={cn("h-[38px] w-10 rounded-xl border-2 transition-all", e.isActive ? "text-emerald-500 border-emerald-50 bg-emerald-50/20" : "text-slate-300 border-slate-50 bg-slate-50")}
                              title="Toggle Status"
                            >
                               <Shield className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (confirm(`DANGER: Permanently delete "${e.subject}" module and all its questions? This cannot be undone.`)) {
                                  try {
                                    const res = await fetch(getApiUrl(`/exams/${e.id}`), {
                                      method: 'DELETE',
                                      headers: getHeaders()
                                    });
                                    if (res.ok) {
                                      toast.success("Exam module deleted");
                                      if (selectedExamId === e.id) setSelectedExamId(null);
                                      fetchExams();
                                    }
                                  } catch (error) {
                                    toast.error("Failed to delete module");
                                  }
                                }
                              }}
                              className="h-[38px] w-10 rounded-xl border-2 border-rose-50 text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                              title="Delete Exam"
                            >
                               <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                       </div>
                    </div>
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
                           <textarea className="col-span-2 w-full h-24 p-4 rounded-xl border-2 border-primary/5 bg-slate-50 font-bold text-xs outline-none focus:ring-0 focus:border-primary" placeholder="QUESTION TEXT" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} required />
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

                          const aiPromise = async () => {
                             const res = await fetch(getApiUrl(`/exams/${selectedExamId}/ai-generate`), {
                                method: 'POST',
                                headers: getHeaders(),
                                body: JSON.stringify({ syllabus, count })
                             });
                             const data = await res.json();
                             if (!res.ok) throw new Error(data.message || data.error || "AI Generation failed");

                             // Refresh questions
                             const qRes = await fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() });
                             const qData = await qRes.json();
                             setQuestions(qData.questions || []);
                             return data.message || `Successfully generated ${data.questions?.length} questions`;
                          };

                          toast.promise(aiPromise(), {
                             loading: 'AI is analyzing syllabus and generating questions...',
                             success: (msg) => msg,
                             error: (err) => err.message
                          });
                       }} className="space-y-4">
                          <textarea name="syllabus" className="w-full h-24 p-4 rounded-xl border-2 border-primary/5 bg-white font-bold text-xs outline-none focus:ring-0 focus:border-primary" placeholder="Paste syllabus content here..." required />
                          <div className="flex gap-4">
                             <Input name="count" type="number" defaultValue="10" className="h-12 text-[10px] font-bold" />
                             <Button type="submit" className="flex-1 h-12 bg-primary text-white font-black rounded-xl">GENERATE</Button>
                          </div>
                       </form>
                    </Card>

                    <Card className="p-8 rounded-[32px] border-2 border-primary/10 bg-white shadow-xl">
                       <div className="flex justify-between items-center mb-6">
                          <div>
                             <h3 className="text-xs font-black uppercase tracking-widest">Bulk Question Upload</h3>
                             <p className="text-[8px] font-bold opacity-30 mt-1 uppercase">Upload questions via JSON file</p>
                          </div>
                          <Upload className="w-5 h-5 text-primary/20" />
                       </div>
                       <div className="relative">
                          <Input
                            type="file"
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
                                    toast.success("Questions Uploaded Successfully");
                                    fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() })
                                      .then(res => res.json())
                                      .then(data => setQuestions(data.questions || []));
                                  } else {
                                    toast.error("Upload failed.");
                                  }
                                } catch (err) {
                                  toast.error("Invalid JSON format.");
                                }
                              };
                              reader.readAsText(file);
                            }}
                            className="h-16 border-2 border-dashed border-primary/10 rounded-2xl pt-10 text-center text-[10px] font-black cursor-pointer"
                          />
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
                             <span className="text-[10px] font-black uppercase tracking-widest mt-6">Select JSON Data</span>
                          </div>
                       </div>
                    </Card>

                    <div className="bg-white rounded-[24px] border-2 border-primary/10 overflow-hidden shadow-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b-2 border-primary/5">
                          <tr className="text-[8px] font-black tracking-widest text-primary/40 uppercase">
                            <th className="px-6 py-4 w-12 text-center">#</th>
                            <th className="px-6 py-4">Examination Question</th>
                            <th className="px-6 py-4 w-40">Correct Answer</th>
                            <th className="px-6 py-4 w-16 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                          {questions.map((q, i) => (
                            <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 text-center font-black text-[9px] opacity-20">{i + 1}</td>
                              <td className="px-6 py-3">
                                <p className="font-bold text-[14px] text-slate-800 leading-relaxed max-w-lg">{q.text}</p>
                                <p className="text-[7px] font-black text-primary/30 uppercase tracking-widest mt-1">{q.topic}</p>
                              </td>
                              <td className="px-6 py-3">
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] inline-block">
                                  {q.options[q.correctOptionIndex]}
                                </Badge>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <Button variant="ghost" size="icon" onClick={async () => {
                                  if(confirm("Delete question?")) {
                                    await fetch(getApiUrl(`/exams/questions/${q.id}`), { method: 'DELETE', headers: getHeaders() });
                                    const qRes = await fetch(getApiUrl(`/exams/${selectedExamId}`), { headers: getHeaders() });
                                    const qData = await qRes.json();
                                    setQuestions(qData.questions || []);
                                  }
                                }} className="h-8 w-8 text-rose-300 hover:text-rose-500 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {questions.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-[10px] font-black opacity-10 uppercase tracking-[0.3em]">No questions saved.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-10 font-black">SELECT SUBJECT</div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black uppercase">Result Management</h2>
                  <Button
                    onClick={() => {
                      const unreleased = attempts.filter(a => a.status === 'completed' && !a.released).map(a => a.id);
                      handleReleaseResults(unreleased);
                    }}
                    disabled={releasingResults || attempts.filter(a => a.status === 'completed' && !a.released).length === 0}
                    className="h-12 px-8 bg-emerald-600 text-white font-black text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-emerald-700"
                  >
                    {releasingResults ? "RELEASING..." : "RELEASE ALL COMPLETED RESULTS"}
                  </Button>
               </div>

               <div className="bg-white rounded-[32px] border-2 border-primary/10 overflow-hidden shadow-xl">
                  <table className="w-full">
                     <thead className="bg-slate-50 border-b-2">
                        <tr className="text-left text-[10px] font-black tracking-widest opacity-40">
                           <th className="p-6">CANDIDATE</th>
                           <th className="p-6">EXAM</th>
                           <th className="p-6 text-center">SCORE</th>
                           <th className="p-6 text-center">STATUS</th>
                           <th className="p-6 text-right">ACTION</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {attempts.filter(a => a.status === 'completed').map(a => {
                          const candidate = candidates.find(c => c.examNumber === a.userId);
                          return (
                            <tr key={a.id} className="text-xs font-bold hover:bg-slate-50/50 transition-colors">
                               <td className="p-6">
                                  <p className="font-black">{candidate?.fullName || "UNKNOWN"}</p>
                                  <p className="text-[9px] opacity-30">{a.userId}</p>
                               </td>
                               <td className="p-6 uppercase">{a.examId}</td>
                               <td className="p-6 text-center font-black text-lg">
                                  {a.score} <span className="text-[10px] opacity-20">/ {a.totalPossible}</span>
                               </td>
                               <td className="p-6 text-center">
                                  <Badge className={cn("text-[8px] font-black border-none", a.released ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                                     {a.released ? "RELEASED" : "PENDING"}
                                  </Badge>
                               </td>
                               <td className="p-6 text-right">
                                  <div className="flex justify-end gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => navigate(`/result-slip/${a.userId}`)} className="h-10 w-10 text-primary/40 hover:text-primary hover:bg-primary/5 rounded-xl">
                                        <Eye className="w-4 h-4" />
                                     </Button>
                                     {!a.released && (
                                       <Button variant="ghost" size="icon" onClick={() => handleReleaseResults([a.id])} className="h-10 w-10 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl">
                                          <BadgeCheck className="w-4 h-4" />
                                       </Button>
                                     )}
                                  </div>
                               </td>
                            </tr>
                          );
                        })}
                        {attempts.filter(a => a.status === 'completed').length === 0 && (
                          <tr>
                             <td colSpan={5} className="p-20 text-center text-[10px] font-black opacity-20 uppercase tracking-[0.4em]">No results found.</td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-8">

              <div className="grid md:grid-cols-[350px_1fr] gap-8">
                <Card className="p-8 rounded-[32px] border-2 bg-white h-fit">
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Candidate Enrollment</h3>
                  </div>
                  <form onSubmit={handleCreateCandidate} className="space-y-4">
                    <div className="space-y-2 mb-6">
                       <p className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Biometric Capture</p>
                       <div className="flex justify-center">
                          {newCandidate.faceUrl ? (
                             <div className="relative group">
                                <img src={newCandidate.faceUrl} className="w-20 h-20 rounded-1xl object-cover border-4 border-primary shadow-lg" />
                                <button type="button" onClick={() => setNewCandidate({...newCandidate, faceUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5  shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-3 h-3" /></button>
                             </div>
                          ) : isCapturing ? (
                             <div className="space-y-3 text-center w-full">
                                <video ref={videoRef} autoPlay className="w-full aspect-video rounded-2xl bg-black object-cover border-2 border-primary/20" />
                                <Button type="button" onClick={capturePhoto} className="h-10 w-full bg-primary text-white font-black rounded-xl tracking-widest text-[10px]">VERIFY & CAPTURE</Button>
                             </div>
                          ) : (
                             <button type="button" onClick={startCapture} className="w-full h-20 rounded-1xl border-2  border-primary/20 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/[0.02] transition-all group">
                                <Camera className="w-8 h-8 text-primary/20 group-hover:text-primary group-hover:scale-110 transition-all" />
                                <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Capture</span>
                             </button>
                          )}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-1">
                          <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">1. Full Name</Label>
                          <Input placeholder="SURNAME FIRSTNAME" value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})} required className="h-12 text-[10px] font-bold" />
                       </div>

                       <div className="space-y-1">
                          <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">2. Portal Access (Email & Password)</Label>
                          <div className="grid gap-2">
                             <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/20 group-focus-within:text-primary transition-colors" />
                                <Input placeholder="EMAIL ADDRESS" type="email" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} required className="h-12 pl-10 text-[10px] font-bold" />
                             </div>
                             <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/20 group-focus-within:text-primary transition-colors" />
                                <Input placeholder="Password" type="password" value={newCandidate.password} onChange={e => setNewCandidate({...newCandidate, password: e.target.value})} required className="h-12 pl-10 text-[10px] font-bold" />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-1">
                          <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">3. System Identifier (Exam No & PIN)</Label>
                          <div className="p-3 bg-slate-50 rounded-xl border border-primary/5 space-y-2">
                             <Input placeholder="AUTO-GENERATE EXAM NO" value={newCandidate.examNumber} onChange={e => setNewCandidate({...newCandidate, examNumber: e.target.value})} className="h-10 text-[9px] font-bold bg-white" />
                             <Input placeholder="AUTO-GENERATE 6-DIGIT PIN" value={newCandidate.pin} onChange={e => setNewCandidate({...newCandidate, pin: e.target.value})} className="h-10 text-[9px] font-bold bg-white" />
                             <p className="text-[7px] font-bold opacity-30 text-center tracking-widest uppercase">Leave blank to auto-generate identifiers</p>
                          </div>
                       </div>

                       <div className="space-y-1">
                          <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">4. Supporting Documents (WAEC / NECO / NABTEB)</Label>
                          <Input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setNewCandidate({ ...newCandidate, waecResultUrl: ev.target?.result as string });
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="h-10 pt-2 text-[9px] font-bold border-dashed"
                          />
                       </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                      <p className="text-[9px] font-black opacity-30">SUBJECTS (MAX 4)</p>
                      {offeredSubjects.filter(s => s.isActive).map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={newCandidate.subjects.includes(s.name)} onChange={e => {
                            const subs = e.target.checked ? [...newCandidate.subjects, s.name] : newCandidate.subjects.filter(x => x !== s.name);
                            if (subs.length <= 4) setNewCandidate({...newCandidate, subjects: subs});
                          }} />
                          <span className="text-[10px] font-black">{s.name.toUpperCase()}</span>
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
               <div className="flex justify-between items-end">
                  <div>
                     <h2 className="text-1xl font-black">Exam Management</h2>
                     <p className="text-[10px] font-bold opacity-30">Venue & Capacity Management</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="p-4 bg-white rounded-2xl border-2 shadow-sm text-center min-w-[120px]">
                        <p className="text-[8px] font-black opacity-30 uppercase mb-1">TOTAL SEATS</p>
                        <p className="text-xl font-black">{seats.length}</p>
                     </div>
                     <div className="p-4 bg-white rounded-2xl border-2 shadow-sm text-center min-w-[120px]">
                        <p className="text-[8px] font-black opacity-30 uppercase mb-1">OCCUPIED</p>
                        <p className="text-xl font-black text-emerald-500">{seats.filter(s => s.status === 'occupied').length}</p>
                     </div>
                  </div>
               </div>

               <div className="grid md:grid-cols-[1fr_400px] gap-8">
                  {seats.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-20 border-2 border-dashed bg-slate-50 rounded-[40px] space-y-4 h-full">
                       <PlusCircle className="w-12 h-12 text-primary/10" />
                       <div className="text-center">
                          <p className="font-black text-primary/40 uppercase tracking-widest text-sm">No Seats Configured</p>
                          <p className="text-[10px] font-bold text-primary/20 uppercase mt-1">Initialize your exam hall architecture to monitor candidates</p>
                       </div>
                       <Button onClick={handleGenerateSeats} variant="outline" className="border-primary/20 text-primary font-black px-8 h-12 rounded-xl text-[10px] tracking-widest uppercase">
                          Initialize 50-Seat Hall
                       </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 bg-slate-100 p-8 rounded-[40px] border-2 border-white shadow-inner h-fit">
                       {seats.map(s => {
                          const activeAttempt = attempts.find(a => a.status === 'in-progress' && a.userId === s.assignedCandidateId);
                          const isFlagged = activeAttempt && (activeAttempt.trustScore || 100) < 70;
                          return (
                             <Card key={s.id} className={cn("aspect-square rounded-2xl border-2 flex flex-col items-center justify-center relative", s.status === 'occupied' ? (isFlagged ? "border-red-500 bg-red-50" : "border-emerald-500 bg-emerald-50") : "border-white bg-white/50")}>
                                <p className="text-[8px] font-black opacity-30 absolute top-2">No{s.seatNumber}</p>
                                {s.status === 'occupied' ? <User className={cn("w-6 h-6", isFlagged ? "text-red-500 animate-pulse" : "text-emerald-500")} /> : <PlusCircle className="w-4 h-4 text-slate-200" />}
                             </Card>
                          );
                       })}
                    </div>
                  )}

                  <aside className="space-y-6">
                     <Card className="p-8 rounded-[32px] border-2 bg-white shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                           <Calendar className="w-5 h-5 text-primary" />
                           <h3 className="text-xs font-black uppercase tracking-widest">Scheduling</h3>
                        </div>
                        <form onSubmit={handleBulkSchedule} className="space-y-6">
                           <div className="space-y-1">
                              <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">1. Examination Venue</Label>
                              <Input
                                 placeholder="e.g. VIVI MAIN HALL A"
                                 value={bulkSchedule.examVenue}
                                 onChange={e => setBulkSchedule({...bulkSchedule, examVenue: e.target.value})}
                                 className="h-12 text-[11px] font-bold"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">2. Exam Date</Label>
                                 <Input
                                    type="date"
                                    value={bulkSchedule.examDate}
                                    onChange={e => setBulkSchedule({...bulkSchedule, examDate: e.target.value})}
                                    className="h-12 text-[11px] font-bold"
                                 />
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">3. Exam Time</Label>
                                 <Input
                                    type="time"
                                    value={bulkSchedule.examTime}
                                    onChange={e => setBulkSchedule({...bulkSchedule, examTime: e.target.value})}
                                    className="h-12 text-[11px] font-bold"
                                 />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                 <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">4. Select Candidates ({bulkSchedule.examNumbers.length})</Label>
                                 <button type="button" onClick={() => setBulkSchedule({...bulkSchedule, examNumbers: candidates.map(c => c.examNumber)})} className="text-[8px] font-black text-primary hover:underline">SELECT ALL</button>
                              </div>

                              <div className="relative group">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/20 group-focus-within:text-primary transition-colors" />
                                 <Input
                                    placeholder="Search Exam No or Name..."
                                    value={candidateFilter}
                                    onChange={e => setCandidateFilter(e.target.value)}
                                    className="h-10 pl-9 text-[10px] font-bold bg-slate-50 border-none"
                                 />
                              </div>

                              <ScrollArea className="h-64 border-2 border-primary/5 rounded-2xl bg-slate-50 p-2">
                                 <div className="space-y-1">
                                    {candidates.filter(c =>
                                       c.examNumber.toLowerCase().includes(candidateFilter.toLowerCase()) ||
                                       c.fullName.toLowerCase().includes(candidateFilter.toLowerCase())
                                    ).map(c => (
                                       <button
                                          key={c.examNumber}
                                          type="button"
                                          onClick={() => {
                                             const exists = bulkSchedule.examNumbers.includes(c.examNumber);
                                             setBulkSchedule({
                                                ...bulkSchedule,
                                                examNumbers: exists
                                                   ? bulkSchedule.examNumbers.filter(id => id !== c.examNumber)
                                                   : [...bulkSchedule.examNumbers, c.examNumber]
                                             });
                                          }}
                                          className={cn(
                                             "w-full p-3 rounded-xl text-left border-2 transition-all flex justify-between items-center",
                                             bulkSchedule.examNumbers.includes(c.examNumber) ? "bg-primary border-primary text-white" : "bg-white border-transparent hover:border-primary/20"
                                          )}
                                       >
                                          <div className="min-w-0">
                                             <p className="text-[10px] font-black uppercase truncate">{c.fullName}</p>
                                             <p className={cn("text-[9px] font-black tracking-widest", bulkSchedule.examNumbers.includes(c.examNumber) ? "text-white" : "text-primary")}>{c.examNumber}</p>
                                          </div>
                                          {bulkSchedule.examNumbers.includes(c.examNumber) && <CheckCircle className="w-4 h-4 text-white" />}
                                       </button>
                                    ))}
                                    {candidates.length === 0 && <p className="text-center py-10 text-[10px] font-bold opacity-20">NO CANDIDATES FOUND</p>}
                                 </div>
                              </ScrollArea>
                           </div>

                           <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white font-black rounded-xl tracking-widest text-[10px] ">
                              {loading ? "PROCESSING..." : "SCHEDULE"}
                           </Button>
                        </form>
                     </Card>
                  </aside>
               </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="grid md:grid-cols-[300px_1fr] h-[70vh] gap-8 bg-white  border-2 border-primary/10 overflow-hidden shadow-2xl">
              <aside className="border-r-2 border-primary/5 flex flex-col">
                <div className="p-6  border-b-2 border-primary/5">
                  <h3 className="text-xs font-black uppercase tracking-widest">Active Chats</h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-2">
                    {/* Combine existing message participants with currently active attempts */}
                    {Array.from(new Set([
                      ...messages.map(m => m.from === 'admin' ? m.to : m.from),
                      ...attempts.filter(a => a.status === 'in-progress').map(a => a.userId)
                    ])).map(id => {
                      const lastMsg = [...messages].reverse().find(m => m.from === id || (m.from === 'admin' && m.to === id));
                      const isActiveAttempt = attempts.find(a => a.userId === id && a.status === 'in-progress');
                      const candidateName = candidates.find(c => c.examNumber === id)?.fullName;

                      return (
                        <button key={id} onClick={() => setActiveChatId(id)} className={cn(
                          "w-full p-4 rounded-2xl text-left border-2 transition-all relative group",
                          activeChatId === id ? "bg-primary text-white border-primary" : "bg-white border-primary/5 hover:border-primary/20"
                        )}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-black text-[10px] uppercase truncate flex-1">{candidateName || id}</p>
                            {isActiveAttempt && (
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            )}
                          </div>
                          <p className="text-[8px] font-bold opacity-30 mb-1">{id}</p>
                          <p className={cn("text-[9px] truncate", activeChatId === id ? "text-white/60" : "text-primary/40")}>
                            {lastMsg?.message || "Initiate support..."}
                          </p>
                        </button>
                      );
                    })}
                    {messages.length === 0 && attempts.filter(a => a.status === 'in-progress').length === 0 && (
                      <p className="text-center py-10 text-[10px] font-black opacity-40 uppercase tracking-widest">No candidates online</p>
                    )}
                  </div>
                </ScrollArea>
              </aside>

              <section className="flex flex-col">
                {activeChatId ? (
                  <>
                    <div className="p-6 border-b-2 border-primary/5 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h4 className="font-black text-sm uppercase">Conversation with {activeChatId}</h4>
                        <p className="text-[9px] font-bold text-emerald-500 animate-pulse">TERMINAL ACTIVE</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setActiveChatId(null)} className="h-10 w-10"><CircleX className="w-5 h-5" /></Button>
                    </div>
                    <ScrollArea className="flex-1 p-8">
                      <div className="space-y-4">
                        {messages.filter(m => m.from === activeChatId || (m.from === 'admin' && m.to === activeChatId)).map((m, i) => (
                          <div key={i} className={cn("flex flex-col", m.from === 'admin' ? "items-end" : "items-start")}>
                            <div className={cn(
                              "max-w-[70%] p-4 rounded-[20px] text-[12px] font-bold shadow-sm",
                              m.from === 'admin' ? "bg-primary text-white" : "bg-slate-100 text-primary"
                            )}>
                              {m.message}
                            </div>
                            <span className="text-[8px] font-black opacity-20 mt-1 uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>
                    <form onSubmit={sendChatMessage} className="p-6 border-t-2 border-primary/5 bg-slate-50/50 flex gap-4">
                      <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type response to candidate..."
                        className="h-14 rounded-2xl bg-white border-2 border-primary/5 focus:border-primary font-bold"
                      />
                      <Button type="submit" className="h-14 px-8 bg-primary text-white rounded-2xl font-black tracking-widest text-xs shadow-lg">SEND MESSAGE</Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-8">
                    <MessageCircle className="w-16 h-16 mb-4" />
                    <h3 className="text-1xl font-black text-blue">SUPPORT CENTER</h3>
                    <p className="max-w-xs font-bold text-xs mt-2">Select a candidate from the left to start real-time proctor communication.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'monitor' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-1xl font-black uppercase">Live Terminal Monitor</h2>
                  <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest mt-1">Real-time surveillance of active examination sessions</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px] px-4 py-2 rounded-xl animate-pulse">
                  {attempts.filter(a => a.status === 'in-progress').length} CANDIDATES ONLINE
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attempts.filter(a => a.status === 'in-progress').map(s => (
                  <Card key={s.id} className="p-6 rounded-[24px] border-2 bg-white flex flex-col gap-4 overflow-hidden relative shadow-lg hover:shadow-2xl transition-all">
                    <div className={cn("absolute top-0 right-0 left-0 h-1", (s.trustScore || 100) < 70 ? "bg-red-500" : "bg-emerald-500")} />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-tight">{s.userId}</h4>
                        <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest mt-0.5">Exam: {s.examId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-primary/30 uppercase">Integrity</p>
                        <p className={cn("font-black text-xl leading-none", (s.trustScore || 100) < 70 ? "text-red-500" : "text-emerald-500")}>{Math.round(s.trustScore || 100)}%</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                       <Button
                         onClick={() => setViewingSnaps(s.id)}
                         className="flex-1 h-10 rounded-xl border-2 border-primary/5 bg-slate-50 text-primary text-[10px] font-black uppercase hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                       >
                         <Camera className="w-4 h-4" /> View Snaps
                       </Button>
                       <Button
                         onClick={() => {
                            setActiveChatId(s.userId);
                            setActiveTab('chat');
                         }}
                         className="h-10 w-12 rounded-xl border-2 border-primary/5 bg-slate-50 text-primary hover:bg-primary/5 transition-all flex items-center justify-center"
                       >
                         <MessageCircle className="w-4 h-4" />
                       </Button>
                    </div>
                  </Card>
                ))}

                {attempts.filter(a => a.status === 'in-progress').length === 0 && (
                  <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[40px] border-1 border-primary/10">
                    <div className="w-11 h-11 bg-slate-50 rounded-full flex items-center justify-center">
                       <Monitor className="w-8 h-8 text-primary/10" />
                    </div>
                    <div>
                       <p className="font-black text-primary/40 uppercase tracking-widest">No Active Sessions</p>
                       <p className="text-[10px] font-bold text-primary/20 uppercase mt-1">There are no candidates currently writing an exam.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'staff' && isSuperAdmin && (
             <div className="grid md:grid-cols-[350px_1fr] gap-8">
                <Card className="p-8 rounded-[32px] border-2 bg-white h-fit">
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-black  tracking-widest">Staff Registration</h3>
                  </div>
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black opacity-30 tracking-widest ">Full Name</Label>
                      <Input
                        placeholder="Enter Full Name"
                        value={newStaff.displayName}
                        onChange={e => setNewStaff({...newStaff, displayName: e.target.value})}
                        required
                        className="h-12 text-[10px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black opacity-30 tracking-widest uppercase">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="Enter Email Address"
                        value={newStaff.email}
                        onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                        required
                        className="h-12 text-[10px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black opacity-30 tracking-widest ">Password</Label>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        value={newStaff.password}
                        onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                        required
                        className="h-12 text-[10px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black opacity-30 tracking-widest uppercase">System Role</Label>
                      <select
                        value={newStaff.role}
                        onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                        className="w-full h-12 px-4 rounded-xl border-2 border-primary/10 bg-slate-50 font-bold text-[10px] focus:border-primary outline-none focus:ring-0"
                      >
                        <option value="admin">Administrator</option>
                        <option value="reg_admin">Registry Officer</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full h-10 bg-primary text-white font-black rounded-xl tracking-widest text-[10px]">
                      Create  Account
                    </Button>
                  </form>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-2 px-2">Current Staff Directory</h3>
                  {staff.map(s => (
                    <Card key={s.id} className="p-6 rounded-2xl border-2 bg-white flex justify-between items-center group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center font-black text-primary/20 text-lg">{s.displayName.charAt(0)}</div>
                          <div>
                            <h4 className="font-black text-sm">{s.displayName}</h4>
                            <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">{s.role.replace('_', ' ')}</p>
                            <p className="text-[9px] font-medium opacity-20">{s.email}</p>
                          </div>
                        </div>
                        {s.role !== 'super_admin' && (
                          <Button variant="ghost" size="icon" onClick={async () => {
                            if(confirm("Revoke staff access?")) {
                                await fetch(getApiUrl(`/auth/staff/${s.id}`), { method: 'DELETE', headers: getHeaders() });
                                fetchStaff();
                            }
                          }} className="text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                    </Card>
                  ))}
                </div>
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
                <div className="flex justify-between items-end">
                   <div>
                      <h2 className="text-2xl font-black uppercase">Proctoring Intelligence</h2>
                      <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest mt-1">AI-Powered behavioral monitoring & identity verification</p>
                   </div>
                </div>

                <div className="bg-white rounded-[32px] border-2 border-primary/10 overflow-hidden shadow-xl">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b-2">
                         <tr className="text-[10px] font-black tracking-widest opacity-40 uppercase">
                            <th className="p-6">Candidate / Exam</th>
                            <th className="p-6 text-center">Trust Score</th>
                            <th className="p-6">Identity Status</th>
                            <th className="p-6">Primary Violation</th>
                            <th className="p-6 text-right">Evidence</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                         {attempts.filter(a => (a.violationLogs?.length || 0) > 0 || a.isIdentityVerified === false).map(a => {
                            const candidate = candidates.find(c => c.examNumber === a.userId);
                            const latestViolation = a.violationLogs && a.violationLogs.length > 0
                               ? a.violationLogs[a.violationLogs.length - 1].reason
                               : "N/A";

                            return (
                               <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-6">
                                     <p className="font-black text-xs uppercase">{candidate?.fullName || "UNKNOWN"}</p>
                                     <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">{a.userId} • {a.examId}</p>
                                  </td>
                                  <td className="p-6 text-center">
                                     <div className="inline-flex flex-col items-center">
                                        <span className={cn("text-lg font-black", a.trustScore < 70 ? "text-rose-500" : "text-emerald-500")}>
                                           {Math.round(a.trustScore || 0)}%
                                        </span>
                                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                           <div
                                              className={cn("h-full", a.trustScore < 70 ? "bg-rose-500" : "bg-emerald-500")}
                                              style={{ width: `${a.trustScore}%` }}
                                           />
                                        </div>
                                     </div>
                                  </td>
                                  <td className="p-6">
                                     {a.isIdentityVerified === false ? (
                                        <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[8px] py-1">IDENTITY MISMATCH</Badge>
                                     ) : (
                                        <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[8px] py-1">AUTHENTICATED</Badge>
                                     )}
                                  </td>
                                  <td className="p-6">
                                     <p className="text-[10px] font-bold text-slate-600 leading-tight max-w-xs">{latestViolation}</p>
                                     {a.violationLogs && a.violationLogs.length > 1 && (
                                        <p className="text-[8px] font-black text-rose-400 uppercase mt-1">+{a.violationLogs.length - 1} more incidents</p>
                                     )}
                                  </td>
                                  <td className="p-6 text-right">
                                     <div className="flex justify-end gap-2">
                                        <Button
                                           variant="ghost"
                                           size="icon"
                                           onClick={() => setViewingSnaps(a.id)}
                                           className="h-10 w-10 text-primary/40 hover:text-primary hover:bg-primary/5 rounded-xl"
                                           title="View Evidence"
                                        >
                                           <Camera className="w-4 h-4" />
                                        </Button>
                                        <Button
                                           variant="ghost"
                                           size="icon"
                                           onClick={async () => {
                                             if(confirm("Permanently delete this exam session/attempt? This action cannot be undone.")) {
                                               const res = await fetch(getApiUrl(`/exams/attempt/${a.id}`), {
                                                 method: 'DELETE',
                                                 headers: getHeaders()
                                               });
                                               if (res.ok) {
                                                 toast.success("Exam session deleted");
                                                 fetchAttempts();
                                               }
                                             }
                                           }}
                                           className="h-10 w-10 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                           title="Delete Session"
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </Button>
                                     </div>
                                  </td>
                               </tr>
                            );
                         })}
                         {attempts.filter(a => (a.violationLogs?.length || 0) > 0 || a.isIdentityVerified === false).length === 0 && (
                            <tr>
                               <td colSpan={5} className="p-20 text-center text-[10px] font-black opacity-10 uppercase tracking-[0.4em]">No security flags detected.</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
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
                <Button variant="ghost" onClick={() => setViewingSnaps(null)} className="text-white h-8 w-8"><CircleX className="w-5 h-5" /></Button>
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
