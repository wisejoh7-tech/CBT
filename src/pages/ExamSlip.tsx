import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Candidate } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Printer, ArrowLeft, User, Monitor } from 'lucide-react';
import { getApiUrl, safeJsonResponse, apiFetch } from '@/src/lib/api-config';
import { QRCodeSVG } from '@/src/components/QRCodeSVG';

export default function ExamSlip() {
  const { examNumber } = useParams<{ examNumber: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCandidate() {
      if (!examNumber) return;
      try {
        const res = await apiFetch(getApiUrl(`/candidates/${examNumber}`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setCandidate(await safeJsonResponse(res));
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
    <div className="min-h-screen bg-slate-50/20 py-8 px-4 font-sans relative overflow-x-hidden w-full">
      <div className="cbt-background" />
      <nav className="max-w-4xl mx-auto mb-8 bg-white/80 backdrop-blur-md border-2 border-primary/10 px-6 sm:px-8 py-4 rounded-[24px] flex justify-between items-center shadow-sm relative z-10 w-full">
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

      {/* Button container styled in a responsive grid aligned by column */}
      <div className="max-w-4xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full print:hidden">
        <Button onClick={() => navigate('/')} className="w-full h-12 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-widest gap-2 hover:bg-black shadow-lg transition-all border-none justify-center">
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Button>
        <Button onClick={() => window.print()} className="w-full h-12 px-6 bg-primary text-white rounded-xl font-black text-[11px] tracking-widest shadow-xl active:scale-95 transition-transform border-none justify-center">
          <Printer className="w-5 h-5 mr-2" /> Print Examination Slip
        </Button>
      </div>

      <div className="max-w-4xl mx-auto bg-white border-2 border-primary p-6 sm:p-8 rounded-[30px] relative overflow-hidden print:border-4 print:shadow-none w-full">
        <div className="text-center border-b-2 border-primary/10 pb-6 mb-6">
          <h4 className="text-xl sm:text-2xl font-black text-primary tracking-tight">CBT EXAMINATION SLIP</h4>
          <p className="text-xs sm:text-sm font-black text-primary/50 mt-1">Registration Confirmation • Session 2026</p>
        </div>

        {/* Tabular Form */}
        <div className="w-full overflow-x-auto rounded-2xl border border-primary/20 shadow-sm mb-6">
          <table className="w-full text-left border-collapse bg-white text-xs sm:text-sm">
            <tbody className="divide-y divide-primary/10">
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 w-1/3 sm:w-1/4 border-r border-primary/10">
                  Candidate Photo
                </td>
                <td className="p-3 sm:p-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-2xl border-2 border-primary/20 shadow-md overflow-hidden flex items-center justify-center">
                    {candidate.faceUrl ? (
                      <img src={candidate.faceUrl} alt="Candidate" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary/20" />
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 border-r border-primary/10">
                  Full Name
                </td>
                <td className="p-3 sm:p-4 font-black text-slate-900 text-sm sm:text-base">
                  {candidate.fullName}
                </td>
              </tr>
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 border-r border-primary/10">
                  Exam Number
                </td>
                <td className="p-3 sm:p-4 font-bold text-primary text-sm sm:text-base">
                  {candidate.examNumber}
                </td>
              </tr>
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 border-r border-primary/10">
                  PIN
                </td>
                <td className="p-3 sm:p-4 font-bold tracking-widest text-slate-900">
                  {candidate.pin || <span className="text-xs text-slate-400 font-black">Not Set</span>}
                </td>
              </tr>
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 border-r border-primary/10">
                  Assigned Center
                </td>
                <td className="p-3 sm:p-4 font-bold text-slate-900">
                  <div>{candidate.examVenue || 'Hall 2'}</div>
                  <div className="text-xs font-black text-primary/60 mt-1">
                    Seat: {candidate.assignedSeatNumber || '1'}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 border-r border-primary/10">
                  Schedule Info
                </td>
                <td className="p-3 sm:p-4 font-bold text-slate-900">
                  <div>Date: {candidate.examDate || '2026-10-08'}</div>
                  <div className="text-xs text-slate-600 mt-1">Time: {candidate.examTime || '23:56:00'}</div>
                </td>
              </tr>
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 border-r border-primary/10">
                  Subject Combination
                </td>
                <td className="p-3 sm:p-4 font-bold text-slate-900">
                  {candidate.subjectCombination && candidate.subjectCombination.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside text-xs sm:text-sm">
                      {candidate.subjectCombination.map((subject, index) => (
                        <li key={index} className="text-primary font-bold">{subject}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-1 list-disc list-inside text-xs sm:text-sm">
                      <li className="text-primary font-bold">Chemistry</li>
                      <li className="text-primary font-bold">Mathematics</li>
                      <li className="text-primary font-bold">Physics</li>
                      <li className="text-primary font-bold">English Language</li>
                    </ul>
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-3 sm:p-4 bg-slate-50 font-black text-primary/70 border-r border-primary/10">
                  Security Instructions
                </td>
                <td className="p-3 sm:p-4 font-medium text-slate-800 text-xs sm:text-sm">
                  <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Candidates must arrive 30 minutes before the scheduled time.</li>
                    <li>Biometric verification is mandatory for terminal access.</li>
                    <li>Calculators and mobile devices are strictly prohibited.</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center pt-4 border-t border-primary/10">
          <div className="text-[9px] font-black tracking-widest text-slate-400">
            DIGITAL VERIFICATION AT {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </div>
          <QRCodeSVG
            value={`${window.location.origin}/exam-slip/${candidate.examNumber}`}
            size={70}
            className="w-14 h-14"
          />
        </div>
      </div>
    </div>
  );
}
