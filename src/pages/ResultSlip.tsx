import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Candidate, Attempt } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Printer, ArrowLeft, ShieldCheck, BadgeCheck, Download, Award, Monitor, User } from 'lucide-react';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage } from '@/src/lib/api-config';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/src/lib/utils/utils';

export default function ResultSlip({ isVerification = false }: { isVerification?: boolean }) {
  const { examNumber } = useParams<{ examNumber: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [unifiedAttempt, setUnifiedAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [studyGuide, setStudyGuide] = useState<any | null>(null);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const navigate = useNavigate();

  const handleGenerateStudyGuide = async () => {
    if (!unifiedAttempt?.id) return;
    setGeneratingGuide(true);
    try {
      const res = await fetch(getApiUrl(`/exams/attempt/${unifiedAttempt.id}/study-guide`), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setStudyGuide(await safeJsonResponse(res));
      else toast.error("Could not generate study guide.");
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setGeneratingGuide(false);
    }
  };

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  useEffect(() => {
    async function fetchResultData() {
      if (!examNumber) return;
      try {
        setLoading(true);
        // We'll use a specific endpoint for the result slip or reuse the public one if no token
        const res = await fetch(getApiUrl('/exams/public/check-result'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examNumber: examNumber })
        });

        const data = await safeJsonResponse(res);
        if (data) {
          setCandidate(data.candidate);
          setUnifiedAttempt(data.attempt);
        }
      } catch (error) {
        console.error("Error fetching result slip:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResultData();
  }, [examNumber]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-primary animate-pulse tracking-widest">Generating Official Transcript...</div>;

  if (!candidate || !unifiedAttempt) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <ShieldCheck className="w-16 h-16 text-primary/20" />
        <h2 className="text-2xl font-black text-primary">Result Not Available</h2>
        <Button onClick={() => navigate('/')} className="bg-primary text-white font-black rounded-xl h-12 px-8">Back to Portal</Button>
      </div>
    );
  }

  const results = unifiedAttempt.results || [];
  const totalScore = unifiedAttempt.score || 0;
  const totalPossible = unifiedAttempt.totalPossible || 0;

  const downloadPDF = () => {
    if (!candidate || !unifiedAttempt) return;
    const doc = new jsPDF();
    const primaryColor = [14, 165, 233];
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.text('VIVI CBT OFFICIAL RESULT', 105, 20, { align: 'center' });
    doc.save(`Result_${candidate.examNumber}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50/20 py-8 px-4 font-sans relative">
      <div className="cbt-background" />
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
        <div className="flex items-center gap-6">
           <button onClick={() => navigate('/')} className="text-[12px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Portal Home
           </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => window.history.back()} className="font-black text-[10px] tracking-widest gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black text-[11px]"><Download className="w-5 h-5" /></Button>
          <Button onClick={() => window.print()} className="h-14 px-10 bg-primary text-white rounded-2xl font-black text-[11px] shadow-xl">
            <Printer className="w-5 h-5 mr-2" /> Print Official Result
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white border-[4px] border-primary p-10 rounded-[40px] shadow-2xl relative overflow-hidden print:border-4 print:shadow-none">
        <div className="text-center border-b-2 border-primary/10 pb-8 mb-8">
          {isVerification && (
             <div className="flex items-center justify-center gap-2 mb-4">
                <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-100">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[10px] font-black tracking-widest">Official Verification: Authenticated</span>
                </div>
             </div>
          )}
          <h1 className="text-2xl font-black text-primary tracking-tighter">VIVI CBT OFFICIAL RESULT</h1>
          <p className="text-[10px] font-black text-primary/40 tracking-[0.5em] mt-2">Unified Examination Standards</p>
        </div>

        <div className="grid grid-cols-[100px_1fr] gap-8 mb-8">
           <div className="w-24 h-24 bg-primary/5 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              {candidate.faceUrl ? <img src={candidate.faceUrl} className="w-full h-full object-cover" /> : <ShieldCheck className="w-10 h-10 opacity-10" />}
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[10px] font-black opacity-20">Full Name</p><p className="font-black text-lg">{candidate.fullName}</p></div>
              <div><p className="text-[10px] font-black opacity-20">Exam Number</p><p className="font-black text-lg">{candidate.examNumber}</p></div>
              <div><p className="text-[10px] font-black opacity-20">Terminal Signature</p><div className="flex items-center gap-1 text-sky-500"><BadgeCheck className="w-5 h-5" /><span className="font-black">Verified</span></div></div>
           </div>
        </div>

        <div className="border-2 border-primary/10 rounded-[24px] overflow-hidden bg-white mb-8">
           <table className="w-full">
              <thead className="bg-primary/5">
                 <tr className="text-left text-[10px] font-black tracking-widest text-primary">
                    <th className="p-4">Subject</th>
                    <th className="p-4 text-right">Score</th>
                 </tr>
              </thead>
              <tbody className="divide-y-2 divide-primary/5">
                 {results.length > 0 ? results.map((r: any, i: number) => (
                    <tr key={i} className="font-black text-sm text-primary">
                       <td className="p-4">{r.subject}</td>
                       <td className="p-4 text-right">{r.score}</td>
                    </tr>
                 )) : unifiedAttempt.results?.subjects ? Object.entries(unifiedAttempt.results.subjects).map(([subject, stats]: [string, any], i) => (
                    <tr key={i} className="font-black text-sm text-primary">
                       <td className="p-4">{subject}</td>
                       <td className="p-4 text-right">{stats.correct} / {stats.total}</td>
                    </tr>
                 )) : (
                   <tr className="font-black text-sm text-primary">
                      <td className="p-4">Unified Assessment</td>
                      <td className="p-4 text-right">{unifiedAttempt.score}</td>
                   </tr>
                 )}
              </tbody>
              <tfoot className="bg-primary text-white font-black">
                 <tr>
                    <td className="p-4 tracking-widest">Aggregate Total</td>
                    <td className="p-4 text-right text-2xl">{totalScore} <span className="text-[10px] opacity-60">/ {totalPossible}</span></td>
                 </tr>
              </tfoot>
           </table>
        </div>

        {unifiedAttempt.results?.topics && (
           <div className="mb-8">
              <h3 className="text-[10px] font-black opacity-30 tracking-widest mb-4">Topic Performance Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                 {Object.entries(unifiedAttempt.results.topics).map(([topic, stats]: [string, any], i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-primary/5">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-black">{topic}</span>
                          <span className="text-[9px] font-black text-primary">{Math.round((stats.correct / stats.total) * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(stats.correct / stats.total) * 100}%` }} />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {unifiedAttempt.trustScore !== undefined && (
           <div className={cn("p-4 rounded-2xl border-2 mb-8 flex items-center justify-between", unifiedAttempt.trustScore < 80 ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50")}>
              <div className="flex items-center gap-3">
                 <ShieldCheck className={cn("w-6 h-6", unifiedAttempt.trustScore < 80 ? "text-red-500" : "text-emerald-500")} />
                 <div>
                    <p className="text-[10px] font-black opacity-40">Security Trust Score</p>
                    <p className="font-black text-lg">{Math.round(unifiedAttempt.trustScore)}%</p>
                 </div>
              </div>
              {unifiedAttempt.trustScore < 80 && <Badge className="bg-red-500 text-white">Review Required</Badge>}
           </div>
        )}

        {unifiedAttempt.status === 'completed' && !studyGuide && (
           <Button
            onClick={handleGenerateStudyGuide}
            disabled={generatingGuide}
            className="w-full h-16 bg-gradient-to-r from-primary to-sky-600 text-white font-black rounded-2xl shadow-xl mt-8 mb-8"
           >
              {generatingGuide ? "AI IS ANALYZING YOUR PERFORMANCE..." : "GENERATE AI STUDY GUIDE"}
           </Button>
        )}

        {studyGuide && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-[32px] border-2 border-primary/20 bg-slate-50 mb-8">
              <div className="flex items-center gap-3 mb-6">
                 <Award className="w-6 h-6 text-primary" />
                 <h3 className="text-sm font-black tracking-widest">Personalized AI Study Guide</h3>
              </div>
              <p className="text-[11px] font-bold text-primary/70 leading-relaxed mb-6 italic">"{studyGuide.summary}"</p>

              <div className="space-y-6">
                 <div>
                    <p className="text-[9px] font-black opacity-30 tracking-[0.2em] mb-3">Priority Focus Areas</p>
                    <div className="flex flex-wrap gap-2">
                       {studyGuide.weakAreas?.map((area: string, i: number) => (
                          <Badge key={i} className="bg-red-100 text-red-600 border-none px-3 py-1 text-[9px] font-black">{area}</Badge>
                       ))}
                    </div>
                 </div>
                 <div>
                    <p className="text-[9px] font-black opacity-30 tracking-[0.2em] mb-3">AI Recommendations</p>
                    <ul className="space-y-2">
                       {studyGuide.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="flex gap-3 text-[10px] font-bold">
                             <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 shrink-0" />
                             <span>{rec}</span>
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>
           </motion.div>
        )}

        <div className="text-center opacity-20 font-bold text-[8px] tracking-[0.5em] mb-8">
           Official Original Result &bull; Session 2026 &bull; {new Date().toLocaleDateString()}
        </div>

        <div className="flex justify-between items-end border-t-2 border-primary/5 pt-8">
           <div className="space-y-1">
              <p className="text-[8px] font-black opacity-30">Digital Verification Signature</p>
              <p className="font-mono text-[7px] opacity-50">{unifiedAttempt.id}</p>
           </div>
           <div className="text-right">
              <img
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.origin}/verify/${candidate.examNumber}`}
                 className="w-16 h-16 ml-auto mb-2 grayscale opacity-80"
                 alt="Verification QR"
              />
              <p className="text-[7px] font-black opacity-30">Scan to Verify Authenticity</p>
           </div>
        </div>
      </div>
    </div>
  );
}
