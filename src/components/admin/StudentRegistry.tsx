import React from 'react';
import { Button } from '@/lib/ui/button';
import { Printer, Edit, Trash2, UserPlus } from 'lucide-react';
import { Candidate } from '@/src/types';

interface StudentRegistryProps {
  candidates: Candidate[];
  setShowAddCandidate: (val: boolean) => void;
  setEditingCandidate: (c: Candidate) => void;
  handleDeleteCandidate: (examNumber: string) => void;
  navigate: (path: string) => void;
}

export const StudentRegistry: React.FC<StudentRegistryProps> = ({
  candidates,
  setShowAddCandidate,
  setEditingCandidate,
  handleDeleteCandidate,
  navigate,
}) => {
  return (
    <div className="space-y-4 text-sm font-medium max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-primary/5">
        <div>
          <h3 className="text-xl font-black tracking-tighter  ">Student Registry</h3>
          <p className="text-[14px] font-black ">Managing {candidates.length} candidates</p>
        </div>
        <Button onClick={() => setShowAddCandidate(true)} className="h-10 px-5 rounded-xl bg-primary text-white font-black tracking-widest uppercase text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          <UserPlus className="w-3.5 h-3.5 mr-2" /> Enroll Candidate
        </Button>
      </div>

      <div className="bg-white rounded-[20px] border  overflow-hidden shadow-xl">
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[14px] font-black ">
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 font-bold">
              {candidates.map(c => (
                <tr key={c.examNumber} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center font-black text-primary text-xs uppercase shadow-inner">
                        {c.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs uppercase leading-none mb-1 text-slate-800 truncate max-w-[120px]">{c.fullName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-black text-[9px] tracking-widest uppercase border border-slate-200">
                      {c.examNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                      <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Verified</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" onClick={() => setEditingCandidate(c)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors" onClick={() => navigate(`/exam-slip/${c.examNumber}`)}>
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors" onClick={() => handleDeleteCandidate(c.examNumber)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-slate-200">
                    <p className="text-lg font-black tracking-widest ">No candidates</p>
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
