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
  Monitor,
  User,
  FileText,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Edit3,
  Save,
  X,
  School,
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
      const res = await fetch(getApiUrl('/candidate/dashboard'), { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setDashboardData(data.candidate);
        setAttempts(data.attempts || []);
        setEditEditForm(data.candidate);
      } else {
        toast.error(data.message || "Unauthorized access. Redirecting...");
        navigate('/candidate-login');
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/candidate/profile'), {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success("Profile updated successfully!");
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
    const url = type === 'schedule'
      ? `/exam-slip/${dashboardData?.examNumber}`
      : `/result-slip/${dashboardData?.examNumber}?attemptId=${attemptId}`;

    // In a real app, this might open a new tab or trigger a print view
    window.open(getApiUrl(`/candidate/print/${type}${attemptId ? `?attemptId=${attemptId}` : ''}`), '_blank');
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 uppercase relative">
      <div className="cbt-background opacity-[0.05]" />

      <header className="h-16 bg-white border-b-2 border-primary/10 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><GraduationCap className="w-5 h-5" /></div>
            <h1 className="font-black tracking-tighter text-primary">CANDIDATE PORTAL</h1>
          </div>
          <div className="h-8 w-[1px] bg-primary/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-primary/40">
            <Monitor className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Profile Management</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { logOut?.(); navigate('/'); }}><LogOut className="w-4 h-4" /></Button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6 relative z-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[32px] border-2 border-primary/10 bg-white shadow-2xl overflow-hidden">
            {/* Top Section: Candidate Profile / Edit Form */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 md:p-12"
                  >
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="w-24 h-24 rounded-[28px] bg-primary/2 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden bg-slate-100 relative shrink-0">
                        {dashboardData?.faceUrl ? (
                          <img src={dashboardData.faceUrl} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-primary/10" />
                        )}
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-none mb-2">{dashboardData?.fullName}</h2>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary text-white border-none px-3 py-1 font-black text-[10px]">EXAM NO: {dashboardData?.examNumber}</Badge>
                              <Badge variant="outline" className="border-primary/20 text-primary/60 px-3 py-1 font-black text-[10px]">
                                {dashboardData?.stateOfOrigin?.toUpperCase() || "STATE N/A"} / {dashboardData?.lga?.toUpperCase() || "LGA N/A"}
                              </Badge>
                            </div>
                          </div>
                          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="rounded-xl border-primary/10 hover:bg-primary/5 flex gap-2 text-[10px] font-black h-10 px-4">
                            <Edit3 className="w-3.5 h-3.5" /> EDIT PROFILE
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                          {/* Personal Information Table */}
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Identity Details</p>
                            <div className="overflow-hidden rounded-xl border-2 border-primary/5 shadow-sm">
                              <table className="w-full text-left text-[11px] font-black uppercase">
                                <tbody className="divide-y-2 divide-primary/5 bg-white">
                                  <tr className="hover:bg-primary/2 transition-colors">
                                    <td className="px-4 py-3 text-[9px] text-primary/40 bg-slate-50/50 w-28">Exam Number</td>
                                    <td className="px-4 py-3 text-primary font-black tracking-widest">{dashboardData?.examNumber || "N/A"}</td>
                                  </tr>
                                  <tr className="hover:bg-primary/2 transition-colors">
                                    <td className="px-4 py-3 text-[9px] text-primary/40 bg-slate-50/50">Full Name</td>
                                    <td className="px-4 py-3 text-slate-700 tracking-tight">{dashboardData?.fullName || "N/A"}</td>
                                  </tr>
                                  <tr className="hover:bg-primary/2 transition-colors">
                                    <td className="px-4 py-3 text-[9px] text-primary/40 bg-slate-50/50">State of Origin</td>
                                    <td className="px-4 py-3 text-slate-700 tracking-tight">{dashboardData?.stateOfOrigin || "N/A"}</td>
                                  </tr>
                                  <tr className="hover:bg-primary/2 transition-colors">
                                    <td className="px-4 py-3 text-[9px] text-primary/40 bg-slate-50/50">L.G.A</td>
                                    <td className="px-4 py-3 text-slate-700 tracking-tight">{dashboardData?.lga || "N/A"}</td>
                                  </tr>
                                  <tr className="hover:bg-primary/2 transition-colors">
                                    <td className="px-4 py-3 text-[9px] text-primary/40 bg-slate-50/50">Institution</td>
                                    <td className="px-4 py-3 text-slate-700 tracking-tight">{dashboardData?.schoolAttended || "N/A"}</td>
                                  </tr>
                                  <tr className="hover:bg-primary/2 transition-colors">
                                    <td className="px-4 py-3 text-[9px] text-primary/40 bg-slate-50/50">Residential</td>
                                    <td className="px-4 py-3 text-slate-700 tracking-tight normal-case font-bold">{dashboardData?.address || "N/A"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Subject Combination Table */}
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Subject Combination</p>
                            <div className="overflow-hidden rounded-xl border-2 border-primary/5 shadow-sm">
                              <table className="w-full text-left text-[11px] font-black uppercase">
                                <thead className="bg-slate-50 text-primary/40 border-b-2 border-primary/5">
                                  <tr>
                                    <th className="px-4 py-2.5 w-12 text-center text-[9px]">No</th>
                                    <th className="px-4 py-2.5 text-[9px]">Subject Name</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-primary/5 bg-white">
                                  {dashboardData?.subjectCombination?.map((s: string, idx: number) => (
                                    <tr key={s} className="hover:bg-primary/2 transition-colors">
                                      <td className="px-4 py-3 text-center text-primary/30 bg-slate-50/50">{idx + 1}</td>
                                      <td className="px-4 py-3 text-slate-700 tracking-tight">{s}</td>
                                    </tr>
                                  ))}
                                  {(!dashboardData?.subjectCombination || dashboardData.subjectCombination.length === 0) && (
                                    <tr>
                                      <td colSpan={2} className="px-4 py-12 text-center text-primary/20 italic font-black">No Records</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 md:p-12 bg-slate-50"
                  >
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><User className="w-5 h-5" /></div>
                          <h3 className="text-sm font-black tracking-[0.2em] text-primary uppercase">Identity Modification</h3>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl h-10 w-10 p-0"><X className="w-5 h-5" /></Button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Full Name</Label>
                          <Input value={editForm.fullName || ''} onChange={e => setEditEditForm({...editForm, fullName: e.target.value})} className="h-12 rounded-xl font-bold text-xs bg-white border-2 border-primary/5 focus:border-primary" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Phone Number</Label>
                          <Input value={editForm.phoneNumber || ''} onChange={e => setEditEditForm({...editForm, phoneNumber: e.target.value})} className="h-12 rounded-xl font-bold text-xs bg-white border-2 border-primary/5 focus:border-primary" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Date of Birth</Label>
                          <Input type="date" value={editForm.dateOfBirth || ''} onChange={e => setEditEditForm({...editForm, dateOfBirth: e.target.value})} className="h-12 rounded-xl font-bold text-xs bg-white border-2 border-primary/5 focus:border-primary" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">State of Origin</Label>
                          <select value={editForm.stateOfOrigin || ''} onChange={e => setEditEditForm({ ...editForm, stateOfOrigin: e.target.value, lga: '' })} className="w-full h-12 px-3 rounded-xl bg-white border-2 border-primary/5 focus:border-primary font-bold text-[10px]">
                            <option value="">SELECT STATE</option>
                            {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">LGA of Origin</Label>
                          <select value={editForm.lga || ''} onChange={e => setEditEditForm({ ...editForm, lga: e.target.value })} className="w-full h-12 px-3 rounded-xl bg-white border-2 border-primary/5 focus:border-primary font-bold text-[10px]" disabled={!editForm.stateOfOrigin}>
                            <option value="">SELECT LGA</option>
                            {editForm.stateOfOrigin && STATE_LGAS[editForm.stateOfOrigin]?.map(lga => <option key={lga} value={lga}>{lga.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">School Attended</Label>
                          <Input value={editForm.schoolAttended || ''} onChange={e => setEditEditForm({...editForm, schoolAttended: e.target.value})} className="h-12 rounded-xl font-bold text-xs bg-white border-2 border-primary/5 focus:border-primary" placeholder="Secondary School Name" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Residential Address</Label>
                        <Input value={editForm.address || ''} onChange={e => setEditEditForm({...editForm, address: e.target.value})} className="h-12 rounded-xl font-bold text-xs bg-white border-2 border-primary/5 focus:border-primary" placeholder="Your current home address" />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading} className="flex-1 h-14 bg-primary text-white rounded-xl font-black tracking-widest text-[11px] flex gap-2 shadow-xl shadow-primary/20">
                          <Save className="w-4 h-4" /> {loading ? "SAVING..." : "COMMIT CHANGES"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-14 rounded-xl font-black tracking-widest text-[11px] px-8">CANCEL</Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[2px] bg-primary/5 w-full" />

            {/* Bottom Section: Exam Data Grid */}
            <div className="grid md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-primary/5 bg-slate-50/20">
              {/* Scheduling Column */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-black tracking-tight text-xs uppercase">Exam Schedule</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-2xl border border-primary/5 flex items-center gap-4 shadow-sm">
                    <MapPin className="w-5 h-5 text-primary/20" />
                    <div>
                      <p className="text-[9px] font-black text-primary/30 uppercase">Venue</p>
                      <p className="font-black text-[12px]">{dashboardData?.examVenue || "NOT YET ASSIGNED"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-primary/5 flex items-center gap-4 shadow-sm">
                      <CalendarIcon className="w-5 h-5 text-primary/20" />
                      <div>
                        <p className="text-[9px] font-black text-primary/30 uppercase">Date</p>
                        <p className="font-black text-[12px]">{dashboardData?.examDate || "TBA"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-primary/5 flex items-center gap-4 shadow-sm">
                      <Clock className="w-5 h-5 text-primary/20" />
                      <div>
                        <p className="text-[9px] font-black text-primary/30 uppercase">Time</p>
                        <p className="font-black text-[12px]">{dashboardData?.examTime || "TBA"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handlePrint('schedule')}
                  className="mt-6 h-14 w-full bg-slate-900 text-white rounded-2xl font-black tracking-widest text-[11px] flex gap-3 hover:bg-black transition-all shadow-lg"
                >
                  <Printer className="w-4 h-4" /> PRINT EXAM SLIP
                </Button>
              </div>

              {/* Records Column */}
              <div className="p-8 bg-slate-100/30">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-black tracking-tight text-xs uppercase">Academic Records</h3>
                </div>

                <div className="space-y-3">
                  {attempts.length === 0 ? (
                    <div className="h-[124px] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border-2 border-dashed border-primary/10">
                      <FileText className="w-8 h-8 text-primary/10 mb-2" />
                      <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.1em]">No records found</p>
                    </div>
                  ) : (
                    attempts.map(attempt => (
                      <div key={attempt.id} className="p-4 bg-white border border-primary/5 rounded-2xl flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-[9px] font-black text-primary/30 uppercase">Session Result</p>
                          <p className="font-black text-lg">{attempt.isReleased ? `${attempt.score} / ${attempt.totalPossible}` : "PENDING"}</p>
                        </div>
                        {attempt.isReleased ? (
                          <Button size="icon" variant="ghost" onClick={() => handlePrint('result', attempt.id)} className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600">
                            <Printer className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] rounded-lg">PROCESSING</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <Button variant="outline" disabled={attempts.length === 0} className="mt-6 h-14 w-full border-2 border-primary/10 bg-white rounded-2xl font-black tracking-widest text-[11px] flex gap-3 text-primary/60">
                  <FileText className="w-4 h-4" /> PREVIOUS RESULTS
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
