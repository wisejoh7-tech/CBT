import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import {
  Activity,
  HeartPulse,
  Send,
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { PhysioReferral } from './Doctors';

export default function Physiotherapy() {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<PhysioReferral[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('physioReferrals');
    if (stored) {
      try {
        setReferrals(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default sample referrals if none stored
      const initial: PhysioReferral[] = [
        {
          id: 'REF-104921',
          patientName: 'John Doe',
          patientId: 'PAT-4081',
          doctorName: 'Dr. Sarah Jenkins, MD',
          priority: 'Urgent',
          reason: 'Post-Op Knee Replacement Rehabilitation & Range of Motion Exercise',
          targetArea: 'Left Knee Joint & Quadriceps Strengthening',
          notes: 'Avoid heavy resistance for 2 weeks.',
          date: 'Oct 12, 2024',
          status: 'Pending'
        },
        {
          id: 'REF-104922',
          patientName: 'Mary Johnson',
          patientId: 'PAT-1102',
          doctorName: 'Dr. Amara Okafor',
          priority: 'Routine',
          reason: 'Chronic Lumbar Strain & Postural Realignment',
          targetArea: 'Lower Spine & Core Stability',
          notes: 'Focus on ergonomic stretching.',
          date: 'Oct 11, 2024',
          status: 'In Session'
        }
      ];
      setReferrals(initial);
      localStorage.setItem('physioReferrals', JSON.stringify(initial));
    }
  }, []);

  const updateStatus = (id: string, newStatus: 'Pending' | 'In Session' | 'Completed') => {
    const updated = referrals.map(ref => ref.id === id ? { ...ref, status: newStatus } : ref);
    setReferrals(updated);
    localStorage.setItem('physioReferrals', JSON.stringify(updated));
    toast.success(`Referral ${id} updated to ${newStatus}`);
  };

  const physioTeam = [
    { name: 'Dr. Marcus Vance, PT, DPT', title: 'Lead Physical Therapist', specialization: 'Sports Injury & Orthopedic Rehab', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Physio Hannah Wright', title: 'Senior Neuro-Rehab Specialist', specialization: 'Stroke & Post-Surgical Recovery', image: 'https://images.unsplash.com/photo-1594824813566-88855ce78341?q=80&w=1000&auto=format&fit=crop' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30 text-slate-900 font-sans relative antialiased">
      <div className="cbt-background" />

      {/* Header */}
      <header className="h-16 sm:h-20 bg-white border-b border-primary/10 px-6 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Physiotherapy & Rehabilitation Department</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Medicine, Kinesiology & Recovery</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/doctors')} variant="outline" className="text-xs font-bold border-emerald-500/30 text-emerald-700 hover:bg-emerald-50">
            &larr; Doctors Referrals
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 relative z-10">
        {/* Banner with Physiotherapist Picture */}
        <Card className="p-6 sm:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-teal-500/20 text-teal-300 border border-teal-400/30 font-black text-[10px] tracking-widest uppercase px-3 py-1">
                Rehabilitation & Recovery
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Physical Therapy & Post-Surgical Rehabilitation
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-xl">
                Our physical therapists restore mobility, alleviate pain, strengthen muscular support, and guide patients through custom therapeutic exercise regimens referred directly by doctors.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Dumbbell className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold">Targeted Physical Therapy</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold">Doctor-Referred Management</span>
                </div>
              </div>
            </div>

            {/* Physiotherapist Featured Picture */}
            <div className="relative group flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-teal-500/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000&auto=format&fit=crop"
                  alt="Physiotherapist Specialist"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="font-black text-sm text-white">Dr. Marcus Vance, PT, DPT</p>
                    <p className="text-[10px] text-teal-300 font-medium uppercase">Lead Physical Therapist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Physiotherapist Team */}
        <section className="space-y-4">
          <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" /> Physiotherapy Clinical Specialists
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {physioTeam.map((pt, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-primary/5 bg-white shadow-md flex items-center gap-4">
                <img src={pt.image} alt={pt.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{pt.name}</p>
                  <p className="text-xs font-medium text-slate-500">{pt.title}</p>
                  <Badge className="bg-teal-600 text-white text-[9px] mt-1">{pt.specialization}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Referred Patients Management Board */}
        <Card className="p-6 sm:p-8 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-lg text-slate-900">Referred Patients from Doctors</h3>
              </div>
              <p className="text-xs text-slate-500">Patients referred by attending doctors for physical therapy</p>
            </div>
            <Button onClick={() => navigate('/doctors')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10">
              + Refer New Patient (Doctor View)
            </Button>
          </div>

          {referrals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Activity className="w-12 h-12 mx-auto text-teal-300" />
              <p className="font-bold text-sm text-slate-600">No Patient Referrals Received</p>
              <p className="text-xs max-w-md mx-auto">When doctors refer patients to Physiotherapy from the Doctors Page, their referral details will automatically appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {referrals.map((ref) => (
                <div key={ref.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-base text-slate-900">{ref.patientName}</p>
                          <Badge variant="outline" className="text-[10px] font-bold border-slate-300 font-mono">{ref.patientId}</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-teal-700">Ref ID: {ref.id} • {ref.date}</p>
                      </div>
                      <Badge className={
                        ref.status === 'Completed' ? 'bg-emerald-500 text-white text-[10px]' :
                        ref.status === 'In Session' ? 'bg-sky-500 text-white text-[10px]' : 'bg-amber-500 text-white text-[10px]'
                      }>
                        {ref.status}
                      </Badge>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                      <p><span className="font-bold text-slate-500">Referring Doctor:</span> <span className="font-semibold text-slate-900">{ref.doctorName}</span></p>
                      <p><span className="font-bold text-slate-500">Priority Level:</span> <span className={ref.priority === 'Emergency' ? 'font-bold text-rose-600' : 'font-semibold text-slate-800'}>{ref.priority}</span></p>
                      <p><span className="font-bold text-slate-500">Target Area:</span> <span className="font-bold text-teal-700">{ref.targetArea}</span></p>
                      <p><span className="font-bold text-slate-500">Clinical Reason:</span> {ref.reason}</p>
                      {ref.notes && <p><span className="font-bold text-slate-500">Doctor Notes:</span> {ref.notes}</p>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Update Status:</span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(ref.id, 'Pending')}
                        className={`h-8 text-[10px] font-bold px-2.5 rounded-lg ${ref.status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}
                      >
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(ref.id, 'In Session')}
                        className={`h-8 text-[10px] font-bold px-2.5 rounded-lg ${ref.status === 'In Session' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'}`}
                      >
                        Start Therapy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(ref.id, 'Completed')}
                        className={`h-8 text-[10px] font-bold px-2.5 rounded-lg ${ref.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
