import React from 'react';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Trash2 } from 'lucide-react';
import { UserProfile } from '@/src/types';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black uppercase tracking-tighter">Personnel Management</h3>
        <Button onClick={() => setShowAddStaff(true)} size="sm">Provision New Account</Button>
      </div>
      <div className="bg-white rounded-[32px] border border-primary/5 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-primary/5">
            <tr className="text-[9px] font-black text-slate-400 uppercase p-3">
              <th className="p-5">Member</th>
              <th className="p-5 text-center">Role</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="p-5 font-black uppercase text-[10px]">{s.displayName}</td>
                <td className="p-5 text-center">
                  <Badge variant="outline" className="text-[6px] uppercase font-black">{s.role}</Badge>
                </td>
                <td className="p-5 text-right">
                  <Button variant="ghost" size="icon" className="text-rose-500 h-8 w-8" onClick={() => handleDeleteStaff(s.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
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
