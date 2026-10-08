import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-4xl bg-white rounded-[48px] shadow-2xl p-12 space-y-10 border border-primary/5 max-h-[90vh] overflow-y-auto relative z-10">
        <h3 className="text-2xl font-black text-primary mb-8 text-center tracking-tighter">Manage Candidate</h3>
        <form onSubmit={handleUpdateCandidate} className="space-y-8 font-medium">
          <div className="bg-slate-50 p-8 rounded-[32px] space-y-6 border-2 border-primary/5">
            <h4 className="text-[12px] font-black tracking-widest text-primary/40 border-b border-primary/5 pb-3">PERSONAL INFORMATION</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM NUMBER</Label>
                <Input value={candidate.examNumber} disabled className="h-14 px-6 rounded-2xl bg-slate-100 border-none font-bold opacity-50 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">FULL NAME</Label>
                <Input placeholder="Full Name" value={candidate.fullName || ''} onChange={e => setEditingCandidate({...candidate, fullName: e.target.value})} required className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EMAIL</Label>
                <Input type="email" placeholder="Email" value={candidate.email || ''} onChange={e => setEditingCandidate({...candidate, email: e.target.value})} required className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">PHONE NUMBER</Label>
                <Input placeholder="Phone Number" value={candidate.phoneNumber || ''} onChange={e => setEditingCandidate({...candidate, phoneNumber: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">STATE OF ORIGIN</Label>
                <Input placeholder="State of Origin" value={candidate.stateOfOrigin || ''} onChange={e => setEditingCandidate({...candidate, stateOfOrigin: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">LGA</Label>
                <Input placeholder="LGA" value={candidate.lga || ''} onChange={e => setEditingCandidate({...candidate, lga: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">SCHOOL ATTENDED</Label>
                <Input placeholder="School Attended" value={candidate.schoolAttended || ''} onChange={e => setEditingCandidate({...candidate, schoolAttended: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">ADDRESS</Label>
                <Input placeholder="Address" value={candidate.address || ''} onChange={e => setEditingCandidate({...candidate, address: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[32px] space-y-6 border-2 border-primary/5">
            <h4 className="text-[12px] font-black tracking-widest text-primary/40 border-b border-primary/5 pb-3">EXAM ASSIGNMENT</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM VENUE / HALL</Label>
                <Input placeholder="Main Hall A" value={candidate.examVenue || ''} onChange={e => setEditingCandidate({...candidate, examVenue: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">ASSIGNED SEAT</Label>
                <Input placeholder="e.g. 42" value={candidate.assignedSeatNumber || ''} onChange={e => setEditingCandidate({...candidate, assignedSeatNumber: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM DATE</Label>
                <Input type="date" value={candidate.examDate || ''} onChange={e => setEditingCandidate({...candidate, examDate: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-primary/40 tracking-widest">EXAM TIME</Label>
                <Input type="time" value={candidate.examTime || ''} onChange={e => setEditingCandidate({...candidate, examTime: e.target.value})} className="h-14 px-6 rounded-2xl bg-white border-none font-bold shadow-inner text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-16 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest">SAVE CANDIDATE DETAILS</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-16 px-10 rounded-2xl font-black text-sm border-primary/10 hover:bg-slate-50">CANCEL</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
