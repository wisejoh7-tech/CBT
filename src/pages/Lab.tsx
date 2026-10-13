import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import {
  FlaskConical,
  TestTube,
  Microscope,
  ArrowLeft,
  Users,
  ShieldCheck,
  Plus
} from 'lucide-react';

export default function Lab() {
  const navigate = useNavigate();

  const [labTests, setLabTests] = useState([
    { patient: 'John Doe', testType: 'Full Blood Count (FBC)', scientist: 'Dr. Elena Rostova', status: 'Completed', result: 'WBC: 6.5 x10^9/L (Normal)', date: 'Today, 09:15 AM' },
    { patient: 'Mary Johnson', testType: 'Lipid Profile & HbA1c', scientist: 'Dr. Elena Rostova', status: 'In Analysis', result: 'Processing Specimen...', date: 'Today, 10:45 AM' },
    { patient: 'Robert Taylor', testType: 'Liver Function Test (LFT)', scientist: 'Sci. Samuel Bassey', status: 'Specimen Received', result: 'Awaiting centrifuge', date: 'Today, 11:20 AM' }
  ]);

  const [patientName, setPatientName] = useState('');
  const [testType, setTestType] = useState('');
  const [specimen, setSpecimen] = useState('Blood');

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !testType.trim()) {
      toast.error("Please enter patient name and test type.");
      return;
    }

    const newTest = {
      patient: patientName.trim(),
      testType: `${testType.trim()} (${specimen})`,
      scientist: 'Dr. Elena Rostova, PhD',
      status: 'Specimen Received',
      result: 'Pending Laboratory Analysis',
      date: 'Just now'
    };

    setLabTests([newTest, ...labTests]);
    toast.success(`Lab test logged for ${patientName}!`);
    setPatientName('');
    setTestType('');
  };

  const labTeam = [
    { name: 'Dr. Elena Rostova, PhD', title: 'Chief Medical Laboratory Scientist', specialization: 'Hematology & Molecular Biology', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Sci. Samuel Bassey', title: 'Senior Medical Biochemist', specialization: 'Clinical Biochemistry', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1000&auto=format&fit=crop' }
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
            <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Laboratory & Diagnostics Department</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Science & Pathology Analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 relative z-10">
        {/* Banner with Scientist Picture */}
        <Card className="p-6 sm:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-900 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-black text-[10px] tracking-widest uppercase px-3 py-1">
                Diagnostic Pathology
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Advanced Molecular & Diagnostic Laboratory Science
              </h2>
              <p className="text-xs sm:text-sm text-cyan-100/80 leading-relaxed max-w-xl">
                Our medical scientists deliver high-precision bloodwork, pathology, microbiology, and molecular assays with ISO-certified laboratory accuracy.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Microscope className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold">Automated Assays</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold">ISO 15189 Certified</span>
                </div>
              </div>
            </div>

            {/* Scientist Featured Picture */}
            <div className="relative group flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-cyan-500/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1000&auto=format&fit=crop"
                  alt="Medical Laboratory Scientist"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="font-black text-sm text-white">Dr. Elena Rostova, PhD</p>
                    <p className="text-[10px] text-cyan-300 font-medium uppercase">Chief Medical Laboratory Scientist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Scientist Roster */}
        <section className="space-y-4">
          <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" /> Laboratory Scientists Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labTeam.map((sci, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-primary/5 bg-white shadow-md flex items-center gap-4">
                <img src={sci.image} alt={sci.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{sci.name}</p>
                  <p className="text-xs font-medium text-slate-500">{sci.title}</p>
                  <Badge className="bg-cyan-600 text-white text-[9px] mt-1">{sci.specialization}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Test Order Logging */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Log Specimen / Test Order</h3>
                <p className="text-xs text-slate-500">Register new laboratory test</p>
              </div>
            </div>

            <form onSubmit={handleAddTest} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Patient Name *</Label>
                <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. John Doe" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Test Required *</Label>
                <Input value={testType} onChange={e => setTestType(e.target.value)} placeholder="e.g. Lipid Profile, Full Blood Count" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Specimen Type</Label>
                <select value={specimen} onChange={e => setSpecimen(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs">
                  <option value="Blood">Venous Blood</option>
                  <option value="Urine">Urine</option>
                  <option value="Swab">Nasopharyngeal Swab</option>
                  <option value="CSF">Cerebrospinal Fluid</option>
                </select>
              </div>
              <Button type="submit" className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black text-xs tracking-wider shadow-lg">
                LOG TEST REQUEST
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Laboratory Specimen Queue</h3>
              <Badge className="bg-cyan-600 text-white font-bold text-xs">{labTests.length} Tests Logged</Badge>
            </div>

            <div className="space-y-3">
              {labTests.map((test, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-sm text-slate-900">{test.patient}</p>
                    <p className="text-xs font-bold text-cyan-700 mt-0.5">{test.testType}</p>
                    <p className="text-xs font-medium text-slate-600 mt-1">Result: {test.result}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Logged: {test.date}</p>
                  </div>
                  <Badge className={test.status === 'Completed' ? 'bg-emerald-500 text-white text-[10px]' : 'bg-cyan-600 text-white text-[10px]'}>
                    {test.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
