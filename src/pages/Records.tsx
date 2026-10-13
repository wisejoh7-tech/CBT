import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import {
  FileText,
  FolderKanban,
  Search,
  ArrowLeft,
  Users,
  ShieldCheck,
  Plus,
  Lock
} from 'lucide-react';

export default function Records() {
  const navigate = useNavigate();

  const [recordsList, setRecordsList] = useState([
    { fileNo: 'MR-2024-001', name: 'John Doe', dob: '15 Aug 1988', bloodGroup: 'O+', status: 'Active File', officer: 'Officer Clara Dan' },
    { fileNo: 'MR-2024-002', name: 'Mary Johnson', dob: '03 Mar 1994', bloodGroup: 'A+', status: 'Active File', officer: 'Officer Clara Dan' },
    { fileNo: 'MR-2024-003', name: 'Robert Taylor', dob: '22 Nov 1976', bloodGroup: 'B+', status: 'Archived', officer: 'Officer Victor Hayes' }
  ]);

  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter patient name.");
      return;
    }

    const newRecord = {
      fileNo: `MR-2024-00${recordsList.length + 1}`,
      name: newName.trim(),
      dob: newDob || '01 Jan 1990',
      bloodGroup,
      status: 'Active File',
      officer: 'Officer Clara Dan'
    };

    setRecordsList([newRecord, ...recordsList]);
    toast.success(`New medical record opened for ${newName}!`);
    setNewName('');
    setNewDob('');
  };

  const filteredRecords = recordsList.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.fileNo.toLowerCase().includes(search.toLowerCase())
  );

  const recordsTeam = [
    { name: 'Clara Dan, RHIA', title: 'Head of Health Information Management', department: 'Health Records Archive', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop' },
    { name: 'Victor Hayes', title: 'Medical Records Administrator', department: 'Digital Indexing & Registration', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1000&auto=format&fit=crop' }
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
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-md">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-slate-900 leading-tight">Medical Records Department</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Health Information Management & Privacy</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 relative z-10">
        {/* Banner with Medical Records Officer Picture */}
        <Card className="p-6 sm:p-8 rounded-[32px] border border-primary/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-slate-700 text-slate-200 border border-slate-600 font-black text-[10px] tracking-widest uppercase px-3 py-1">
                HIPAA & NDPR Compliant Records
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Secure Electronic Health Record (EHR) Administration
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Our medical records officers ensure complete patient data confidentiality, digitized medical history archives, admission/discharge documentation, and instant file retrieval.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">256-Bit Encrypted Vault</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Strict Access Control</span>
                </div>
              </div>
            </div>

            {/* Medical Records Featured Picture */}
            <div className="relative group flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-slate-600/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop"
                  alt="Medical Records Officer"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="font-black text-sm text-white">Clara Dan, RHIA</p>
                    <p className="text-[10px] text-slate-300 font-medium uppercase">Head of Health Records</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Records Officers Team */}
        <section className="space-y-4">
          <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-800" /> Health Information Officers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recordsTeam.map((rec, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-primary/5 bg-white shadow-md flex items-center gap-4">
                <img src={rec.image} alt={rec.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{rec.name}</p>
                  <p className="text-xs font-medium text-slate-500">{rec.title}</p>
                  <Badge className="bg-slate-800 text-white text-[9px] mt-1">{rec.department}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Patient File Index */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Open Patient Folder</h3>
                <p className="text-xs text-slate-500">Register new health record file</p>
              </div>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Patient Full Name *</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. John Doe" className="h-10 rounded-xl bg-slate-50 font-medium text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Date of Birth</Label>
                <Input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} className="h-10 rounded-xl bg-slate-50 font-medium text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-600">Blood Group</Label>
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs">
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                </select>
              </div>
              <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs tracking-wider shadow-lg">
                CREATE MEDICAL RECORD
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 p-6 rounded-[28px] border border-primary/10 bg-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Patient Medical Files Archive</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search file no. or name..."
                  className="h-9 pl-9 rounded-xl bg-slate-50 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredRecords.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm text-slate-900">{rec.name}</p>
                      <Badge variant="outline" className="text-[10px] font-bold border-slate-300 font-mono">{rec.fileNo}</Badge>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1">DOB: {rec.dob} • Blood Group: <span className="font-bold text-rose-600">{rec.bloodGroup}</span></p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Archived by: {rec.officer}</p>
                  </div>
                  <Badge className="bg-slate-800 text-white text-[10px]">{rec.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
