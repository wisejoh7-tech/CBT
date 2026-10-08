import React from 'react';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Trash2, UserPlus, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/src/types';
import { cn } from '@/src/lib/utils/utils';

interface PersonnelManagerProps {
  staff: UserProfile[];
  setShowAddStaff: (val: boolean) => void;
  handleDeleteStaff: (id: string) => void;
}

export const PersonnelManager: React.FC<PersonnelManagerProps> = ({
  staff,
  setShowAddStaff,
  handleDeleteStaff,
}) => {
  return (
    <div className="space-y-4 text-xs font-medium max-w-4xl mx-auto w-full">
      <div className="flex flex-row justify-between items-center gap-3 bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-primary/5 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-inner shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
           </div>
           <div className="min-w-0">
              <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight uppercase text-slate-800 truncate">Administrative Personnel</h3>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase truncate">Authorized {staff.length} staff</p>
           </div>
        </div>
        <Button onClick={() => setShowAddStaff(true)} className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl bg-primary text-white font-black tracking-wider sm:tracking-widest uppercase text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all shrink-0">
          <UserPlus className="w-3.5 h-3.5 mr-1.5 sm:mr-2" /> Add Staff
        </Button>
      </div>

      <div className="bg-white rounded-[28px] border border-primary/5 overflow-hidden shadow-xl w-full">
        <div className="max-h-[450px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-primary/5 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[9px] font-black text-slate-400 tracking-[0.15em] uppercase">
                <th className="px-4 sm:px-6 py-3.5 sm:py-4">Full Name</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4">Email Address</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-center">Role</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 font-bold uppercase text-[11px] sm:text-xs">
              {staff.map(s => (
                <tr key={s.id || (s as any).uid} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-primary text-[9px] sm:text-[10px] shadow-inner uppercase shrink-0">
                        {s.displayName.charAt(0)}
                      </div>
                      <p className="font-black text-xs text-slate-800 tracking-tight truncate">{s.displayName}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-slate-400 text-[10px] font-bold lowercase tracking-wider truncate">{s.email}</td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-center">
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black px-3 sm:px-4 py-0.5 sm:py-1 rounded-full uppercase tracking-wider border whitespace-nowrap",
                      s.role === 'super_admin' ? "border-primary/20 text-primary bg-primary/5" : "border-slate-100 text-slate-500 bg-slate-50"
                    )}>
                      {s.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all active:scale-95 shrink-0" onClick={() => handleDeleteStaff(s.id || (s as any).uid)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 sm:p-16 text-center text-slate-200">
                    <p className="text-base sm:text-lg font-black tracking-widest uppercase">No staff records</p>
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
