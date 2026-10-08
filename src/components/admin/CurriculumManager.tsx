import React from 'react';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { PlusCircle, BookMarked, Trash2, Send } from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';

interface CurriculumManagerProps {
  offeredSubjects: any[];
  setShowAddSubject: (val: boolean) => void;
  toggleSubjectStatus: (id: string) => void;
  handleDeleteSubject: (id: string) => void;
  handleReleaseAllSubjects?: () => void;
}

export const CurriculumManager: React.FC<CurriculumManagerProps> = ({
  offeredSubjects,
  setShowAddSubject,
  toggleSubjectStatus,
  handleDeleteSubject,
  handleReleaseAllSubjects,
}) => {
  return (
    <div className="space-y-4 text-sm font-medium max-w-3xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <BookMarked className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-xl font-black tracking-tighter ">Curriculum</h3>
              <p className="text-[13px] font-black ">Managing {offeredSubjects.length} subjects</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {handleReleaseAllSubjects && (
            <Button onClick={handleReleaseAllSubjects} className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all">
              <Send className="w-3.5 h-3.5 mr-2" /> Release All to Exam Player
            </Button>
          )}
          <Button onClick={() => setShowAddSubject(true)} className="h-10 px-5 rounded-xl bg-primary text-white font-black tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <PlusCircle className="w-3.5 h-3.5 mr-2" /> Add Subject
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-primary/5 overflow-hidden shadow-xl">
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-primary/5 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[14px] font-black  ">
                <th className="px-6 py-4">Identification</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 font-bold uppercase">
              {offeredSubjects.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] shadow-sm">
                        {s.name.charAt(0)}
                      </div>
                      <p className="font-black text-xs text-slate-800 tracking-tight">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge
                      onClick={() => toggleSubjectStatus(s.id)}
                      className={cn(
                        "cursor-pointer border-none text-[9px] font-black px-4 py-1.5 rounded-full shadow-md transition-all active:scale-95 uppercase tracking-widest",
                        s.isActive
                          ? "bg-emerald-500 text-white shadow-emerald-200"
                          : "bg-slate-200 text-slate-400 shadow-slate-100"
                      )}
                    >
                      {s.isActive ? "Live" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubject(s.id)}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {offeredSubjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-16 text-center">
                    <p className="text-lg font-black">Database empty</p>
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
