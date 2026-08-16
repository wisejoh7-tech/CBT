import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 space-y-6 border border-primary/5">
        <h3 className="text-lg font-black uppercase text-center text-primary mb-6">Add Subject</h3>
        <form onSubmit={handleCreateOfferedSubject} className="space-y-4">
          <Input
            placeholder="Curricular Name"
            value={newOfferedSubject}
            onChange={e => setNewOfferedSubject(e.target.value)}
            required
            className="h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-center shadow-inner"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-12 bg-primary text-white font-black uppercase rounded-xl shadow-lg">Confirm</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-12 rounded-xl font-black uppercase px-6">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
