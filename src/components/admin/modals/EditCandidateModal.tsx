import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { Candidate } from '@/src/types';

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  handleUpdateCandidate: (e: React.FormEvent) => void;
  setEditingCandidate: (val: any) => void;
}

export const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  handleUpdateCandidate,
  setEditingCandidate,
}) => {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl bg-white rounded-[48px] shadow-2xl p-10 space-y-8 border border-primary/5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black uppercase text-primary mb-8 text-center">Manage Candidate</h3>
        <form onSubmit={handleUpdateCandidate} className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border-2 border-primary/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/40 border-b border-primary/5 pb-2">Identification</h4>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Exam Number</Label>
              <Input value={candidate.examNumber} disabled className="h-12 px-6 rounded-xl bg-slate-100 border-none font-bold opacity-50" />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border-2 border-primary/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/40 border-b border-primary/5 pb-2">Exam Assignment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Exam Venue / Hall</Label>
                <Input placeholder="Main Hall A" value={candidate.examVenue || ''} onChange={e => setEditingCandidate({...candidate, examVenue: e.target.value})} className="h-12 px-6 rounded-xl bg-white border-none font-bold shadow-inner" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Assigned Seat</Label>
                <Input placeholder="e.g. 42" value={candidate.assignedSeatNumber || ''} onChange={e => setEditingCandidate({...candidate, assignedSeatNumber: e.target.value})} className="h-12 px-6 rounded-xl bg-white border-none font-bold shadow-inner" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Exam Date</Label>
                <Input type="date" value={candidate.examDate || ''} onChange={e => setEditingCandidate({...candidate, examDate: e.target.value})} className="h-12 px-6 rounded-xl bg-white border-none font-bold shadow-inner" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Exam Time</Label>
                <Input type="time" value={candidate.examTime || ''} onChange={e => setEditingCandidate({...candidate, examTime: e.target.value})} className="h-12 px-6 rounded-xl bg-white border-none font-bold shadow-inner" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1 h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl">Update Assignment</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-14 rounded-2xl font-black uppercase">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
