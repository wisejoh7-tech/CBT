import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import {
  Pill,
  CheckCircle2,
  PackageCheck,
  Search,
  ArrowLeft,
  Users,
  ShieldCheck,
  Plus
} from 'lucide-react';

export default function Pharmacy() {
  const navigate = useNavigate();

  const [dispenseLog, setDispenseLog] = useState([
    { patient: 'John Doe', prescription: 'Amoxicillin 500mg (3x Daily)', pharmacist: 'Pharm. Alex Rivera', status: 'Dispensed', date: 'Today, 10:15 AM' },
    { patient: 'Sarah Jenkins', prescription: 'Ibuprofen 400mg (Post-Op)', pharmacist: 'Pharm. Alex Rivera', status: 'Dispensed', date: 'Today, 09:30 AM' },
    { patient: 'Michael Obi', prescription: 'Paracetamol 1000mg + Vitamin C', pharmacist: 'Pharm. Linda Williams', status: 'Ready for Pickup', date: 'Today, 11:00 AM' }
  ]);

  const [patientName, setPatientName] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !medication.trim()) {
      toast.error("Please fill in patient name and medication.");
      return;
    }

    const log = {
      patient: patientName.trim(),
      prescription: `${medication.trim()} (${dosage.trim() || 'Standard Dose'})`,
      pharmacist: 'Pharm. Alex Rivera, PharmD',
      status: 'Dispensed',
      date: 'Just now'
    };

    setDispenseLog([log, ...dispenseLog]);
    toast.success(`Medication dispensed to ${patientName}!`);
    setPatientName('');
    setMedication('');
    setDosage('');
  };

  const pharmacyTeam = [
    { name: 'Pharm. Alex Rivera, PharmD', title: 'Chief Clinical Pharmacist', role: 'Inpatient Pharmacy', image: 'https://images.unsplash.com/photo-1586015555751-63c3d002e1c9?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Pharm. Linda Williams', title: 'Senior Dispensing Pharmacist', role: 'Outpatient Pharmacy', image: 'https://images.unsplash.com/photo-1594824813566-88855ce78341?q=80&w=1000&auto=format&fit=crop' }
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
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Pharmacy Department</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescription Dispensing & Medication Safety</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 relative z-10">
        {/* Banner with Pharmacist Picture */}
        <Card className="p-6 sm:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-black text-[10px] tracking-widest uppercase px-3 py-1">
                Pharmaceutical Services
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Precision Medication Dispensing & Clinical Safety
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed max-w-xl">
                Our clinical pharmacists manage drug therapy, verify doctor prescriptions, counsel patients on usage, and maintain zero-error medication safety protocols.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <PackageCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">1,400+ Verified Drugs</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">Safe Dispensing Protocol</span>
                </div>
              </div>
            </div>

            {/* Pharmacist Featured Picture */}
            <div className="relative group flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-indigo-500/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1586015555751-63c3d002e1c9?q=80&w=1000&auto=format&fit=crop"
                  alt="Pharmacist Specialist"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="font-black text-sm text-white">Pharm. Alex Rivera, PharmD</p>
                    <p className="text-[10px] text-indigo-300 font-medium uppercase">Chief Clinical Pharmacist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pharmacy Team */}
        <section className="space-y-4">
          <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Pharmacy Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pharmacyTeam.map((pharm, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-primary/5 bg-white shadow-md flex items-center gap-4">
                <img src={pharm.image} alt={pharm.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{pharm.name}</p>
                  <p className="text-xs font-medium text-slate-500">{pharm.title}</p>
                  <Badge className="bg-indigo-600 text-white text-[9px] mt-1">{pharm.role}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Dispensing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Dispense Prescription</h3>
                <p className="text-xs text-slate-500">Fulfill doctor medication order</p>
              </div>
            </div>

            <form onSubmit={handleDispense} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Patient Name *</Label>
                <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. John Doe" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Medication Name *</Label>
                <Input value={medication} onChange={e => setMedication(e.target.value)} placeholder="e.g. Amoxicillin 500mg" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Dosage / Usage</Label>
                <Input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 1 Tablet 3x Daily for 7 days" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
              </div>
              <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs tracking-wider shadow-lg">
                CONFIRM & DISPENSE
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Dispensed Prescriptions Log</h3>
              <Badge className="bg-indigo-600 text-white font-bold text-xs">{dispenseLog.length} Records</Badge>
            </div>

            <div className="space-y-3">
              {dispenseLog.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-sm text-slate-900">{item.patient}</p>
                    <p className="text-xs font-semibold text-indigo-700 mt-0.5">{item.prescription}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Dispensed by: {item.pharmacist} • {item.date}</p>
                  </div>
                  <Badge className="bg-emerald-500 text-white text-[10px]">{item.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
