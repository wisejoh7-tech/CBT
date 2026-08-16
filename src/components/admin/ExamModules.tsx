import React from 'react';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Activity, PlusCircle, Settings2 } from 'lucide-react';
import { Exam } from '@/src/types';

interface ExamModulesProps {
  exams: Exam[];
  setShowAddExam: (val: boolean) => void;
  setActiveTab: (val: string) => void;
  setSelectedExamId: (id: string) => void;
}

export const ExamModules: React.FC<ExamModulesProps> = ({
  exams,
  setShowAddExam,
  setActiveTab,
  setSelectedExamId,
}) => {
  return (
    <div className="space-y-4 text-sm font-medium max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <Activity className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-xl font-black tracking-tighter ">Assessment Modules</h3>
              <p className="text-[14px] font-black ">Managing {exams.length} exam containers</p>
           </div>
        </div>
        <Button onClick={() => setShowAddExam(true)} className="h-10 px-5 rounded-xl bg-primary text-white font-black tracking-widest uppercase text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          <PlusCircle className="w-3.5 h-3.5 mr-2" /> New Subject
        </Button>
      </div>

      <div className="bg-white rounded-[28px] border border-primary/5 overflow-hidden shadow-xl">
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-primary/5 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[14px] font-black  uppercase">
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
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => { setActiveTab('questions'); setSelectedExamId(e.id); }} className="h-8 px-4 rounded-lg border-2 border-primary/10 text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Manage
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
