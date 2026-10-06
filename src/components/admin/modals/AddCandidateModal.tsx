import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { Camera, Trash2, Eye, EyeOff, X, FileCheck } from 'lucide-react';
import { NIGERIAN_STATES, STATE_LGAS } from '@/src/lib/constants/nigeria-data';
import { cn } from '@/src/lib/utils/utils';
import { fileToCompressedDataUrl } from '@/src/lib/utils/image';
import { toast } from 'sonner';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCandidate: any;
  setNewCandidate: (val: any) => void;
  offeredSubjects: any[];
  toggleCandidateSubject: (s: string) => void;
  isCapturing: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-4 text-sm overflow-hidden">
      <div className="cbt-background" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl p-4 sm:p-8 space-y-6 border-2 border-primary/5 max-h-[90vh] overflow-y-auto custom-scrollbar relative z-10"
      >
        <div className="flex justify-between items-center border-b-4 border-primary/5 pb-4 mb-2 uppercase">
           <div className="text-left">
              <h3 className="text-xl font-black text-primary tracking-tight leading-none mb-1">Enroll Student</h3>
              <p className="text-[9px] font-black text-primary/30 tracking-widest uppercase">Administrative Terminal</p>
           </div>
           <Button onClick={onClose} variant="ghost" className="h-10 w-10 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all">
              <X className="w-6 h-6" />
           </Button>
        </div>

        <form onSubmit={handleCreateCandidate} className="space-y-8 font-medium">
          <div className="grid lg:grid-cols-2 gap-x-8 gap-y-6">

            {/* Left Section: Identification & Core Data */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-primary/5 shadow-inner">
                <h4 className="text-[9px] font-black tracking-widest text-primary/30 border-b border-primary/5 pb-2 uppercase">Security & Login</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Exam No. (Auto)</Label>
                    <Input disabled placeholder="Auto-generated" className="h-11 px-4 rounded-xl bg-white/50 border-none font-bold shadow-inner text-xs opacity-50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Email</Label>
                    <Input type="email" placeholder="student@mail.com" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} required className="h-11 px-4 rounded-xl bg-white font-bold shadow-inner text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} placeholder="Min 8" value={newCandidate.password} onChange={e => setNewCandidate({...newCandidate, password: e.target.value})} required className="h-11 px-4 pr-10 rounded-xl bg-white font-bold shadow-inner w-full text-xs" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Confirm</Label>
                    <div className="relative">
                      <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat" value={newCandidate.confirmPassword} onChange={e => setNewCandidate({...newCandidate, confirmPassword: e.target.value})} required className="h-11 px-4 pr-10 rounded-xl bg-white font-bold shadow-inner w-full text-xs" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-2">
                <h4 className="text-[9px] font-black tracking-widest text-primary/30 border-b border-primary/5 pb-2 uppercase">Biographic</h4>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Full Name</Label>
                  <Input placeholder="Full Name" value={newCandidate.fullName} onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})} required className="h-12 px-5 rounded-xl bg-slate-50 border border-primary/5 font-bold text-sm shadow-sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Phone</Label>
                    <Input placeholder="+234..." value={newCandidate.phoneNumber} onChange={e => setNewCandidate({...newCandidate, phoneNumber: e.target.value})} required className="h-11 px-4 rounded-xl bg-slate-50 border border-primary/5 font-bold text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Institution</Label>
                    <Input placeholder="School" value={newCandidate.schoolAttended} onChange={e => setNewCandidate({...newCandidate, schoolAttended: e.target.value})} required className="h-11 px-4 rounded-xl bg-slate-50 border border-primary/5 font-bold text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Date of Birth</Label>
                  <Input type="date" value={newCandidate.dateOfBirth || ''} onChange={e => setNewCandidate({...newCandidate, dateOfBirth: e.target.value})} className="h-11 px-4 rounded-xl bg-slate-50 border border-primary/5 font-bold text-xs" />
                </div>
              </div>
            </div>

            {/* Right Section: Regional & Documentation */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-primary/5 shadow-inner">
                <h4 className="text-[9px] font-black tracking-widest text-primary/30 border-b border-primary/5 pb-2 uppercase">Regional Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">State</Label>
                    <select value={newCandidate.stateOfOrigin} onChange={e => setNewCandidate({ ...newCandidate, stateOfOrigin: e.target.value, lga: '' })} className="w-full h-11 px-4 rounded-xl bg-white border border-primary/5 font-bold text-xs outline-none transition-all shadow-sm" required>
                      <option value="">Select</option>
                      {NIGERIAN_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">LGA</Label>
                    <select value={newCandidate.lga} onChange={e => setNewCandidate({ ...newCandidate, lga: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-white border border-primary/5 font-bold text-xs outline-none transition-all shadow-sm" required disabled={!newCandidate.stateOfOrigin}>
                      <option value="">Select</option>
                      {newCandidate.stateOfOrigin && STATE_LGAS[newCandidate.stateOfOrigin]?.map(lga => (<option key={lga} value={lga}>{lga}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">Residential Address</Label>
                  <Input placeholder="Home Address" value={newCandidate.address} onChange={e => setNewCandidate({...newCandidate, address: e.target.value})} required className="h-11 px-4 rounded-xl bg-white font-bold shadow-inner text-xs" />
                </div>
              </div>

              <div className="space-y-4 px-2">
                <h4 className="text-[9px] font-black tracking-widest text-primary/30 border-b border-primary/5 pb-2 uppercase">Documentation</h4>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-primary/40 tracking-widest uppercase">SSCE Result Document</Label>
                  <div className="relative h-12 flex items-center bg-slate-50 border border-primary/5 rounded-xl px-5 group focus-within:border-primary transition-all cursor-pointer shadow-sm">
                     <Input
                       type="file"
                       accept="image/*,application/pdf"
                       onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           try {
                             const dataUrl = await fileToCompressedDataUrl(file, 1200, 1200, 0.85);
                             setNewCandidate({ ...newCandidate, waecResultUrl: dataUrl });
                             toast.success("Result document attached successfully");
                           } catch (err) {
                             toast.error("Failed to read result document");
                           }
                         }
                       }}
                       className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                     />
                     <div className="flex items-center gap-3 text-primary/30 font-black text-[10px] uppercase">
                        <FileCheck className="w-4 h-4" />
                        {newCandidate.waecResultUrl ? "DOCUMENT LOADED ✓" : "UPLOAD RESULT"}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t-4 border-primary/5">
            <Label className="text-[10px] font-black text-primary/40 tracking-widest block text-center uppercase underline decoration-primary/10 underline-offset-8">Curriculum Combination (Select 4)</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {offeredSubjects.filter(s => s.isActive).map(s => (
                <button key={s.id} type="button" onClick={() => toggleCandidateSubject(s.name)} className={cn("h-10 rounded-xl border-2 font-black text-[9px] transition-all shadow-md flex items-center justify-center px-2 text-center uppercase", newCandidate.subjectCombination.includes(s.name) ? "bg-primary text-white border-primary shadow-primary/20 scale-105" : "bg-slate-50 border-primary/5 text-primary/30 hover:border-primary/20")}>{s.name}</button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_200px] gap-6 items-center bg-slate-50/50 p-6 rounded-[32px] border-2 border-primary/5 shadow-inner">
             <div className="space-y-1.5">
                <h5 className="text-base font-black text-primary tracking-tight uppercase leading-none">Biometrics</h5>
                <p className="text-[9px] font-medium text-primary/40 max-w-lg leading-relaxed uppercase">Capture profile photo for identity verification.</p>
             </div>

             <div className="flex flex-col items-center gap-3">
                {newCandidate.faceUrl ? (
                  <div className="relative group">
                    <img src={newCandidate.faceUrl} className="w-24 h-24 rounded-2xl object-cover border-4 border-primary shadow-xl" />
                    <button type="button" onClick={() => setNewCandidate({...newCandidate, faceUrl: ''})} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ) : isCapturing ? (
                  <div className="space-y-3 text-center w-full">
                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-black aspect-video w-full shadow-lg">
                      <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                    </div>
                    <Button type="button" onClick={capturePhoto} className="h-8 px-4 bg-primary text-white font-black rounded-lg tracking-widest text-[8px] shadow-md uppercase">Capture</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={startCapture} className="w-full aspect-square max-w-[100px] rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/[0.02] transition-all group bg-white shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all"><Camera className="w-5 h-5" /></div>
                      <span className="text-[7px] font-black text-primary/30 tracking-widest uppercase">Start Camera</span>
                    </button>

                    <label htmlFor="admin-passport-file" className="text-[9px] font-black text-primary underline cursor-pointer uppercase">
                      Upload File
                      <input
                        id="admin-passport-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const dataUrl = await fileToCompressedDataUrl(file, 800, 800, 0.85);
                            setNewCandidate({ ...newCandidate, faceUrl: dataUrl });
                          } catch (err) {
                            toast.error("Failed to process passport photo");
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
             </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1 h-14 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xs tracking-widest uppercase">Enroll Student</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-14 px-8 rounded-2xl font-black text-xs border-primary/10 text-primary/40 hover:bg-slate-50 transition-all tracking-widest uppercase">Cancel</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
