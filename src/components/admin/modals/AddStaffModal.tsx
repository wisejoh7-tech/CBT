import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background opacity-[0.05] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 space-y-6 border border-primary/5 relative z-10"
      >
        <h3 className="text-xl font-black text-primary mb-6 text-center tracking-tighter uppercase">Staff Registration</h3>
        <form onSubmit={handleCreateStaff} className="space-y-4 font-medium">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Full Name</Label>
            <Input
              placeholder="Full Name"
              value={newStaff.displayName}
              onChange={e => setNewStaff({...newStaff, displayName: e.target.value})}
              required
              className="h-12 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Email Address</Label>
            <Input
              type="email"
              placeholder="Enter email"
              value={newStaff.email}
              onChange={e => setNewStaff({...newStaff, email: e.target.value})}
              required
              className="h-12 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars"
                value={newStaff.password}
                onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                required
                className="h-12 w-full px-6 pr-12 rounded-2xl bg-slate-50 border-none font-bold shadow-inner text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Confirm Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={newStaff.confirmPassword}
                onChange={e => setNewStaff({...newStaff, confirmPassword: e.target.value})}
                required
                className="h-12 w-full px-6 pr-12 rounded-2xl bg-slate-50 border-none font-bold shadow-inner text-xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Access Level</Label>
            <select
              value={newStaff.role}
              onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
              className="w-full h-12 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none shadow-inner"
            >
              <option value="admin">Administrator</option>
              <option value="reg_admin">Registry Officer</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-14 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all tracking-widest text-xs uppercase">Provision Account</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-14 px-8 rounded-2xl font-black text-xs border-primary/10 hover:bg-slate-50 uppercase">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
