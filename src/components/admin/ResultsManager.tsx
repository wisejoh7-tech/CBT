import React from 'react';
import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Award, Send, CheckCircle2, Eye, RefreshCw } from 'lucide-react';
import { Attempt, Candidate } from '@/src/types';
import { cn } from '@/src/lib/utils/utils';

interface ResultsManagerProps {
  attempts: Attempt[];
  candidates: Candidate[];
  handleReleaseResult: (id: string) => void;
  setViewingSnaps: (id: string | null) => void;
  fetchData: () => void;
}

export const ResultsManager: React.FC<ResultsManagerProps> = ({
  attempts,
  candidates,
  handleReleaseResult,
  setViewingSnaps,
  fetchData,
}) => {
  const completedAttempts = attempts.filter(a => a.status === 'completed');

  return (
    <div className="space-y-4 text-sm font-medium max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <Award className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-xl font-black tracking-tighter">Result Release Center</h3>
              <p className="text-[13px] font-black">Managing {completedAttempts.length} completed sessions</p>
           </div>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="h-10 px-4 rounded-xl border-primary/10 text-primary font-black text-[9px] gap-2 hover:bg-primary/5 transition-all">
           <RefreshCw className="w-3.5 h-3.5" /> REFRESH DATA
        </Button>
      </div>

      <div className="bg-white rounded-[28px] border border-primary/5 overflow-hidden shadow-xl">
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-primary/5 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[14px] font-black ">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-center">Security</th>
                <th className="px-6 py-4 text-right">Publication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 font-bold uppercase">
              {completedAttempts.map(a => {
                const candidate = candidates.find(c => c.examNumber === a.userId);
                const trustScore = a.trustScore ?? 100;
                const isReleased = a.released || a.isReleased;
                return (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-primary text-[10px] shadow-sm">
                          {candidate?.fullName?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                           <p className="font-black text-xs text-slate-800 truncate max-w-[150px]">{candidate?.fullName || a.userId}</p>
                           <p className="text-[8px] font-bold text-slate-400 tracking-widest">{a.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-primary">{a.score} / {a.totalPossible}</span>
                        <span className="text-[7px] text-slate-300">verified raw score</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button
                        onClick={() => setViewingSnaps(a.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black flex items-center gap-1.5 mx-auto transition-all",
                          trustScore < 80 ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        )}
                       >
                         <Eye className="w-3 h-3" />
                         {Math.round(trustScore)}% TRUST
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isReleased ? (
                        <div className="inline-flex items-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black tracking-widest uppercase">PUBLISHED</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleReleaseResult(a.id)}
                          className="h-9 px-4 bg-slate-900 text-white rounded-xl font-black text-[12px] tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 "
                        >
                          <Send className="w-3 h-3 mr-2" /> RELEASE NOW
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {completedAttempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-24 text-center opacity-10">
                    <Award className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-1xl font-black ">No completed exams</p>
                    <p className="text-xs font-bold mt-2">Results will appear here for verification once candidates submit.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
