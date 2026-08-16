import React from 'react';
import { Button } from '@/lib/ui/button';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black uppercase tracking-tighter">Assessment Modules</h3>
        <Button onClick={() => setShowAddExam(true)} size="sm" className="bg-primary text-white">Create New Module</Button>
      </div>
      <div className="bg-white rounded-[32px] border border-primary/5 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-primary/5">
            <tr className="text-[9px] font-black text-slate-400 uppercase p-3">
              <th className="p-5">Assessment</th>
              <th className="p-5">Subject</th>
              <th className="p-8 text-right">Setup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {exams.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="p-5 font-black uppercase text-[10px]">{e.title}</td>
                <td className="p-5 font-bold text-slate-400 text-[9px] uppercase">{e.subject}</td>
                <td className="p-5 text-right">
                  <Button variant="outline" size="sm" onClick={() => { setActiveTab('questions'); setSelectedExamId(e.id); }} className="text-[7px] font-black uppercase h-6 px-2">
                    Manage Questions
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
