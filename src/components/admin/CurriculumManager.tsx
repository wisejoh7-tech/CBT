import React from 'react';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';

interface CurriculumManagerProps {
  offeredSubjects: any[];
  setShowAddSubject: (val: boolean) => void;
  toggleSubjectStatus: (id: string) => void;
}

export const CurriculumManager: React.FC<CurriculumManagerProps> = ({
  offeredSubjects,
  setShowAddSubject,
  toggleSubjectStatus,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black uppercase tracking-tighter">Curriculum Management</h3>
        <Button onClick={() => setShowAddSubject(true)} size="sm" variant="ghost" className="text-primary">
          <PlusCircle className="w-4 h-4 mr-2" /> Add Subject
        </Button>
      </div>
      <div className="bg-white rounded-[32px] border border-primary/5 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-primary/5">
            <tr className="text-[9px] font-black text-slate-400 uppercase p-3">
              <th className="p-5">Name</th>
              <th className="p-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {offeredSubjects.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="p-5 font-black uppercase text-[10px]">{s.name}</td>
                <td className="p-5 text-center">
                  <Badge
                    onClick={() => toggleSubjectStatus(s.id)}
                    className={cn(
                      "cursor-pointer border-none text-[8px]",
                      s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}
                  >
                    {s.isActive ? "Active" : "Off"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
