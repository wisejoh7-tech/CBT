import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { X, MapPin, Hash, Users, RefreshCw } from 'lucide-react';
import { Candidate } from '@/src/types';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { toast } from 'sonner';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  handleBulkAssign: (data: any) => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  candidates,
  handleBulkAssign,
}) => {
  const [localCandidates, setLocalCandidates] = useState<Candidate[]>([]);
  const [globalConfig, setGlobalConfig] = useState({
    examVenue: '',
    examDate: '',
    examTime: '',
    startSeatNumber: '1'
  });

  useEffect(() => {
    if (isOpen) {
      setLocalCandidates(candidates.map(c => ({ ...c })));
    }
  }, [isOpen, candidates]);

  const applyGlobalConfig = () => {
    let seat = parseInt(globalConfig.startSeatNumber) || 1;
    setLocalCandidates(prev => prev.map(c => ({
      ...c,
      examVenue: globalConfig.examVenue || c.examVenue,
      examDate: globalConfig.examDate || c.examDate,
      examTime: globalConfig.examTime || c.examTime,
      assignedSeatNumber: (seat++).toString()
    })));
    toast.success("Batch configuration applied to preview queue.");
  };

  const regenerateIDs = () => {
    const year = new Date().getFullYear();
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const gen = () => {
      let r = "";
      for (let i = 0; i < 10; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
      return `${year}${r}`;
    };

    setLocalCandidates(prev => prev.map(c => ({ ...c, examNumber: gen() })));
    toast.info("Secure alphanumeric IDs regenerated for all candidates.");
  };

  const updateCandidate = (id: string, field: string, value: string) => {
    setLocalCandidates(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden text-base">
      <div className="cbt-background opacity-[0.1] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="w-full max-w-5xl h-[85vh] bg-white rounded-[20px] shadow-2xl border-2 border-primary/5 flex flex-col overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-primary/5 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl">
                 <Users className="w-7 h-7" />
              </div>
              <div className="text-left">
                 <h3 className="text-1xl font-black tracking-tighter leading-none mb-1">Venue, Date and Time</h3>
                 <p className="text-1xs font-black  ">Configuring {localCandidates.length} records</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <Button onClick={regenerateIDs} variant="outline" className="h-11 px-5 border-2 rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all flex gap-2">
                 <RefreshCw className="w-4 h-4" /> Regenerate Ids
              </Button>
              <Button onClick={onClose} variant="ghost" className="h-12 w-12 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all">
                 <X className="w-8 h-8" />
              </Button>
           </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
           {/* Left Panel: Global Control */}
           <div className="w-full lg:w-[340px] p-8 bg-slate-50/50 border-r-2 border-primary/5 space-y-8 overflow-y-auto">
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-primary/5 pb-3">
                    <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-black">G</div>
                    <h4 className="text-base font-black tracking-tight text-primary uppercase">Parameters</h4>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-xs font-black text-primary/40 tracking-widest uppercase">Venue</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10 group-focus-within:text-primary transition-all" />
                      <Input
                        placeholder="Center Hall B"
                        value={globalConfig.examVenue}
                        onChange={e => setGlobalConfig({...globalConfig, examVenue: e.target.value})}
                        className="h-12 pl-12 rounded-xl bg-white border-none font-bold text-base shadow-inner focus:ring-4 focus:ring-primary/5 uppercase"
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-2xs font-black ">Date</Label>
                      <Input
                        type="date"
                        value={globalConfig.examDate}
                        onChange={e => setGlobalConfig({...globalConfig, examDate: e.target.value})}
                        className="h-12 px-4 rounded-xl bg-white border-none font-bold text-sm shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-2xs font-black ">Arrival</Label>
                      <Input
                        type="time"
                        value={globalConfig.examTime}
                        onChange={e => setGlobalConfig({...globalConfig, examTime: e.target.value})}
                        className="h-12 px-4 rounded-xl bg-white border-none font-bold text-sm shadow-inner"
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-2xs font-black">Commit Seats</Label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10 group-focus-within:text-primary transition-all" />
                      <Input
                        type="number"
                        placeholder="0"
                        value={globalConfig.startSeatNumber}
                        onChange={e => setGlobalConfig({...globalConfig, startSeatNumber: e.target.value})}
                        className="h-12 pl-12 rounded-xl bg-white border-none font-bold text-base shadow-inner"
                      />
                    </div>
                 </div>

                 <Button
                    onClick={applyGlobalConfig}
                    variant="outline"
                    className="w-full h-12 bg-primary text-white border-2 border-primary/20 rounded-1xl font-black text-[10px] hover:bg-primary/5 transition-all "
                 >
                    Apply to Queue
                 </Button>
              </div>

              <div className="pt-1 border-t border-primary/5">
                 <Button
                    onClick={() => handleBulkAssign({ assignments: localCandidates })}
                    className="w-full h-12 border-2 border-primary/20 text-white font-black rounded-1xl shadow-xl shadow-primary/20  hover:bg-primary/10 active:scale-95 transition-all text-base  leading-tight"
                 >
                  Deployment
                 </Button>
              </div>
           </div>

           {/* Right Panel: Individual Review/Edit */}
           <div className="flex-1 flex flex-col bg-white">
              <div className="p-6 border-b-2 border-primary/5 flex justify-between items-center bg-white shrink-0">
                 <div className="flex items-center gap-4">
                    <h4 className="text-lg font-black tracking-tight">Live Queue Review</h4>
                 </div>
              </div>

              <ScrollArea className="flex-1">
                 <div className="p-6">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                       <thead>
                          <tr className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">
                             <th className="px-6 py-2">Profile</th>
                             <th className="px-6 py-2">Parameters</th>
                             <th className="px-6 py-2 text-right">Seat</th>
                          </tr>
                       </thead>
                       <tbody>
                          {localCandidates.map((c, i) => (
                             <tr key={c.id} className="group transition-all duration-300">
                                <td className="bg-slate-50 rounded-l-2xl px-6 py-4">
                                   <div className="flex items-center gap-4">
                                      <div className="w-11 h-11 rounded-xl bg-white border border-primary/5 flex items-center justify-center font-black text-primary text-base uppercase shadow-sm">
                                         {c.fullName.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                         <p className="font-black text-sm text-slate-800 uppercase truncate max-w-[150px] leading-tight mb-1">{c.fullName}</p>
                                         <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate">{c.examNumber}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="bg-slate-50 px-6 py-4">
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                         <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase block">Venue</span>
                                         <input
                                            value={c.examVenue || ''}
                                            onChange={e => updateCandidate(c.id, 'examVenue', e.target.value)}
                                            className="w-full bg-white rounded-lg h-9 px-3 font-black text-xs text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 border-none shadow-sm transition-all uppercase"
                                         />
                                      </div>
                                      <div className="space-y-1.5">
                                         <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase block">Time/Date</span>
                                         <div className="flex gap-1.5">
                                            <input
                                               type="date"
                                               value={c.examDate || ''}
                                               onChange={e => updateCandidate(c.id, 'examDate', e.target.value)}
                                               className="bg-white rounded-lg h-9 px-2 font-black text-[10px] text-slate-700 outline-none border-none shadow-sm w-[90px]"
                                            />
                                            <input
                                               type="time"
                                               value={c.examTime || ''}
                                               onChange={e => updateCandidate(c.id, 'examTime', e.target.value)}
                                               className="bg-white rounded-lg h-9 px-2 font-black text-[10px] text-slate-700 outline-none border-none shadow-sm w-[70px]"
                                            />
                                         </div>
                                      </div>
                                   </div>
                                </td>
                                <td className="bg-slate-50 rounded-r-2xl px-6 py-4 text-right">
                                   <input
                                      type="number"
                                      value={c.assignedSeatNumber || ''}
                                      onChange={e => updateCandidate(c.id, 'assignedSeatNumber', e.target.value)}
                                      className="w-14 bg-primary text-white rounded-lg h-10 px-2 font-black text-lg text-center outline-none focus:ring-4 focus:ring-primary/20 border-none shadow-md transition-all"
                                   />
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </ScrollArea>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
