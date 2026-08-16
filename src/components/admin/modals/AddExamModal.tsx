import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  newExam: { title: string; subject: string; durationMinutes: number };
  setNewExam: (val: any) => void;
  offeredSubjects: any[];
  handleCreateExam: (e: React.FormEvent) => void;
}

export const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  newExam,
  setNewExam,
  offeredSubjects,
  handleCreateExam,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 space-y-6 border border-primary/5">
        <h3 className="text-lg font-black uppercase text-primary mb-6 text-center">New Exam Module</h3>
        <form onSubmit={handleCreateExam} className="space-y-4">
          <select
            value={newExam.subject}
            onChange={e => setNewExam({...newExam, subject: e.target.value})}
            className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none uppercase shadow-inner"
            required
          >
            <option value="">Select Subject</option>
            {offeredSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <Input
            placeholder="Assessment Title"
            value={newExam.title}
            onChange={e => setNewExam({...newExam, title: e.target.value})}
            required
            className="h-12 px-5 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
          />
          <Input
            type="number"
            placeholder="Duration (min)"
            value={newExam.durationMinutes}
            onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})}
            required
            className="h-12 px-5 rounded-xl bg-slate-50 border-none font-bold shadow-inner"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-12 bg-primary text-white font-black uppercase rounded-xl shadow-lg">Initialize</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-12 px-6 rounded-xl font-black uppercase">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
