import React from 'react';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Activity, PlusCircle, Settings2, Trash2, Send } from 'lucide-react';
import { Exam } from '@/src/types';

interface ExamModulesProps {
  exams: Exam[];
  setShowAddExam: (val: boolean) => void;
  setActiveTab: (val: string) => void;
  setSelectedExamId: (id: string) => void;
  handleDeleteExam: (id: string) => void;
  handleReleaseAllSubjects?: () => void;
}

export const ExamModules: React.FC<ExamModulesProps> = ({
  exams,
  setShowAddExam,
  setActiveTab,
  setSelectedExamId,
  handleDeleteExam,
  handleReleaseAllSubjects,
}) => {
  return (
    <div className="space-y-4 text-xs font-medium max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary shadow-inner">
              <Activity className="w-4 h-4" />
           </div>
           <div>
              <h3 className="text-base font-black tracking-tight">Assessment Modules</h3>
              <p className="text-[11px] font-bold text-slate-500">Managing {exams.length} exam containers</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {handleReleaseAllSubjects && (
            <Button onClick={handleReleaseAllSubjects} className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest uppercase text-[9px] shadow-md shadow-emerald-600/20 hover:scale-105 transition-all">
              <Send className="w-3.5 h-3.5 mr-1.5" /> Release All Subjects
            </Button>
          )}
          <Button onClick={() => setShowAddExam(true)} className="h-8 px-4 rounded-xl bg-primary text-white font-black tracking-widest uppercase text-[9px] shadow-md shadow-primary/20 hover:scale-105 transition-all">
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> New Assessment
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-primary/5 overflow-hidden shadow-xl">
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-primary/5 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-xs font-black uppercase">
                <th className="px-6 py-4">Assessment Title</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Parameters</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 font-bold uppercase">
              {exams.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-6 py-4">
                    <p className="font-black text-xs text-slate-800 tracking-tight">{e.title}</p>
                    <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">ID: {e.id.substring(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="border-primary/10 text-primary font-black text-[9px] px-3 py-0.5 rounded-lg uppercase tracking-wider">{e.subject}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-slate-700 leading-none">{e.durationMinutes} Minutes</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setActiveTab('questions'); setSelectedExamId(e.id); }} className="h-8 px-4 rounded-lg border-2 border-primary/10 text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Manage
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExam(e.id)}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center ">
                    <p className="text-lg font-black ">No modules found</p>
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
