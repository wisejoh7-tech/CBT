import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  newStaff: any;
  setNewStaff: (val: any) => void;
  handleCreateStaff: (e: React.FormEvent) => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  newStaff,
  setNewStaff,
  handleCreateStaff,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 space-y-6 border border-primary/5">
        <h3 className="text-lg font-black uppercase text-primary mb-6 text-center">Provision Staff</h3>
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            placeholder="Display Name"
            value={newStaff.displayName}
            onChange={e => setNewStaff({...newStaff, displayName: e.target.value})}
            required
            className="h-12 px-5 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
          />
          <Input
            type="email"
            placeholder="Institutional Email"
            value={newStaff.email}
            onChange={e => setNewStaff({...newStaff, email: e.target.value})}
            required
            className="h-12 px-5 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="password"
              placeholder="Password"
              value={newStaff.password}
              onChange={e => setNewStaff({...newStaff, password: e.target.value})}
              required
              className="h-12 px-5 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
            />
            <Input
              type="password"
              placeholder="Confirm"
              value={newStaff.confirmPassword}
              onChange={e => setNewStaff({...newStaff, confirmPassword: e.target.value})}
              required
              className="h-12 px-5 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
            />
          </div>
          <select
            value={newStaff.role}
            onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
            className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none uppercase shadow-inner"
          >
            <option value="admin">Administrator</option>
            <option value="reg_admin">Registry Officer</option>
          </select>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-12 bg-primary text-white font-black uppercase rounded-xl shadow-lg">Finalize</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-12 px-6 rounded-xl font-black uppercase">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
