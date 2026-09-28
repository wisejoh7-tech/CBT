import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';

import { Label } from '@/lib/ui/label';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  newOfferedSubject: string;
  setNewOfferedSubject: (val: string) => void;
  handleCreateOfferedSubject: (e: React.FormEvent) => void;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  newOfferedSubject,
  setNewOfferedSubject,
  handleCreateOfferedSubject,
}) => {
  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 space-y-6 border border-primary/5 relative z-10"
      >
        <h3 className="text-xl font-black text-center text-primary mb-4 tracking-tighter ">Add Subject</h3>
        <form onSubmit={handleCreateOfferedSubject} className="space-y-4 font-medium">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest text-center block ">Subject Name</Label>
            <Input
              placeholder="Enter subject"
              value={newOfferedSubject}
              onChange={e => setNewOfferedSubject(e.target.value)}
              required
              className="h-12 px-6 rounded-2xl bg-slate-50 font-bold text-center shadow-inner text-xs"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-14 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all tracking-widest text-xs ">Confirm</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-14 px-8 rounded-2xl font-black text-xs border-primary/10 ">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
