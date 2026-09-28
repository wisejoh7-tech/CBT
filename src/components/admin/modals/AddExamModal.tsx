import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';

import { Label } from '@/lib/ui/label';

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
  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 space-y-6 border border-primary/5 relative z-10"
      >
        <h3 className="text-xl font-black text-primary mb-6 text-center tracking-tighter uppercase">New Assessment</h3>
        <form onSubmit={handleCreateExam} className="space-y-4 font-medium">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Curriculum Subject</Label>
            <select
              value={newExam.subject}
              onChange={e => setNewExam({...newExam, subject: e.target.value})}
              className="w-full h-12 px-6 rounded-2xl bg-slate-50 border-2 border-primary/20 font-bold text-xs outline-none shadow-inner"
              required
            >
              <option value="">Select Subject</option>
              {offeredSubjects.filter(s => s.isActive).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Subject Title</Label>
            <Input
              placeholder=""
              value={newExam.title}
              onChange={e => setNewExam({...newExam, title: e.target.value})}
              required
              className="h-12 px-6 rounded-2xl bg-slate-50 font-bold shadow-inner text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Session Duration (Minutes)</Label>
            <Input
              type="number"
              placeholder="60"
              value={newExam.durationMinutes}
              onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})}
              required
              className="h-12 px-6 rounded-2xl bg-slate-50 font-bold shadow-inner text-xs"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-14 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all tracking-widest text-xs uppercase">Submit</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-14 px-8 rounded-2xl font-black text-xs border-primary/10 uppercase">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
