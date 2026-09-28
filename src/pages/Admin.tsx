import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { 
  LogOut, Camera, Printer, Monitor, MessageCircle, Activity, ShieldAlert, Cpu, Menu, ArrowLeft, Send, Trash2, PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { cn } from '@/src/lib/utils/utils';
import { getApiUrl } from '@/src/lib/api-config';
import { useAdminData } from './useAdminData';

// Sub-components
import { Overview } from '../components/admin/Overview';
import { StudentRegistry } from '../components/admin/StudentRegistry';
import { ExamHall } from '../components/admin/ExamHall';
import { CurriculumManager } from '../components/admin/CurriculumManager';
import { ExamModules } from '../components/admin/ExamModules';
import { QuestionBank } from '../components/admin/QuestionBank';
import { ProctoringSecurity } from '../components/admin/ProctoringSecurity';
import { PersonnelManager } from '../components/admin/PersonnelManager';
import { AuditTrail } from '../components/admin/AuditTrail';
import { ResultsManager } from '../components/admin/ResultsManager';
import { PerformanceAnalytics } from '../components/admin/PerformanceAnalytics';

// Modals
import { AddExamModal } from '../components/admin/modals/AddExamModal';
import { AddQuestionModal } from '../components/admin/modals/AddQuestionModal';
import { AddSubjectModal } from '../components/admin/modals/AddSubjectModal';
import { AddCandidateModal } from '../components/admin/modals/AddCandidateModal';
import { AddStaffModal } from '../components/admin/modals/AddStaffModal';
import { EvidenceReviewModal } from '../components/admin/modals/EvidenceReviewModal';
import { EditCandidateModal } from '../components/admin/modals/EditCandidateModal';
import { BulkAssignModal } from '../components/admin/modals/BulkAssignModal';

// Icons
import { LayoutDashboard, Users, BookOpen, Shield, Award, TrendingUp } from 'lucide-react';

export default function Admin() {
  const { profile, logOut } = useAuth();
  const navigate = useNavigate();

  const {
    exams, selectedExamId, setSelectedExamId,
    questions, candidates, staff,
    attempts, offeredSubjects, analytics,
    seats, logs, loading, setLoading,
    getHeaders, fetchData, fetchQuestions, socket, setLogs
  } = useAdminData();

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this log entry?")) return;
    try {
      const res = await fetch(getApiUrl(`/analytics/logs/${id}`), {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Log entry removed");
        setLogs((prev: any[]) => prev.filter(l => l.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete log");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleClearAllLogs = async () => {
    if (!confirm("CRITICAL: This will permanently delete ALL system audit logs. Proceed?")) return;
    try {
      const res = await fetch(getApiUrl('/analytics/logs'), {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("All logs cleared");
        setLogs([]);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to clear logs");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewingSnaps, setViewingSnaps] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Biometrics logic for Admin side
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCapture = async () => {
    setIsCapturing(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam API unavailable.");
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
      console.warn("Admin camera error:", err);
      toast.error("Camera permission denied or camera unavailable.");
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
    setNewCandidate({ ...newCandidate, faceUrl: data });

    // Stop stream
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
    toast.success("Biometric Data Captured.");
  };

  // Form States
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  const [newExam, setNewExam] = useState({ title: '', subject: '', durationMinutes: 30 });
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0, topic: 'General' });

  const initialCandidateState = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    country: 'Nigeria',
    city: '',
    stateOfOrigin: '',
    lga: '',
    address: '',
    schoolAttended: '',
    waecResultUrl: '',
    subjectCombination: [] as string[],
    faceUrl: ''
  };

  const [newCandidate, setNewCandidate] = useState(initialCandidateState);
  const [newStaff, setNewStaff] = useState({ displayName: '', email: '', password: '', confirmPassword: '', role: 'admin' as 'admin' | 'reg_admin' });
  const [newOfferedSubject, setNewOfferedSubject] = useState('');

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

  const handleGenerateSeats = async () => {
    if (!confirm("Initialize 100 seats for the exam hall?")) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/center/seats/bulk'), {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 100 })
      });

      if (res.ok) {
        toast.success("Hall initialized with 100 seats");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Initialization failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error during initialization");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/exams'), {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newExam, createdBy: profile?.uid })
    });
    if (res.ok) { toast.success("Module created"); setShowAddExam(false); fetchData(); }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assessment? All associated questions will be removed.")) return;
    const res = await fetch(getApiUrl(`/exams/${id}`), { method: 'DELETE', headers: getHeaders() });
    if (res.ok) {
      toast.success("Assessment deleted");
      fetchData();
    } else {
      toast.error("Failed to delete assessment");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    const res = await fetch(getApiUrl(`/exams/${selectedExamId}/questions`), {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuestion)
    });
    if (res.ok) { toast.success("Question added"); setShowAddQuestion(false); fetchQuestions(selectedExamId); fetchData(); }
  };

  const toggleSubjectStatus = async (id: string) => {
    await fetch(getApiUrl(`/subjects/${id}`), { method: 'PUT', headers: getHeaders() });
    fetchData();
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject? This might affect existing exams.")) return;
    const res = await fetch(getApiUrl(`/subjects/${id}`), { method: 'DELETE', headers: getHeaders() });
    if (res.ok) {
      toast.success("Subject deleted");
      fetchData();
    } else {
      toast.error("Failed to delete subject");
    }
  };

  const handleCreateOfferedSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferedSubject.trim()) return;

    try {
      const res = await fetch(getApiUrl('/subjects'), {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOfferedSubject.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Subject added");
        setShowAddSubject(false);
        setNewOfferedSubject('');
        fetchData();
      } else {
        toast.error(data.message || "Failed to add subject");
      }
    } catch (err) {
      toast.error("Network error while adding subject");
    }
  };

  const toggleCandidateSubject = (s: string) => {
    const subject = s.trim();
    const exists = newCandidate.subjectCombination.includes(subject);
    if (exists) {
      setNewCandidate({ ...newCandidate, subjectCombination: newCandidate.subjectCombination.filter(x => x !== subject) });
    } else {
      if (newCandidate.subjectCombination.length < 4) {
        setNewCandidate({ ...newCandidate, subjectCombination: [...newCandidate.subjectCombination, subject] });
      }
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCandidate.password !== newCandidate.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!newCandidate.faceUrl) {
      toast.error("Biometric capture is required.");
      return;
    }
    if (newCandidate.subjectCombination.length < 4) {
      toast.error("Select exactly 4 subjects.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newCandidate.password)) {
      toast.error("Password must be at least 8 characters, include uppercase, lowercase, number and symbol.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...newCandidate, token: 'ADMIN_OVERRIDE' };
      // Remove empty scheduling fields to avoid DB validation errors
      if (!payload.examDate) delete (payload as any).examDate;
      if (!payload.examTime) delete (payload as any).examTime;

      const res = await fetch(getApiUrl('/auth/candidate/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("Candidate registered successfully");
        setShowAddCandidate(false);
        setNewCandidate(initialCandidateState);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Registration failed");
      }
    } catch (e) {
      toast.error("Network error during registration");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaff.password !== newStaff.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newStaff.password)) {
      toast.error("Password must be at least 8 characters, include uppercase, lowercase, number and symbol.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newStaff)
      });
      if (res.ok) {
        toast.success("Staff provisioned");
        setShowAddStaff(false);
        setNewStaff({ displayName: '', email: '', password: '', confirmPassword: '', role: 'admin' });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Staff registration failed");
      }
    } catch (e) {
      toast.error("Network error during registration");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/candidates/bulk-assign'), {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success("Assignment protocol complete");
        setShowBulkAssign(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Protocol failed");
      }
    } catch (e) {
      toast.error("Critical communication failure");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExamToAll = async (examId: string) => {
    if (!confirm("Push this assessment to all enrolled students?")) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/candidates/push-exam'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ examId })
      });
      if (res.ok) {
        toast.success("Exam pushed successfully");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to push exam");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    const res = await fetch(getApiUrl(`/candidates/${editingCandidate.examNumber}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(editingCandidate)
    });
    if (res.ok) {
      toast.success("Candidate updated");
      setEditingCandidate(null);
      fetchData();
    } else {
      toast.error("Update failed");
    }
  };

  const handleDeleteCandidate = async (examNumber: string) => {
    if (!confirm(`Permanently delete student ${examNumber}?`)) return;
    const res = await fetch(getApiUrl(`/candidates/${examNumber}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      toast.success("Candidate removed");
      fetchData();
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Revoke access for this staff?")) return;
    await fetch(getApiUrl(`/auth/staff/${id}`), { method: 'DELETE', headers: getHeaders() });
    fetchData();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedExamId) return;
    if (!confirm("Delete this assessment item?")) return;
    const res = await fetch(getApiUrl(`/exams/${selectedExamId}/questions/${questionId}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      toast.success("Question deleted");
      fetchQuestions(selectedExamId);
      fetchData();
    }
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

  const handleReleaseResult = async (id: string) => {
    if (!confirm("Release this result to the student's dashboard and dispatch notifications?")) return;
    try {
      const res = await fetch(getApiUrl(`/exams/attempts/${id}/release`), {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Result published and notifications sent");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Release failed");
      }
    } catch (e) {
      toast.error("Protocol failure");
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'enrollment', label: 'Candidates', icon: Users, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'hall', label: 'Exam Hall', icon: Monitor, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'results', label: 'Release Center', icon: Award, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'analytics', label: 'Analytics Performance', icon: TrendingUp, roles: ['super_admin', 'admin'] },
    { id: 'subjects', label: 'Curriculum', icon: BookOpen, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'modules', label: 'Exam Modules', icon: Activity, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'proctor', label: 'Security', icon: ShieldAlert, roles: ['super_admin', 'admin', 'reg_admin'] },
    { id: 'staff', label: 'Staff Administration', icon: Shield, roles: ['super_admin', 'admin'] },
    { id: 'audit', label: 'Audit', icon: Cpu, roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(m => m.roles.includes(profile?.role || ''));

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-primary">Loading...</div>;

  return (
    <div className="min-h-screen flex bg-slate-50/30 font-sans antialiased text-slate-900 overflow-hidden text-sm relative">
      <div className="cbt-background" />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative bg-white border-r border-primary/5 transition-all duration-300 z-[100] flex flex-col shrink-0 shadow-xl h-full",
          isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">V</div>
          {(isSidebarOpen) && <span className="font-black text-xl tracking-tighter text-primary whitespace-nowrap overflow-hidden">VIVI ADMIN</span>}
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-4">
            {filteredMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedExamId(null);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-300 group relative",
                  activeTab === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                {(isSidebarOpen) && <span className="text-[13px] font-bold tracking-wider truncate">{item.label}</span>}
                {activeTab === item.id && !isSidebarOpen && <div className="absolute right-0 w-1 h-6 bg-white rounded-l-full" />}
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-6 border-t border-primary/5">
          <button onClick={() => { logOut?.(); navigate('/'); }} className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-black text-[9px] tracking-widest">
            <LogOut className="w-4 h-4 shrink-0" />
            {(isSidebarOpen) && <span className="text-rose-500">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 w-full">
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-primary/5 px-4 md:px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-primary/40 hover:text-primary bg-primary/5 rounded-lg transition-colors"><Menu className="w-4 h-4" /></button>
            <h2 className="text-[10px] font-black tracking-widest text-primary/40 uppercase hidden sm:block">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-right">
             <div className="hidden xs:block">
               <p className="font-black text-[11px] leading-none mb-1 truncate max-w-[100px] sm:max-w-none">{profile?.displayName}</p>
               <p className="text-[8px] font-bold text-slate-400 uppercase">{profile?.role?.replace('_', ' ')}</p>
             </div>
             <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary/20 text-xs shadow-inner">
               {profile?.displayName?.charAt(0)}
             </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab + (selectedExamId || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                {activeTab === 'dashboard' && (
                  <Overview
                    candidatesCount={candidates.length}
                    examsCount={exams.length}
                    averageScore={analytics?.averageScore || 0}
                    attemptsCount={attempts.length}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'results' && (
                  <ResultsManager
                    attempts={attempts}
                    candidates={candidates}
                    handleReleaseResult={handleReleaseResult}
                    setViewingSnaps={setViewingSnaps}
                    fetchData={fetchData}
                  />
                )}

                {activeTab === 'analytics' && <PerformanceAnalytics />}

                {activeTab === 'enrollment' && (
                  <StudentRegistry
                    candidates={candidates}
                    setShowAddCandidate={setShowAddCandidate}
                    setEditingCandidate={setEditingCandidate}
                    handleDeleteCandidate={handleDeleteCandidate}
                    navigate={navigate}
                  />
                )}

                {activeTab === 'hall' && (
                  <ExamHall
                    seats={seats}
                    candidates={candidates}
                    exams={exams}
                    handleGenerateSeats={handleGenerateSeats}
                    setShowBulkAssign={setShowBulkAssign}
                    handleAssignExamToAll={handleAssignExamToAll}
                    setEditingCandidate={setEditingCandidate}
                  />
                )}

                {activeTab === 'subjects' && (
                  <CurriculumManager
                    offeredSubjects={offeredSubjects}
                    setShowAddSubject={setShowAddSubject}
                    toggleSubjectStatus={toggleSubjectStatus}
                    handleDeleteSubject={handleDeleteSubject}
                  />
                )}

                {activeTab === 'modules' && (
                  <ExamModules
                    exams={exams}
                    setShowAddExam={setShowAddExam}
                    setActiveTab={setActiveTab}
                    setSelectedExamId={setSelectedExamId}
                    handleDeleteExam={handleDeleteExam}
                  />
                )}

                {activeTab === 'questions' && selectedExamId && (
                  <QuestionBank
                    exams={exams}
                    selectedExamId={selectedExamId}
                    questions={questions}
                    setActiveTab={setActiveTab}
                    setShowAddQuestion={setShowAddQuestion}
                    handleDeleteQuestion={handleDeleteQuestion}
                  />
                )}

                {activeTab === 'proctor' && (
                  <ProctoringSecurity
                    attempts={attempts}
                    candidates={candidates}
                    activeChatId={activeChatId}
                    messages={messages}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    setActiveChatId={setActiveChatId}
                    setViewingSnaps={setViewingSnaps}
                    sendChatMessage={sendChatMessage}
                    chatEndRef={chatEndRef}
                  />
                )}

                {activeTab === 'staff' && (
                  <PersonnelManager
                    staff={staff}
                    setShowAddStaff={setShowAddStaff}
                    handleDeleteStaff={handleDeleteStaff}
                  />
                )}

                {activeTab === 'audit' && (
                  <AuditTrail
                    logs={logs}
                    handleDeleteLog={handleDeleteLog}
                    handleClearAllLogs={handleClearAllLogs}
                  />
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showAddExam && (
          <AddExamModal
            isOpen={showAddExam}
            onClose={() => setShowAddExam(false)}
            newExam={newExam}
            setNewExam={setNewExam}
            offeredSubjects={offeredSubjects}
            handleCreateExam={handleCreateExam}
          />
        )}
        {showAddQuestion && (
          <AddQuestionModal
            isOpen={showAddQuestion}
            onClose={() => setShowAddQuestion(false)}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            handleAddQuestion={handleAddQuestion}
          />
        )}
        {showAddSubject && (
          <AddSubjectModal
            isOpen={showAddSubject}
            onClose={() => setShowAddSubject(false)}
            newOfferedSubject={newOfferedSubject}
            setNewOfferedSubject={setNewOfferedSubject}
            handleCreateOfferedSubject={handleCreateOfferedSubject}
          />
        )}
        {showAddCandidate && (
          <AddCandidateModal
            isOpen={showAddCandidate}
            onClose={() => setShowAddCandidate(false)}
            newCandidate={newCandidate}
            setNewCandidate={setNewCandidate}
            offeredSubjects={offeredSubjects}
            toggleCandidateSubject={toggleCandidateSubject}
            isCapturing={isCapturing}
            videoRef={videoRef}
            startCapture={startCapture}
            capturePhoto={capturePhoto}
            handleCreateCandidate={handleCreateCandidate}
          />
        )}
        {showAddStaff && (
          <AddStaffModal
            isOpen={showAddStaff}
            onClose={() => setShowAddStaff(false)}
            newStaff={newStaff}
            setNewStaff={setNewStaff}
            handleCreateStaff={handleCreateStaff}
          />
        )}
        {viewingSnaps && (
          <EvidenceReviewModal
            isOpen={!!viewingSnaps}
            onClose={() => setViewingSnaps(null)}
            attemptId={viewingSnaps}
            attempts={attempts}
          />
        )}
        {editingCandidate && (
          <EditCandidateModal
            isOpen={!!editingCandidate}
            onClose={() => setEditingCandidate(null)}
            candidate={editingCandidate}
            handleUpdateCandidate={handleUpdateCandidate}
            setEditingCandidate={setEditingCandidate}
          />
        )}
        {showBulkAssign && (
          <BulkAssignModal
            isOpen={showBulkAssign}
            onClose={() => setShowBulkAssign(false)}
            candidates={candidates}
            handleBulkAssign={handleBulkAssign}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
