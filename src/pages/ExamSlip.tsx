import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Candidate } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Printer, ArrowLeft, ShieldCheck, User, MapPin, Calendar, Monitor } from 'lucide-react';
import { getApiUrl } from '@/src/lib/api-config';

export default function ExamSlip() {
  const { examNumber } = useParams<{ examNumber: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCandidate() {
      if (!examNumber) return;
      try {
        const res = await fetch(getApiUrl(`/candidates/${examNumber}`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setCandidate(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidate();
  }, [examNumber]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">Retrieving Registration Data...</div>;

  if (!candidate) return <div className="p-20 text-center">Candidate not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans relative">
      <div className="cbt-background opacity-[0.03]" />
      <nav className="max-w-4xl mx-auto mb-10 bg-white/80 backdrop-blur-md border-2 border-primary/10 px-8 py-4 rounded-[24px] flex justify-between items-center shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
            <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
          </div>
          <div className="h-8 w-[1px] bg-primary/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-primary/40">
            <div className="relative">
              <Monitor className="w-6 h-6" />
              <User className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[8px] font-black tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-[12px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors">Portal Home</button>
      </nav>

      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')} className="h-12 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-widest gap-2 hover:bg-black shadow-lg transition-all border-none">
            <ArrowLeft className="w-4 h-4" /> Return to Home
          </Button>
        </div>
        <Button onClick={() => window.print()} className="h-14 px-10 bg-primary text-white rounded-2xl font-black text-[11px] tracking-widest shadow-xl active:scale-95 transition-transform border-none">
          <Printer className="w-5 h-5 mr-2" /> Print Examination Slip
        </Button>
      </div>

      <div className="max-w-4xl mx-auto bg-white border-[2px] border-primary p-8 rounded-[30px] relative overflow-hidden print:border-4 print:shadow-none">
        <div className="text-center border-b-2 border-primary/10 pb-8 mb-8">
          <h4 className="text-1xl font-black text-primary tracking-tighter">CBT EXAMINATION SLIP</h4>
          <p className="text-[12px] font-black text-primary/40 ">Registration Confirmation &bull; Session 2026</p>
        </div>

        <div className="grid grid-cols-[150px_1fr] gap-8 mb-8">
           <div className="w-20 h-20 bg-slate-50 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              {candidate.faceUrl ? <img src={candidate.faceUrl} className="w-full h-full object-cover" /> : <User className="w-12 h-12 opacity-10" />}
           </div>
           <div className="space-y-6">
              <div><p className="text-[11px] font-black opacity-30">Full Name</p><p className="font-black text-1xl">{candidate.fullName}</p></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><p className="text-[10px] font-black opacity-30">Exam Number</p><p className="font-bold">{candidate.examNumber}</p></div>
                 <div><p className="text-[10px] font-black opacity-30 ">PIN</p><p className="font-bold tracking-widest ">{candidate.pin || <span className="text-[8px] opacity-40 font-black tracking-tight">Not Set</span>}</p></div>
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
           <div className="p-6 bg-slate-50 rounded-3xl border-2 border-primary/5">
              <div className="flex items-center gap-3 mb-4">
                 <MapPin className="w-5 h-5 text-primary" />
                 <p className="text-[10px] font-black tracking-widest">Assigned Center</p>
              </div>
              <p className="font-bold text-sm">{candidate.examVenue || 'NOT YET ASSIGNED'}</p>
              <p className="text-[10px] font-bold opacity-40 mt-1">Seat: {candidate.assignedSeatNumber || 'ASSIGNED ON ARRIVAL'}</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-3xl border-2 border-primary/5">
              <div className="flex items-center gap-3 mb-4">
                 <Calendar className="w-5 h-5 text-primary" />
                 <p className="text-[10px] font-black tracking-widest">Schedule Info</p>
              </div>
              <p className="font-bold text-sm">Date: {candidate.examDate || 'TBA'}</p>
              <p className="text-[10px] font-bold opacity-40 mt-1">Time: {candidate.examTime || 'TBA'}</p>
           </div>
        </div>

        <div className="mb-8">
           <p className="text-[10px] font-black opacity-30 tracking-widest mb-4">Subject Combination</p>
           <div className="flex flex-wrap gap-2">
              {candidate.subjectCombination.map((s, i) => (
                 <div key={i} className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 font-black text-[10px] text-primary">
                    {s}
                 </div>
              ))}
           </div>
        </div>

        <div className="p-6 bg-primary text-white rounded-3xl">
           <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <p className="text-[10px] font-black tracking-widest">Security Instructions</p>
           </div>
           <ul className="text-[9px] font-bold space-y-1 opacity-80 list-disc list-inside">
              <li>Candidates must arrive 30 minutes before the scheduled time.</li>
              <li>Biometric verification is mandatory for terminal access.</li>
              <li>Calculators and mobile devices are strictly prohibited.</li>
           </ul>
        </div>

        <div className="mt-8 flex justify-between items-center opacity-20">
           <div className="text-[8px] font-black tracking-widest">VERIFIED AT {new Date(candidate.createdAt).toLocaleDateString()}</div>
           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${candidate.examNumber}`} className="w-12 h-12 grayscale" />
        </div>
      </div>
    </div>
  );
}
