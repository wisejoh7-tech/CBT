import React from 'react';
import { Button } from '@/lib/ui/button';
import { Printer } from 'lucide-react';
import { Candidate } from '@/src/types';

interface StudentRegistryProps {
  candidates: Candidate[];
  setShowAddCandidate: (val: boolean) => void;
  navigate: (path: string) => void;
}

export const StudentRegistry: React.FC<StudentRegistryProps> = ({
  candidates,
  setShowAddCandidate,
  navigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black uppercase tracking-tighter">Student Registry</h3>
        <Button onClick={() => setShowAddCandidate(true)} size="sm">Enroll New Student</Button>
      </div>
      <div className="bg-white rounded-[32px] border border-primary/5 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-primary/5">
            <tr className="text-[9px] font-black text-slate-400 uppercase p-3">
              <th className="p-6">Student</th>
              <th className="p-6">Access ID</th>
              <th className="p-6">Subjects</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {candidates.map(c => (
              <tr key={c.examNumber} className="hover:bg-slate-50/30 transition-colors">
                <td className="p-6 font-black uppercase text-[10px]">{c.fullName}</td>
                <td className="p-6 font-bold text-primary text-[10px]">{c.examNumber}</td>
                <td className="p-6 font-bold text-slate-400 text-[9px] uppercase">{(c.subjectCombination || []).join(', ')}</td>
                <td className="p-6 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/exam-slip/${c.examNumber}`)}>
                    <Printer className="w-3.5 h-3.5" />
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
