import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import {
  HeartPulse,
  Activity,
  Clock,
  Plus,
  ArrowLeft,
  Users,
  ShieldCheck,
  Thermometer,
  Droplet
} from 'lucide-react';

export default function Nurses() {
  const navigate = useNavigate();

  const [vitals, setVitals] = useState([
    { patient: 'John Doe', bed: 'Bed 04', bp: '120/80 mmHg', hr: '72 bpm', temp: '36.8 °C', spo2: '98%', status: 'Stable', time: '10 mins ago' },
    { patient: 'Mary Johnson', bed: 'Bed 09', bp: '138/88 mmHg', hr: '84 bpm', temp: '37.4 °C', spo2: '96%', status: 'Observation', time: '25 mins ago' },
    { patient: 'Robert Taylor', bed: 'Bed 12', bp: '115/75 mmHg', hr: '68 bpm', temp: '36.5 °C', spo2: '99%', status: 'Stable', time: '1 hour ago' }
  ]);

  const [newPatient, setNewPatient] = useState('');
  const [bed, setBed] = useState('');
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState('75');
  const [temp, setTemp] = useState('36.6');
  const [spo2, setSpo2] = useState('98');

  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.trim()) {
      toast.error("Please enter patient name.");
      return;
    }
    const log = {
      patient: newPatient.trim(),
      bed: bed.trim() || 'Ward A',
      bp: `${bp} mmHg`,
      hr: `${hr} bpm`,
      temp: `${temp} °C`,
      spo2: `${spo2}%`,
      status: 'Stable',
      time: 'Just now'
    };
    setVitals([log, ...vitals]);
    toast.success(`Vitals recorded for ${newPatient}!`);
    setNewPatient('');
    setBed('');
  };

  const nursingTeam = [
    { name: 'Nurse Grace Adams, RN', title: 'Head Nurse & Shift Lead', shift: 'Morning Shift', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Nurse David Okon, BSN', title: 'ICU Specialist Nurse', shift: 'Morning Shift', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Nurse Brenda Smith, RN', title: 'Pediatric Care Nurse', shift: 'Evening Shift', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop' }
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
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Nurses Department</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nursing Care & Vitals Monitoring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 relative z-10">
        {/* Banner with Nurse Picture */}
        <Card className="p-6 sm:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-400/30 font-black text-[10px] tracking-widest uppercase px-3 py-1">
                Compassionate Nursing Care
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                24/7 Patient Monitoring & Bedside Care
              </h2>
              <p className="text-xs sm:text-sm text-rose-100/80 leading-relaxed max-w-xl">
                Our registered nurses provide continuous patient evaluation, vital sign tracking, medication administration, and compassionate bedside care around the clock.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Users className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold">24 Nursing Staff</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold">Real-time Vitals Station</span>
                </div>
              </div>
            </div>

            {/* Nurse Featured Picture */}
            <div className="relative group flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-rose-500/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1000&auto=format&fit=crop"
                  alt="Registered Nurse"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="font-black text-sm text-white">Nurse Grace Adams, RN</p>
                    <p className="text-[10px] text-rose-300 font-medium uppercase">Head Nurse & Shift Supervisor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Nursing Roster */}
        <section className="space-y-4">
          <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600" /> Active Shift Nursing Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nursingTeam.map((nurse, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-primary/5 bg-white shadow-md flex items-center gap-4">
                <img src={nurse.image} alt={nurse.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{nurse.name}</p>
                  <p className="text-xs font-medium text-slate-500">{nurse.title}</p>
                  <Badge className="bg-rose-500 text-white text-[9px] mt-1">{nurse.shift}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Vitals Logging & Monitoring Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form */}
          <Card className="p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Record Patient Vitals</h3>
                <p className="text-xs text-slate-500">Log bedside vital sign assessment</p>
              </div>
            </div>

            <form onSubmit={handleLogVitals} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Patient Name</Label>
                <Input value={newPatient} onChange={e => setNewPatient(e.target.value)} placeholder="e.g. Alice Smith" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-black text-slate-600">Bed / Ward</Label>
                  <Input value={bed} onChange={e => setBed(e.target.value)} placeholder="Bed 05" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-black text-slate-600">Blood Pressure</Label>
                  <Input value={bp} onChange={e => setBp(e.target.value)} placeholder="120/80" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-600">Heart Rate</Label>
                  <Input value={hr} onChange={e => setHr(e.target.value)} placeholder="72" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-600">Temp (°C)</Label>
                  <Input value={temp} onChange={e => setTemp(e.target.value)} placeholder="36.6" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-600">SpO2 (%)</Label>
                  <Input value={spo2} onChange={e => setSpo2(e.target.value)} placeholder="98" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs tracking-wider shadow-lg">
                SAVE VITALS RECORD
              </Button>
            </form>
          </Card>

          {/* Vitals Feed */}
          <Card className="lg:col-span-2 p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Active Patient Vitals Station</h3>
              <Badge className="bg-rose-500 text-white font-bold text-xs">{vitals.length} Recorded</Badge>
            </div>

            <div className="space-y-3">
              {vitals.map((v, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-sm text-slate-900">{v.patient} <span className="text-xs text-slate-400 font-bold">({v.bed})</span></p>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {v.time}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">BP: {v.bp}</span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">HR: {v.hr}</span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Temp: {v.temp}</span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">SpO2: {v.spo2}</span>
                  </div>

                  <Badge className="bg-emerald-500 text-white text-[10px]">{v.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
