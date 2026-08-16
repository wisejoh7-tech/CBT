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
    <div className="space-y-4 text-sm font-medium max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <ShieldCheck className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-xl font-black tracking-tighter uppercase text-slate-800">Administrative Personnel</h3>
              <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase">Authorized {staff.length} staff</p>
           </div>
        </div>
        <Button onClick={() => setShowAddStaff(true)} className="h-10 px-5 rounded-xl bg-primary text-white font-black tracking-widest uppercase text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          <UserPlus className="w-3.5 h-3.5 mr-2" /> Add Staff
        </Button>
      </div>

      <div className="bg-white rounded-[28px] border border-primary/5 overflow-hidden shadow-xl">
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-primary/5 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4 text-center">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 font-bold uppercase">
              {staff.map(s => (
                <tr key={s.id || (s as any).uid} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-primary text-[10px] shadow-inner uppercase">
                        {s.displayName.charAt(0)}
                      </div>
                      <p className="font-black text-xs text-slate-800 tracking-tight">{s.displayName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-[10px] font-bold lowercase tracking-wider">{s.email}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest border",
                      s.role === 'super_admin' ? "border-primary/20 text-primary bg-primary/5" : "border-slate-100 text-slate-500 bg-slate-50"
                    )}>
                      {s.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all active:scale-95" onClick={() => handleDeleteStaff(s.id || (s as any).uid)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-slate-200">
                    <p className="text-lg font-black tracking-widest uppercase">No staff records</p>
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
