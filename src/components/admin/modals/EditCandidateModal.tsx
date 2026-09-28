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
  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-12 space-y-10 border border-primary/5 max-h-[90vh] overflow-y-auto relative z-10">
        <h3 className="text-2xl font-black text-primary mb-8 text-center tracking-tighter">Manage Candidate</h3>
        <form onSubmit={handleUpdateCandidate} className="space-y-8 font-medium">
          <div className="bg-slate-50 p-8 rounded-[32px] space-y-6 border-2 border-primary/5">
            <h4 className="text-[12px] font-black tracking-widest text-primary/40 border-b border-primary/5 pb-3">IDENTIFICATION</h4>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM NUMBER</Label>
              <Input value={candidate.examNumber} disabled className="h-14 px-6 rounded-2xl bg-slate-100 border-none font-bold opacity-50 text-sm" />
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[32px] space-y-6 border-2 border-primary/5">
            <h4 className="text-[12px] font-black tracking-widest text-primary/40 border-b border-primary/5 pb-3">EXAM ASSIGNMENT</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM VENUE / HALL</Label>
                <Input placeholder="Main Hall A" value={candidate.examVenue || ''} onChange={e => setEditingCandidate({...candidate, examVenue: e.target.value})} required className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">ASSIGNED SEAT</Label>
                <Input placeholder="e.g. 42" value={candidate.assignedSeatNumber || ''} onChange={e => setEditingCandidate({...candidate, assignedSeatNumber: e.target.value})} required className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM DATE</Label>
                <Input type="date" value={candidate.examDate || ''} onChange={e => setEditingCandidate({...candidate, examDate: e.target.value})} required className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM TIME</Label>
                <Input type="time" value={candidate.examTime || ''} onChange={e => setEditingCandidate({...candidate, examTime: e.target.value})} required className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-16 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest">UPDATE ASSIGNMENT</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-16 px-10 rounded-2xl font-black text-sm border-primary/10 hover:bg-slate-50">CANCEL</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
