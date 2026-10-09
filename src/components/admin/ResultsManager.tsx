import React from 'react';
import { Button } from '@/lib/ui/button';
import { Award, Send, CheckCircle2, Eye, RefreshCw, RotateCcw, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Attempt, Candidate, Exam } from '@/src/types';
import { cn } from '@/src/lib/utils/utils';
import { formatResultData, formatAllCandidatesResultData, downloadCSV, downloadExcel } from '@/src/lib/exportResults';
import { toast } from 'sonner';

interface ResultsManagerProps {
  attempts: Attempt[];
  candidates: Candidate[];
  exams?: Exam[];
  handleReleaseResult: (id: string) => void;
  handleResetResult?: (id: string) => void;
  setViewingSnaps: (id: string | null) => void;
  fetchData: () => void;
}

export const ResultsManager: React.FC<ResultsManagerProps> = ({
  attempts,
  candidates,
  exams = [],
  handleReleaseResult,
  handleResetResult,
  setViewingSnaps,
  fetchData,
}) => {
  const completedAttempts = attempts.filter(a => a.status === 'completed');

  const handleExportCSV = (exportAllCandidates: boolean = false) => {
    try {
      const data = exportAllCandidates
        ? formatAllCandidatesResultData(candidates, attempts, exams)
        : formatResultData(completedAttempts, candidates, exams);

      if (data.length === 0) {
        toast.error("No result data available to export");
        return;
      }

      const filename = exportAllCandidates
        ? `all_student_scores_${new Date().toISOString().slice(0, 10)}.csv`
        : `completed_exam_results_${new Date().toISOString().slice(0, 10)}.csv`;

      downloadCSV(data, filename);
      toast.success(`Exported ${data.length} student results to CSV`);
    } catch (err: any) {
      toast.error("Failed to export CSV: " + (err.message || err));
    }
  };

  const handleExportExcel = (exportAllCandidates: boolean = false) => {
    try {
      const data = exportAllCandidates
        ? formatAllCandidatesResultData(candidates, attempts, exams)
        : formatResultData(completedAttempts, candidates, exams);

      if (data.length === 0) {
        toast.error("No result data available to export");
        return;
      }

      const filename = exportAllCandidates
        ? `all_student_scores_${new Date().toISOString().slice(0, 10)}.xlsx`
        : `completed_exam_results_${new Date().toISOString().slice(0, 10)}.xlsx`;

      downloadExcel(data, filename, exportAllCandidates ? "All Student Scores" : "Exam Results");
      toast.success(`Exported ${data.length} student results to Excel (.xlsx)`);
    } catch (err: any) {
      toast.error("Failed to export Excel: " + (err.message || err));
    }
  };

  return (
    <div className="space-y-4 text-sm font-medium max-w-5xl mx-auto w-full max-w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-primary/5 w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full lg:w-auto">
          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-inner shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-black tracking-tighter leading-tight break-words">Result Release Center</h3>
            <p className="text-xs sm:text-[13px] font-bold sm:font-black text-slate-500 break-words whitespace-normal leading-snug mt-0.5">
              Managing {completedAttempts.length} completed sessions ({candidates.length} total enrolled candidates)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <Button
            onClick={() => handleExportCSV(false)}
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border-slate-200 text-slate-700 font-black text-[10px] gap-1.5 sm:gap-2 hover:bg-slate-50 hover:text-primary transition-all flex-1 sm:flex-initial justify-center"
            title="Download completed results as CSV"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>CSV (RESULTS)</span>
          </Button>

          <Button
            onClick={() => handleExportExcel(false)}
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border-emerald-200 text-emerald-800 bg-emerald-50/50 font-black text-[10px] gap-1.5 sm:gap-2 hover:bg-emerald-100 transition-all flex-1 sm:flex-initial justify-center"
            title="Download completed results as Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>EXCEL (RESULTS)</span>
          </Button>

          <Button
            onClick={() => handleExportExcel(true)}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-primary text-white font-black text-[10px] gap-1.5 sm:gap-2 hover:bg-primary/90 shadow-md transition-all flex-1 sm:flex-initial justify-center"
            title="Download scores for all candidates as Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>EXPORT ALL SCORES</span>
          </Button>

          <Button
            onClick={fetchData}
            variant="ghost"
            size="sm"
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border border-primary/10 text-primary font-black text-[10px] gap-1.5 hover:bg-primary/5 transition-all shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">REFRESH</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-primary/5 overflow-hidden shadow-xl w-full">
        <div className="max-h-[500px] overflow-x-auto overflow-y-auto custom-scrollbar w-full">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50/50 border-b border-primary/5 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[14px] font-black">
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
                          <p className="font-black text-xs text-slate-800 truncate max-w-[150px]">
                            {candidate?.fullName || a.userId}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 tracking-widest">{a.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-primary">
                          {a.score} / {a.totalPossible}
                        </span>
                        <span className="text-[7px] text-slate-300">verified raw score</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setViewingSnaps(a.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black flex items-center gap-1.5 mx-auto transition-all",
                          trustScore < 80
                            ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        )}
                      >
                        <Eye className="w-3 h-3" />
                        {Math.round(trustScore)}% TRUST
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isReleased ? (
                          <div className="inline-flex items-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black tracking-widest uppercase">PUBLISHED</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleReleaseResult(a.id)}
                            className="h-9 px-4 bg-slate-900 text-white rounded-xl font-black text-[12px] tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95"
                          >
                            <Send className="w-3 h-3 mr-2" /> RELEASE NOW
                          </Button>
                        )}
                        {handleResetResult && (
                          <Button
                            onClick={() => handleResetResult(a.id)}
                            variant="outline"
                            className="h-9 px-3 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-black text-[10px] tracking-widest transition-all"
                            title="Reset Candidate Session & Clear Attempt"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> RESET
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {completedAttempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-24 text-center opacity-40">
                    <Award className="w-16 h-16 mx-auto mb-2 text-primary" />
                    <p className="text-1xl font-black text-slate-700">No completed exams yet</p>
                    <p className="text-xs font-bold mt-2 text-slate-400">
                      Results will appear here for verification once candidates submit.
                    </p>
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
