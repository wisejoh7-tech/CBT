import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Candidate, Attempt } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Printer, ArrowLeft, ShieldCheck, BadgeCheck } from 'lucide-react';
import { Separator } from '@/lib/ui/separator';
import { Badge } from '@/lib/ui/badge';
import { useAuth } from '@/src/context/AuthContext';
import { auth } from '@/src/lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function ResultSlip() {
  const { examNumber } = useParams<{ examNumber: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [unifiedAttempt, setUnifiedAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    async function fetchResultData() {
      if (!examNumber) return;
      try {
        setLoading(true);

        // Step 0: Ensure session for rules
        if (!user) {
          await signInAnonymously(auth);
        }

        const normalizedNumber = examNumber.trim().toUpperCase();

        // 1. Fetch Candidate
        const candSnap = await getDocs(query(collection(db, 'candidates'), where('examNumber', '==', normalizedNumber)));
        if (candSnap.empty) {
          console.error("No candidate found");
          setLoading(false);
          return;
        }
        const candData = { id: candSnap.docs[0].id, ...candSnap.docs[0].data() } as Candidate;
        setCandidate(candData);

        // 2. Fetch Unified Result
        // userId could be the registration number, the candidate document ID, or the user's UID
        const searchIds = Array.from(new Set([candData.id, candData.examNumber, normalizedNumber, examNumber.trim()]));

        const qUnified = query(
          collection(db, 'attempts'),
          where('userId', 'in', searchIds),
          where('examId', '==', 'unified')
        );
        const unifiedSnap = await getDocs(qUnified);

        if (!unifiedSnap.empty) {
          const data = { id: unifiedSnap.docs[0].id, ...unifiedSnap.docs[0].data() };
          setUnifiedAttempt(data);
        } else {
          console.warn("No unified attempt record found for candidate");
        }
      } catch (error) {
        console.error("Error fetching result slip:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResultData();
  }, [examNumber, user]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-primary animate-pulse  tracking-widest">Generating Official Transcript...</div>;

  if (!candidate || !unifiedAttempt) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <ShieldCheck className="w-16 h-16 text-primary/20" />
        <h2 className="text-2xl font-black  text-primary">Result Not Available</h2>
        <p className="text-primary/40 font-bold  text-[10px] max-w-xs">This result has not been released or the record is invalid. Please contact the administration.</p>
        <Button onClick={() => navigate('/')} className="bg-primary text-white font-black  rounded-xl h-12 px-8 shadow-xl border-none transition-all">Back to Portal</Button>
      </div>
    );
  }

  const results = unifiedAttempt.results || [];
  const totalScore = results.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0) || Number(unifiedAttempt.score) || 0;
  const totalPossible = results.reduce((acc: number, curr: any) => acc + (Number(curr.totalPossible) || 0), 0) || Number(unifiedAttempt.totalPossible) || 0;

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-4 print:p-0 print:bg-white selection:bg-primary/10 font-sans">
      {/* Print Controls (Hidden on Print) */}
      <div className="max-w-2xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="text-primary/40 hover:text-primary font-black  text-[10px] tracking-widest gap-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={() => window.print()}
          className="bg-primary text-white font-black  text-[11px] tracking-widest gap-3 rounded-2xl h-14 px-10 shadow-2xl shadow-primary/20 border-none hover:bg-primary/90"
        >
          <Printer className="w-5 h-5" /> Print Official Result
        </Button>
      </div>

      {/* Official Result Slip Paper */}
      <div className="max-w-2xl mx-auto bg-white border-[4px] border-primary p-6 rounded-[40px] shadow-2xl shadow-primary/10 relative overflow-hidden print:border-4 print:rounded-none print:shadow-none print:p-8 print:m-0">

        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-12">
           <span className="text-[100px] font-black text-primary">VIVI</span>
        </div>

        {/* Header Section */}
        <div className="relative z-10 text-center border-b-2 border-primary/10 pb-5 mb-5">
          <div className="inline-flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/20">V</div>
            <div className="text-left">
              <h1 className="text-1xl font-black  tracking-tighter text-primary leading-none">VIVI CBT OFFICIAL RESULT</h1>
              <p className="text-[9px] font-black text-primary/40  tracking-[0.5em] mt-1">Unified Examination Standards</p>
            </div>
          </div>
          <h2 className="text-1xl font-black text-primary  tracking-[0.2em] bg-primary/5 py-2 rounded-1xl border-2 border-primary/10 relative">
            Official Performance Result
            {unifiedAttempt.released ? (
              <div className="absolute -top-3 -right-4 bg-sky-500 text-white text-[7px] font-black px-2 py-1 rounded-full shadow-lg transform rotate-6 border-2 border-white  tracking-widest uppercase">
                Released & Published
              </div>
            ) : (
              <div className="absolute -top-3 -right-4 bg-amber-500 text-white text-[7px] font-black px-2 py-1 rounded-full shadow-lg transform rotate-6 border-2 border-white  tracking-widest uppercase">
                Verification Completed
              </div>
            )}
          </h2>
          <p className="text-[10px] font-bold text-primary/50 mt-4 tracking-[0.20em]">Official Original Result &bull; Session: 2026</p>
          <p className="text-[8px] font-black text-rose-500 mt-2 tracking-[0.3em] uppercase print:hidden animate-pulse">
            Instruction: Print in Landscape Orientation
          </p>
        </div>

        {/* Candidate Identity Section */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1 flex justify-center">
            <div className="w-24 h-24 rounded-[24px] bg-primary/5 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center ring-4 ring-primary/5 shrink-0">
              {candidate.faceUrl ? (
                <img src={candidate.faceUrl} alt="Candidate" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary/10 font-black text-2xl ">Photo</span>
              )}
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-y-4 gap-x-6 py-1">
            <div>
              <p className="text-[10px] font-black text-primary/20  tracking-widest mb-1">Full  Name</p>
              <p className="text-1xl font-black  text-primary tracking-tight leading-tight">{candidate.fullName}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary/20  tracking-widest mb-1">Registration Number</p>
              <p className="text-1xl font-black text-primary tracking-tight">{candidate.examNumber}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary/20  tracking-widest mb-1">Date of Birth</p>
              <p className="text-1xl font-bold text-primary/60">{candidate.dateOfBirth || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-primary/20  tracking-widest mb-1">Terminal Signature</p>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-6 h-6 text-sky-400" />
                <span className="text-1xl font-black text-sky-400  tracking-tighter">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Performance Table */}
        <div className="relative z-10 border-2 border-primary/10 rounded-[24px] overflow-hidden mb-8 bg-white shadow-lg font-sans">
          <table className="w-full">
            <thead className="bg-primary/5 text-primary">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-black  tracking-[0.3em] uppercase">Subjects</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-black  tracking-[0.3em] uppercase">Score Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-primary/5">
              {results.length > 0 ? (
                results.map((res: any, i: number) => (
                  <tr key={i} className="hover:bg-primary/[0.01]">
                    <td className="px-4 py-2 text-sm font-black text-primary  tracking-tight">{res.subject}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-lg font-black text-primary">{res.score}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-2 text-sm font-black text-primary  tracking-tight">{unifiedAttempt.subject || "Unified Consolidated Assessment"}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-lg font-black text-primary">{unifiedAttempt.score}</span>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-primary text-white">
              <tr>
                <td className="px-4 py-3.5 text-xs font-black  tracking-[0.4em] uppercase">Aggregate Score</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <p className="text-xl font-black leading-none">{totalScore}</p>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Integrity Section */}
        <div className="relative z-10 border-t-2 border-primary/10 pt-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-end mb-2">

             <div className="text-right">
                <p className="text-[10px] font-black text-primary/30  tracking-widest mb-1">Authenticity Date</p>
                <p className="text-[10px] font-bold text-primary/60 ">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
             </div>
          </div>


        </div>

        {/* Security Seals */}
        <div className="absolute top-8 right-8 w-20 h-20 border-4 border-sky-400 rounded-full flex items-center justify-center rotate-12 opacity-40">
           <div className="text-center">
              <p className="text-[7px] font-black text-sky-400  leading-none">VIVI</p>
              <p className="text-[5px] font-black text-sky-400 ">OFFICIAL</p>
              <p className="text-[5px] font-black text-sky-400 ">SEAL</p>
           </div>
        </div>

      </div>
    </div>
  );
}
