import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import {
  Stethoscope,
  UserCheck,
  Calendar,
  Clock,
  Send,
  Activity,
  FileText,
  Search,
  ArrowLeft,
  CheckCircle2,
  Users,
  ShieldCheck
} from 'lucide-react';

export interface PhysioReferral {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
  reason: string;
  targetArea: string;
  notes: string;
  date: string;
  status: 'Pending' | 'In Session' | 'Completed';
}

export default function Doctors() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState<PhysioReferral[]>([]);

  // Referral Form State
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Sarah Jenkins, MD');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const [reason, setReason] = useState('');
  const [targetArea, setTargetArea] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('physioReferrals');
    if (stored) {
      try {
        setReferrals(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleReferPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !reason.trim()) {
      toast.error("Please enter patient name and referral reason.");
      return;
    }

    const newReferral: PhysioReferral = {
      id: `REF-${Date.now().toString().slice(-6)}`,
      patientName: patientName.trim(),
      patientId: patientId.trim() || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: doctorName.trim(),
      priority,
      reason: reason.trim(),
      targetArea: targetArea.trim() || 'General Rehabilitation',
      notes: notes.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending'
    };

    const updated = [newReferral, ...referrals];
    setReferrals(updated);
    localStorage.setItem('physioReferrals', JSON.stringify(updated));

    toast.success(`Referral submitted for ${patientName} to Physiotherapy!`);
    setPatientName('');
    setPatientId('');
    setReason('');
    setTargetArea('');
    setNotes('');
  };

  const doctorsList = [
    { name: 'Dr. Sarah Jenkins', title: 'Consultant Cardiologist', department: 'Cardiology', availability: 'On Duty', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Dr. Michael Chen', title: 'Senior Neurologist', department: 'Neurology', availability: 'In Surgery', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Dr. Amara Okafor', title: 'Orthopedic Surgeon', department: 'Orthopedics', availability: 'On Duty', image: 'https://images.unsplash.com/photo-1594824813566-88855ce78341?q=80&w=1000&auto=format&fit=crop' }
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
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Doctors Department</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Consultations & Referrals</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/physiotherapy')} variant="outline" className="text-xs font-bold border-primary/20 hover:bg-primary/5">
            Physiotherapy View &rarr;
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 relative z-10">
        {/* Banner Section with Doctor Picture */}
        <Card className="p-6 sm:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black text-[10px] tracking-widest uppercase px-3 py-1">
                Clinical Excellence
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Physician Consultation & Multi-Disciplinary Referrals
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
                Our medical officers evaluate, diagnose, and prescribe tailored treatment plans. Physicians can seamlessly refer patients to physical therapy for specialized rehabilitation.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">18 Specialist Physicians</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Direct Physiotherapy Link</span>
                </div>
              </div>
            </div>

            {/* Doctor Featured Picture */}
            <div className="relative group flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-emerald-500/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000&auto=format&fit=crop"
                  alt="Doctor Specialist"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="font-black text-sm text-white">Dr. Sarah Jenkins, MD</p>
                    <p className="text-[10px] text-emerald-300 font-medium uppercase">Head of Clinical Care</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Doctors Roster Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Attending Physicians
            </h3>
            <span className="text-xs font-bold text-slate-400">3 Doctors On Shift</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctorsList.map((doc, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-primary/5 bg-white shadow-md hover:shadow-lg transition-all flex items-center gap-4">
                <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{doc.name}</p>
                  <p className="text-xs font-medium text-slate-500">{doc.title}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[9px] font-bold border-slate-200">{doc.department}</Badge>
                    <Badge className={doc.availability === 'On Duty' ? 'bg-emerald-500 text-white text-[9px]' : 'bg-amber-500 text-white text-[9px]'}>
                      {doc.availability}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Doctor to Physiotherapist Referral Form & Active Referrals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Refer Patient Form */}
          <Card className="p-6 sm:p-8 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Refer Patient to Physiotherapist</h3>
                <p className="text-xs text-slate-500">Initiate physical therapy and rehabilitation request</p>
              </div>
            </div>

            <form onSubmit={handleReferPatient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-slate-600">Patient Full Name *</Label>
                  <Input
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-slate-600">Patient ID (Optional)</Label>
                  <Input
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    placeholder="e.g. PAT-4081"
                    className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-slate-600">Referring Physician</Label>
                  <Input
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-slate-600">Priority Level</Label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-600">Target Body Area / Focus</Label>
                <Input
                  value={targetArea}
                  onChange={e => setTargetArea(e.target.value)}
                  placeholder="e.g. Lower Back, Post-Op Knee, Shoulder Mobility"
                  className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-600">Clinical Reason & Diagnosis *</Label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe patient condition, reason for physical therapy..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-600">Special Instructions / Notes</Label>
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Avoid weight bearing for 2 weeks"
                  className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                />
              </div>

              <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs tracking-wider shadow-lg">
                <Send className="w-4 h-4 mr-2" /> SUBMIT PHYSIOTHERAPY REFERRAL
              </Button>
            </form>
          </Card>

          {/* Submitted Referrals Log */}
          <Card className="p-6 sm:p-8 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">Physiotherapy Referrals Log</h3>
                <p className="text-xs text-slate-500">Track status of referred patients</p>
              </div>
              <Badge className="bg-slate-900 text-white font-black text-xs px-3 py-1">
                {referrals.length} Total
              </Badge>
            </div>

            {referrals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Activity className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-xs text-slate-500">No Referrals Sent Yet</p>
                <p className="text-[11px]">Fill out the form on the left to refer a patient to the Physiotherapy department.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {referrals.map((ref) => (
                  <div key={ref.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-sm text-slate-900">{ref.patientName}</p>
                        <p className="text-[10px] font-bold text-slate-400">ID: {ref.patientId} • {ref.date}</p>
                      </div>
                      <Badge className={
                        ref.status === 'Completed' ? 'bg-emerald-500 text-white text-[10px]' :
                        ref.status === 'In Session' ? 'bg-sky-500 text-white text-[10px]' : 'bg-amber-500 text-white text-[10px]'
                      }>
                        {ref.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <p><span className="font-bold text-slate-500">Reason:</span> {ref.reason}</p>
                      <p><span className="font-bold text-slate-500">Target Area:</span> {ref.targetArea}</p>
                      {ref.notes && <p><span className="font-bold text-slate-500">Notes:</span> {ref.notes}</p>}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-1">
                      <span>Ref By: {ref.doctorName}</span>
                      <span className={ref.priority === 'Emergency' ? 'text-rose-600' : ref.priority === 'Urgent' ? 'text-amber-600' : 'text-slate-500'}>
                        {ref.priority} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
