import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { Camera, Trash2 } from 'lucide-react';
import { NIGERIAN_STATES, STATE_LGAS } from '@/src/lib/constants/nigeria-data';
import { cn } from '@/src/lib/utils/utils';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCandidate: any;
  setNewCandidate: (val: any) => void;
  offeredSubjects: any[];
  toggleCandidateSubject: (s: string) => void;
  isCapturing: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCapture: () => void;
  capturePhoto: () => void;
  handleCreateCandidate: (e: React.FormEvent) => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  newCandidate,
  setNewCandidate,
  offeredSubjects,
  toggleCandidateSubject,
  isCapturing,
  videoRef,
  startCapture,
  capturePhoto,
  handleCreateCandidate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-10 space-y-8 border border-primary/5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black uppercase text-primary mb-8 text-center">Enroll Student</h3>
        <form onSubmit={handleCreateCandidate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Full Name</Label>
              <Input placeholder="Surname Firstname" value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Email Address</Label>
              <Input type="email" placeholder="student@example.com" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Phone Number</Label>
              <Input placeholder="+234..." value={newCandidate.phoneNumber} onChange={e => setNewCandidate({...newCandidate, phoneNumber: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Institution</Label>
              <Input placeholder="School Attended" value={newCandidate.schoolAttended} onChange={e => setNewCandidate({...newCandidate, schoolAttended: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Country</Label>
              <Input placeholder="Nigeria" value={newCandidate.country} onChange={e => setNewCandidate({...newCandidate, country: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">City</Label>
              <Input placeholder="Lagos" value={newCandidate.city} onChange={e => setNewCandidate({...newCandidate, city: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">State of Origin</Label>
              <select value={newCandidate.stateOfOrigin} onChange={e => setNewCandidate({ ...newCandidate, stateOfOrigin: e.target.value, lga: '' })} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none uppercase shadow-inner" required>
                <option value="">Select State</option>
                {NIGERIAN_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">LGA</Label>
              <select value={newCandidate.lga} onChange={e => setNewCandidate({ ...newCandidate, lga: e.target.value })} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none uppercase shadow-inner" required disabled={!newCandidate.stateOfOrigin}>
                <option value="">Select LGA</option>
                {newCandidate.stateOfOrigin && STATE_LGAS[newCandidate.stateOfOrigin]?.map(lga => (<option key={lga} value={lga}>{lga}</option>))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Residential Address</Label>
            <Input placeholder="Home Address" value={newCandidate.address} onChange={e => setNewCandidate({...newCandidate, address: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Access Password</Label>
              <Input type="password" placeholder="••••••••" value={newCandidate.password} onChange={e => setNewCandidate({...newCandidate, password: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase">Confirm Password</Label>
              <Input type="password" placeholder="••••••••" value={newCandidate.confirmPassword} onChange={e => setNewCandidate({...newCandidate, confirmPassword: e.target.value})} required className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold shadow-inner" />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase flex justify-between">Select 4 Subjects <span>({newCandidate.subjectCombination.length}/4)</span></Label>
            <div className="grid grid-cols-3 gap-2">
              {offeredSubjects.filter(s => s.isActive).map(s => (
                <button key={s.id} type="button" onClick={() => toggleCandidateSubject(s.name)} className={cn("h-10 rounded-xl border-2 font-black text-[9px] transition-all", newCandidate.subjectCombination.includes(s.name) ? "bg-primary text-white border-primary" : "bg-slate-50 border-primary/5 text-primary/40 hover:border-primary/20")}>{s.name}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 py-6 bg-slate-50 rounded-3xl border-2 border-dashed border-primary/10">
            {newCandidate.faceUrl ? (
              <div className="relative group">
                <img src={newCandidate.faceUrl} className="w-32 h-32 rounded-2xl object-cover border-4 border-primary shadow-xl" />
                <button type="button" onClick={() => setNewCandidate({...newCandidate, faceUrl: ''})} className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
              </div>
            ) : isCapturing ? (
              <div className="space-y-4 text-center">
                <div className="relative overflow-hidden rounded-2xl border-4 border-primary/20 bg-black w-48 h-48">
                  <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                </div>
                <Button type="button" onClick={capturePhoto} className="h-10 px-8 bg-primary text-white font-black rounded-xl uppercase tracking-widest text-[10px]">Capture Biometrics</Button>
              </div>
            ) : (
              <button type="button" onClick={startCapture} className="flex flex-col items-center gap-2 text-primary/40 hover:text-primary transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center"><Camera className="w-8 h-8" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Start Biometric Capture</span>
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1 h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl">Enroll Student</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-14 rounded-2xl font-black uppercase">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
