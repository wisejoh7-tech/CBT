import { useEffect, useState, useCallback } from 'react';
import { Attempt } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import {
  LogOut,
  GraduationCap,
  Printer,
  Award,
  User,
  FileText,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Edit3,
  Save,
  X,
  Home as HomeIcon,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/lib/ui/badge';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';
import { NIGERIAN_STATES, STATE_LGAS } from '@/src/lib/constants/nigeria-data';

export default function CandidateDashboard() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditEditForm] = useState<any>({});
  const { profile, logOut } = useAuth();
  const navigate = useNavigate();

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/candidates/dashboard'), { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.candidate) {
        setDashboardData(data.candidate);
        setAttempts(data.attempts || []);
        setEditEditForm(data.candidate);
      } else {
        toast.error("Session expired.");
        navigate('/candidate-login');
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [getHeaders, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/candidates/profile'), {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success("Profile Updated");
        setIsEditing(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (type: 'schedule' | 'result', attemptId?: string) => {
    if (type === 'schedule') {
      window.open(`/exam-slip/${dashboardData?.examNumber}`, '_blank');
    } else {
      window.open(`/result-slip/${dashboardData?.examNumber}?attemptId=${attemptId}`, '_blank');
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-primary tracking-widest">Loading Portal...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/20 font-sans relative antialiased tracking-tight text-sm sm:text-base">
      <div className="cbt-background" />

      {/* Header */}
      <header className="h-16 sm:h-20 bg-white border-b border-primary/5 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20"><GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <h1 className="font-black text-base sm:text-lg tracking-tighter text-primary truncate max-w-[120px] sm:max-w-none">Portal</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <button onClick={() => navigate('/')} className="text-[10px] sm:text-[12px] font-black text-primary/40 hover:text-primary transition-colors flex items-center gap-1.5 sm:gap-2 tracking-widest">
            <HomeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">HOME</span>
          </button>
          <div className="h-6 w-[1px] bg-primary/10" />
          <Button variant="ghost" size="icon" onClick={() => { logOut?.(); navigate('/'); }} className="text-primary/40 hover:text-rose-500 hover:bg-rose-50 h-9 w-9 sm:h-10 sm:w-10 rounded-xl transition-all"><LogOut className="w-4 h-4 sm:w-5 h-5" /></Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Main Action Card */}
          <Card className="p-6 sm:p-8 bg-primary text-white rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-primary/20 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 border-none overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-20 h-20g bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-colors" />
             <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full md:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm shrink-0">
                   <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="space-y-1 min-w-0">
                   <h3 className="text-lg sm:text-xl font-black tracking-tight leading-none truncate">
                     {dashboardData?.assignedExamId ? "Active Assessment" : "Ready for Exam?"}
                   </h3>
                   <p className="text-[10px] sm:text-[11px] font-medium text-white/60 tracking-wide uppercase line-clamp-2">
                     {dashboardData?.assignedExamId
                       ? "Assessment has been initiated on your terminal."
                       : "Proceed to terminal to begin session."}
                   </p>
                </div>
             </div>
             <Button
               onClick={() => navigate(dashboardData?.assignedExamId ? `/instructions/${dashboardData.assignedExamId}` : '/instructions/unified')}
               className="h-12 sm:h-14 w-full md:w-auto px-8 sm:px-10 bg-white text-primary rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] tracking-widest shadow-xl active:scale-95 transition-all hover:bg-slate-50 border-none shrink-0"
             >
               {dashboardData?.assignedExamId ? "START ASSIGNED EXAM" : "Start Exam"}
             </Button>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* Left: Profile Info */}
            <Card className="rounded-[28px] sm:rounded-[32px] border border-primary/5 bg-white shadow-xl overflow-hidden">
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-10">
                    <div className="flex flex-col xs:flex-row gap-6 sm:gap-8 items-center sm:items-start mb-8 sm:mb-10">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] sm:rounded-3xl bg-slate-50 border border-primary/5 shadow-inner flex items-center justify-center overflow-hidden shrink-0 relative">
                        {dashboardData?.faceUrl ? (
                          <img src={dashboardData.faceUrl} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary/10" />
                        )}
                      </div>
                      <div className="flex-1 space-y-3 sm:space-y-4 text-center xs:text-left w-full">
                        <div className="flex flex-col xs:flex-row justify-between items-center xs:items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 leading-none mb-2 truncate">{dashboardData?.fullName}</h2>
                            <div className="flex flex-wrap justify-center xs:justify-start gap-2">
                              <Badge className="bg-primary text-white border-none px-2 sm:px-3 py-0.5 sm:py-1 font-black text-[9px] sm:text-[10px] tracking-wider shrink-0">NO: {dashboardData?.examNumber}</Badge>
                              <Badge variant="outline" className="border-primary/10 text-primary/40 px-2 sm:px-3 py-0.5 sm:py-1 font-black text-[9px] sm:text-[10px] tracking-wider truncate">
                                {dashboardData?.stateOfOrigin || "N/A"} • {dashboardData?.lga || "LGA"}
                              </Badge>
                            </div>
                          </div>
                          <button onClick={() => setIsEditing(true)} className="p-2 sm:p-2.5 text-primary/20 hover:text-primary hover:bg-primary/5 transition-all rounded-xl border border-transparent hover:border-primary/5 shrink-0">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:gap-8">
                       <div className="space-y-4">
                          <p className="text-[9px] sm:text-[10px] font-black text-primary/20 tracking-[0.25em] uppercase">Biographic Profile</p>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-y-4 xs:gap-y-6 gap-x-8">
                             {[
                               { label: 'Institution', value: dashboardData?.schoolAttended },
                               { label: 'Date of Birth', value: dashboardData?.dateOfBirth },
                               { label: 'Phone', value: dashboardData?.phoneNumber },
                               { label: 'Residential', value: dashboardData?.address },
                             ].map((item) => (
                               <div key={item.label} className="space-y-1">
                                  <p className="text-[8px] sm:text-[9px] font-black text-primary/40 tracking-widest uppercase">{item.label}</p>
                                  <p className="text-[12px] sm:text-[13px] font-bold text-slate-700 truncate">{item.value || 'N/A'}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <p className="text-[9px] sm:text-[10px] font-black text-primary/20 tracking-[0.25em] uppercase">Curriculum Selection</p>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                             {dashboardData?.subjectCombination?.map((s: string) => (
                               <div key={s} className="px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-primary/5 font-black text-[10px] sm:text-[11px] text-primary/60 tracking-wider shadow-sm">
                                  {s}
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="edit" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="p-6 sm:p-10 bg-slate-50/50">
                    <form onSubmit={handleUpdateProfile} className="space-y-5 sm:space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[12px] sm:text-sm font-black text-primary tracking-widest uppercase">Update Information</h3>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full h-8 w-8 transition-colors"><X className="w-4 h-4" /></Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="space-y-1.5">
                          <Label className="text-[8px] sm:text-[9px] font-black text-primary/40 ml-1 uppercase">Full Name</Label>
                          <Input value={editForm.fullName || ''} onChange={e => setEditEditForm({...editForm, fullName: e.target.value})} className="h-10 sm:h-11 rounded-xl font-bold text-sm bg-white border-primary/5" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] sm:text-[9px] font-black text-primary/40 ml-1 uppercase">Phone Number</Label>
                          <Input value={editForm.phoneNumber || ''} onChange={e => setEditEditForm({...editForm, phoneNumber: e.target.value})} className="h-10 sm:h-11 rounded-xl font-bold text-sm bg-white border-primary/5" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] sm:text-[9px] font-black text-primary/40 ml-1 uppercase">State</Label>
                          <select value={editForm.stateOfOrigin || ''} onChange={e => setEditEditForm({ ...editForm, stateOfOrigin: e.target.value, lga: '' })} className="w-full h-10 sm:h-11 px-3 rounded-xl bg-white border border-primary/5 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/10">
                            <option value="">Select State</option>
                            {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] sm:text-[9px] font-black text-primary/40 ml-1 uppercase">L.G.A</Label>
                          <select value={editForm.lga || ''} onChange={e => setEditEditForm({ ...editForm, lga: e.target.value })} className="w-full h-10 sm:h-11 px-3 rounded-xl bg-white border border-primary/5 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/10" disabled={!editForm.stateOfOrigin}>
                            <option value="">Select LGA</option>
                            {editForm.stateOfOrigin && STATE_LGAS[editForm.stateOfOrigin]?.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[8px] sm:text-[9px] font-black text-primary/40 ml-1 uppercase">Residential Address</Label>
                        <Input value={editForm.address || ''} onChange={e => setEditEditForm({...editForm, address: e.target.value})} className="h-10 sm:h-11 rounded-xl font-bold text-sm bg-white border-primary/5" />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="submit" disabled={loading} className="flex-1 h-12 bg-primary text-white rounded-xl font-black text-[10px] sm:text-[11px] tracking-widest shadow-lg shadow-primary/20">
                          {loading ? "SAVING..." : "Save Changes"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 px-8 rounded-xl font-black text-[10px] sm:text-[11px] border-primary/10 transition-colors">Cancel</Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Right: Records & Schedule */}
            <div className="space-y-6">
              {/* Schedule Card */}
              <Card className="p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] border border-primary/5 bg-white shadow-xl">
                 <div className="flex items-center gap-3 mb-6 sm:mb-8">
                   <CalendarIcon className="w-5 h-5 text-primary/40" />
                   <h3 className="font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase">Exam Schedule</h3>
                 </div>

                 <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-1 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-primary/5">
                       <p className="text-[8px] sm:text-[9px] font-black text-primary/20 tracking-widest flex items-center gap-2 uppercase"><MapPin className="w-3 h-3" /> Venue</p>
                       <p className="font-black text-[12px] sm:text-[13px] text-primary/80 truncate uppercase">{dashboardData?.examVenue || "TO BE ASSIGNED"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                       <div className="space-y-1 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-primary/5">
                          <p className="text-[8px] sm:text-[9px] font-black text-primary/20 tracking-widest flex items-center gap-2 uppercase"><CalendarIcon className="w-3 h-3" /> Date</p>
                          <p className="font-black text-[12px] sm:text-[13px] text-primary/80 uppercase">{dashboardData?.examDate || "TBA"}</p>
                       </div>
                       <div className="space-y-1 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-primary/5">
                          <p className="text-[8px] sm:text-[9px] font-black text-primary/20 tracking-widest flex items-center gap-2 uppercase"><Clock className="w-3 h-3" /> Time</p>
                          <p className="font-black text-[12px] sm:text-[13px] text-primary/80 uppercase">{dashboardData?.examTime || "TBA"}</p>
                       </div>
                    </div>
                 </div>

                 <Button
                   onClick={() => handlePrint('schedule')}
                   className="mt-8 sm:mt-10 h-12 sm:h-14 w-full bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] tracking-widest flex gap-2 sm:gap-3 hover:bg-black shadow-lg transition-all active:scale-[0.98]"
                 >
                   <Printer className="w-4 h-4" /> PRINT EXAM SLIP
                 </Button>
              </Card>

              {/* Result Record */}
              <Card className="p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] border border-primary/5 bg-slate-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
                <div className="flex items-center gap-3 mb-6 sm:mb-8 relative z-10">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase">Academic Records</h3>
                </div>

                <div className="space-y-3 relative z-10">
                  {attempts.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-2xl">
                      <FileText className="w-6 h-6 text-white/10 mb-2" />
                      <p className="text-[8px] sm:text-[9px] font-black text-white/20 tracking-widest uppercase">No results yet</p>
                    </div>
                  ) : (
                    attempts.map(attempt => (
                      <div key={attempt.id} className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl flex justify-between items-center shadow-inner hover:bg-white/10 transition-all group">
                        <div className="min-w-0 flex-1">
                          <p className="text-[7px] sm:text-[8px] font-black text-white/30 tracking-widest uppercase">Session Score</p>
                          <p className="font-black text-lg sm:text-xl truncate">{attempt.isReleased ? `${attempt.score} / ${attempt.totalPossible}` : "PENDING"}</p>
                        </div>
                        {attempt.isReleased ? (
                          <button onClick={() => handlePrint('result', attempt.id)} className="p-2 sm:p-2.5 bg-emerald-500 rounded-xl hover:scale-110 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20">
                            <Printer className="w-3.5 h-3.5 sm:w-4 h-4 text-white" />
                          </button>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-none font-black text-[7px] sm:text-[8px] px-2 py-1 uppercase tracking-widest">Processing</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 sm:py-12 text-center bg-white border-t border-primary/5">
        <p className="text-[8px] sm:text-[10px] font-bold text-primary/10 tracking-[0.3em] uppercase px-4">&copy; {new Date().getFullYear()} VIVI CBT SYSTEMS • Secure Registration Portal</p>
      </footer>
    </div>
  );
}
