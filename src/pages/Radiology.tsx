import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import {
  Scan,
  ScanLine,
  FileCheck2,
  ArrowLeft,
  Users,
  ShieldCheck,
  Plus
} from 'lucide-react';

export default function Radiology() {
  const navigate = useNavigate();

  const [scanOrders, setScanOrders] = useState([
    { patient: 'John Doe', scanType: 'Chest X-Ray (PA View)', radiologist: 'Dr. Marcus Vance', status: 'Report Ready', findings: 'No active lung parenchymal lesion.', date: 'Today, 08:30 AM' },
    { patient: 'Mary Johnson', scanType: 'Brain MRI (T1/T2 Weighted)', radiologist: 'Dr. Marcus Vance', status: 'Scanning', findings: 'In Progress...', date: 'Today, 10:00 AM' },
    { patient: 'Robert Taylor', scanType: 'Abdominal Ultrasound', radiologist: 'Dr. Marcus Vance', status: 'Queued', findings: 'Awaiting Scan', date: 'Today, 11:30 AM' }
  ]);

  const [patientName, setPatientName] = useState('');
  const [scanType, setScanType] = useState('Chest X-Ray');
  const [modality, setModality] = useState('X-Ray');

  const handleAddScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error("Please enter patient name.");
      return;
    }

    const newScan = {
      patient: patientName.trim(),
      scanType: `${scanType} [${modality}]`,
      radiologist: 'Dr. Marcus Vance, MD',
      status: 'Queued',
      findings: 'Order Submitted to Radiology Room',
      date: 'Just now'
    };

    setScanOrders([newScan, ...scanOrders]);
    toast.success(`Imaging order submitted for ${patientName}!`);
    setPatientName('');
  };

  const radiologistTeam = [
    { name: 'Dr. Marcus Vance, MD', title: 'Consultant Radiologist', specialization: 'Neuroradiology & MRI Specialist', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1000&auto=format&fit=crop' }
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
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Radiology & Imaging Department</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">X-Ray, CT Scan, MRI & Sonography</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 relative z-10">
        {/* Banner with Radiologist Picture */}
        <Card className="p-6 sm:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/30 font-black text-[10px] tracking-widest uppercase px-3 py-1">
                Diagnostic Radiology
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                High-Resolution Diagnostic Imaging & Radiologic Reports
              </h2>
              <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed max-w-xl">
                Our radiologists perform digital X-rays, 3D CT scans, high-field MRI scans, and ultrasound sonography for comprehensive clinical diagnosis.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <ScanLine className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold">3.0T MRI & 128-Slice CT</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold">PACS Imaging Archive</span>
                </div>
              </div>
            </div>

            {/* Radiologist Featured Picture */}
            <div className="relative group flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-purple-500/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1000&auto=format&fit=crop"
                  alt="Radiology Specialist"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="font-black text-sm text-white">Dr. Marcus Vance, MD</p>
                    <p className="text-[10px] text-purple-300 font-medium uppercase">Consultant Radiologist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Radiologist Team */}
        <section className="space-y-4">
          <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" /> Radiologist Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {radiologistTeam.map((rad, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-primary/5 bg-white shadow-md flex items-center gap-4">
                <img src={rad.image} alt={rad.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{rad.name}</p>
                  <p className="text-xs font-medium text-slate-500">{rad.title}</p>
                  <Badge className="bg-purple-600 text-white text-[9px] mt-1">{rad.specialization}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Imaging Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Request Imaging Scan</h3>
                <p className="text-xs text-slate-500">Order radiologic examination</p>
              </div>
            </div>

            <form onSubmit={handleAddScan} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Patient Name *</Label>
                <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. John Doe" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Modality</Label>
                <select value={modality} onChange={e => setModality(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs">
                  <option value="X-Ray">Digital X-Ray</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="MRI">MRI Scan</option>
                  <option value="Ultrasound">Ultrasound Sonography</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Examination Region</Label>
                <Input value={scanType} onChange={e => setScanType(e.target.value)} placeholder="e.g. Chest, Lumbar Spine, Knee Joint" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
              </div>
              <Button type="submit" className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs tracking-wider shadow-lg">
                SUBMIT IMAGING ORDER
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Radiology Imaging Queue</h3>
              <Badge className="bg-purple-600 text-white font-bold text-xs">{scanOrders.length} Orders</Badge>
            </div>

            <div className="space-y-3">
              {scanOrders.map((scan, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-sm text-slate-900">{scan.patient}</p>
                    <p className="text-xs font-bold text-purple-700 mt-0.5">{scan.scanType}</p>
                    <p className="text-xs font-medium text-slate-600 mt-1">Findings: {scan.findings}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Logged: {scan.date}</p>
                  </div>
                  <Badge className={scan.status === 'Report Ready' ? 'bg-emerald-500 text-white text-[10px]' : 'bg-purple-600 text-white text-[10px]'}>
                    {scan.status}
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
