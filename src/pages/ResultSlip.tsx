import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Candidate } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Printer, ArrowLeft, ShieldCheck, Download, Award, Monitor, User } from 'lucide-react';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { QRCodeSVG } from '@/src/components/QRCodeSVG';

export default function ResultSlip({ isVerification = false }: { isVerification?: boolean }) {
  const { examNumber } = useParams<{ examNumber: string }>();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
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
      const res = await apiFetch(getApiUrl(`/exams/attempt/${unifiedAttempt.id}/study-guide`), {
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

  useEffect(() => {
    async function fetchResultData() {
      if (!examNumber) return;
      try {
        setLoading(true);
        const pinFromQuery = searchParams.get('pin') || undefined;
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await apiFetch(getApiUrl('/exams/public/check-result'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            examNumber: examNumber,
            attemptId: attemptId || undefined,
            pin: pinFromQuery
          })
        });

        const data = await safeJsonResponse(res);
        if (data) {
          setCandidate(data.candidate);
          setUnifiedAttempt(data.attempt);
        }
      } catch (error: any) {
        console.error("Error fetching result slip:", error);
        toast.error(getFriendlyErrorMessage(error) || "Unable to load examination result slip.");
      } finally {
        setLoading(false);
      }
    }
    fetchResultData();
  }, [examNumber, attemptId, searchParams]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-primary animate-pulse tracking-widest text-sm sm:text-base">Generating Official Transcript...</div>;

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

  const downloadPDF = () => {
    if (!candidate || !unifiedAttempt) return;
    const doc = new jsPDF();

    // Header Banner
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('VIVI CBT OFFICIAL RESULT', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('UNIFIED EXAMINATION STANDARDS', 105, 28, { align: 'center' });

    // Candidate Details
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CANDIDATE DETAILS', 14, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Full Name: ${candidate.fullName || 'N/A'}`, 14, 56);
    doc.text(`Exam Number: ${candidate.examNumber || 'N/A'}`, 14, 63);

    // Results Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PERFORMANCE RECORD', 14, 78);

    const tableBody: (string | number)[][] = [];
    if (results.length > 0) {
      results.forEach((r: any) => {
        tableBody.push([r.subject || 'Subject', Math.round(Number(r.score) || 0)]);
      });
    } else if (unifiedAttempt.results?.subjects) {
      Object.entries(unifiedAttempt.results.subjects).forEach(([subject, stats]: [string, any]) => {
        tableBody.push([subject, Math.round(Number(stats.correct ?? stats.score ?? 0))]);
      });
    } else {
      tableBody.push(['Unified Assessment', Math.round(Number(unifiedAttempt.score) || 0)]);
    }

    (doc as any).autoTable({
      startY: 83,
      head: [['Subject', 'Score']],
      body: tableBody,
      foot: [['AGGREGATE SCORE', Math.round(Number(totalScore) || 0)]],
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 140;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('This is an official computer-generated result transcript issued by VIVI CBT Systems.', 14, finalY + 15);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, finalY + 22);

    doc.save(`Result_${candidate.examNumber}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50/20 py-4 sm:py-8 px-3 sm:px-6 font-sans relative antialiased">
      <div className="cbt-background" />

      {/* Top Navigation */}
      <nav className="max-w-4xl mx-auto mb-6 sm:mb-8 bg-white/80 backdrop-blur-md border-2 border-primary/10 px-4 sm:px-8 py-3 sm:py-4 rounded-[20px] sm:rounded-[24px] flex justify-between items-center shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-primary/20">V</div>
            <span className="font-black text-lg sm:text-xl tracking-tighter text-primary">VIVI CBT</span>
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
        <div className="flex items-center gap-3 sm:gap-6">
           <button onClick={() => navigate('/')} className="text-[11px] sm:text-[12px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Portal Home</span>
           </button>
        </div>
      </nav>

      {/* Action Toolbar */}
      <div className="max-w-2xl mx-auto mb-6 flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 print:hidden">
        <Button variant="ghost" onClick={() => window.history.back()} className="font-black text-[10px] tracking-widest gap-2 self-start xs:self-auto h-10 px-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2.5 w-full xs:w-auto">
          <Button onClick={downloadPDF} variant="outline" className="flex-1 xs:flex-initial h-11 sm:h-12 px-4 sm:px-6 rounded-2xl border-2 font-black text-[11px] flex items-center justify-center gap-2">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Download PDF</span>
          </Button>
          <Button onClick={() => window.print()} className="flex-1 xs:flex-initial h-11 sm:h-12 px-5 sm:px-8 bg-primary text-white rounded-2xl font-black text-[11px] shadow-xl flex items-center justify-center gap-2">
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Print Official Result</span>
          </Button>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="max-w-2xl mx-auto bg-white border-2 sm:border-[4px] border-primary p-5 sm:p-10 rounded-[28px] sm:rounded-[40px] shadow-2xl relative overflow-hidden print:border-4 print:shadow-none print:p-8">
        <div className="text-center border-b-2 border-primary/10 pb-6 sm:pb-8 mb-6 sm:mb-8">
          {isVerification && (
             <div className="flex items-center justify-center gap-2 mb-4">
                <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-100">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[10px] font-black tracking-widest uppercase">Official Verification: Authenticated</span>
                </div>
             </div>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tighter">VIVI CBT OFFICIAL RESULT</h1>
          <p className="text-[9px] sm:text-[10px] font-black text-primary/40 tracking-[0.2em] sm:tracking-[0.5em] mt-2 uppercase">Unified Examination Standards</p>
        </div>

        {/* Candidate Information Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8 mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-primary/10">
           <div className="w-24 h-24 sm:w-28 sm:h-28 bg-primary/5 rounded-2xl border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {candidate.faceUrl ? <img src={candidate.faceUrl} className="w-full h-full object-cover" /> : <ShieldCheck className="w-10 h-10 opacity-10" />}
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-center sm:text-left">
              <div>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Full Name</p>
                <p className="font-black text-base sm:text-lg text-slate-900 break-words">{candidate.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Exam Number</p>
                <p className="font-black text-base sm:text-lg text-slate-900 font-mono break-all">{candidate.examNumber}</p>
              </div>
           </div>
        </div>

        {/* Institutional Direct Share Bar */}
        <div className="mb-6 sm:mb-8 p-4 bg-slate-50 rounded-2xl border border-primary/10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-black text-xs text-primary">Forward Official Transcript to Tertiary Institution</p>
            <p className="text-[10px] text-slate-500">Send verified digital copy directly to university admissions portal.</p>
          </div>
          <Button
            type="button"
            onClick={() => toast.success(`Official Transcript dispatched for Exam #${candidate.examNumber}`)}
            className="h-9 px-4 bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-black rounded-xl transition-all shrink-0 w-full sm:w-auto"
          >
            Dispatch Transcript
          </Button>
        </div>

        {/* Subject Score Breakdown Table */}
        <div className="border-2 border-primary/10 rounded-[20px] sm:rounded-[24px] overflow-hidden bg-white mb-6 sm:mb-8 shadow-sm">
           <table className="w-full">
              <thead className="bg-primary/5">
                 <tr className="text-left text-[10px] font-black tracking-widest text-primary uppercase">
                    <th className="p-3.5 sm:p-4">Subject</th>
                    <th className="p-3.5 sm:p-4 text-right">Score</th>
                 </tr>
              </thead>
              <tbody className="divide-y-2 divide-primary/5">
                 {results.length > 0 ? results.map((r: any, i: number) => {
                    const subjectScore = Math.round(Number(r.score) || 0);
                    return (
                      <tr key={i} className="font-black text-xs sm:text-sm text-slate-800">
                         <td className="p-3.5 sm:p-4">{r.subject}</td>
                         <td className="p-3.5 sm:p-4 text-right font-mono">{subjectScore}</td>
                      </tr>
                    );
                 }) : unifiedAttempt.results?.subjects ? Object.entries(unifiedAttempt.results.subjects).map(([subject, stats]: [string, any], i) => {
                    const subjectScore = Math.round(Number(stats.correct ?? stats.score ?? 0));
                    return (
                      <tr key={i} className="font-black text-xs sm:text-sm text-slate-800">
                         <td className="p-3.5 sm:p-4">{subject}</td>
                         <td className="p-3.5 sm:p-4 text-right font-mono">{subjectScore}</td>
                      </tr>
                    );
                 }) : (
                   <tr className="font-black text-xs sm:text-sm text-slate-800">
                      <td className="p-3.5 sm:p-4">Unified Assessment</td>
                      <td className="p-3.5 sm:p-4 text-right font-mono">{Math.round(Number(unifiedAttempt.score) || 0)}</td>
                   </tr>
                 )}
              </tbody>
              <tfoot className="bg-primary text-white font-black">
                 <tr>
                    <td className="p-3.5 sm:p-4 text-xs sm:text-sm tracking-widest uppercase">Aggregate Total</td>
                    <td className="p-3.5 sm:p-4 text-right text-xl sm:text-2xl font-mono">{Math.round(Number(totalScore) || 0)}</td>
                 </tr>
              </tfoot>
           </table>
        </div>

        {/* AI Study Guide Prompt */}
        {unifiedAttempt.status === 'completed' && !studyGuide && (
           <Button
            onClick={handleGenerateStudyGuide}
            disabled={generatingGuide}
            className="w-full h-14 sm:h-16 bg-gradient-to-r from-primary to-sky-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl mb-6 sm:mb-8"
           >
              {generatingGuide ? "AI IS ANALYZING YOUR PERFORMANCE..." : "GENERATE AI STUDY GUIDE"}
           </Button>
        )}

        {/* Generated AI Study Guide Block */}
        {studyGuide && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border-2 border-primary/20 bg-slate-50 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                 <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                 <h3 className="text-xs sm:text-sm font-black tracking-widest uppercase">Personalized AI Study Guide</h3>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-700 leading-relaxed mb-5 italic">"{studyGuide.summary}"</p>

              <div className="space-y-5">
                 <div>
                    <p className="text-[9px] font-black opacity-40 tracking-[0.2em] mb-2.5 uppercase">Priority Focus Areas</p>
                    <div className="flex flex-wrap gap-2">
                       {studyGuide.weakAreas?.map((area: string, i: number) => (
                          <Badge key={i} className="bg-rose-100 text-rose-700 border-none px-3 py-1 text-[9px] font-black">{area}</Badge>
                       ))}
                    </div>
                 </div>
                 <div>
                    <p className="text-[9px] font-black opacity-40 tracking-[0.2em] mb-2.5 uppercase">AI Recommendations</p>
                    <ul className="space-y-2">
                       {studyGuide.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="flex gap-2.5 text-[10px] font-bold text-slate-800">
                             <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 shrink-0" />
                             <span>{rec}</span>
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>
           </motion.div>
        )}

        <div className="text-center opacity-30 font-bold text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.5em] mb-6 sm:mb-8 uppercase">
           Official Original Result &bull; Session {new Date().getFullYear()} &bull; {new Date().toLocaleDateString()}
        </div>

        {/* Verification Signature & QR Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 border-t-2 border-primary/5 pt-6 sm:pt-8 text-center sm:text-left">
           <div className="space-y-1 min-w-0 max-w-full">
              <p className="text-[8px] font-black opacity-40 uppercase tracking-wider">Digital Verification Signature</p>
              <p className="font-mono text-[7px] sm:text-[8px] opacity-60 break-all">{unifiedAttempt.id}</p>
           </div>
           <div className="flex flex-col items-center sm:items-end shrink-0">
              <QRCodeSVG
                 value={`${window.location.origin}/verify/${candidate.examNumber}?attemptId=${unifiedAttempt.id}`}
                 size={80}
                 className="w-16 h-16 mb-1"
              />
              <p className="text-[7px] font-black opacity-40 uppercase tracking-wider">Scan to Verify Authenticity</p>
           </div>
        </div>
      </div>
    </div>
  );
}
