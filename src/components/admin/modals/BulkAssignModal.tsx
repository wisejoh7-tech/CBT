import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';
import { Label } from '@/lib/ui/label';
import { X, MapPin, Calendar, Clock, Hash } from 'lucide-react';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleBulkAssign: (data: any) => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  handleBulkAssign,
}) => {
  const [data, setData] = useState({
    examVenue: '',
    examDate: '',
    examTime: '',
    startSeatNumber: '1'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 text-base">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-12 space-y-10 border border-primary/5">
        <div className="flex justify-between items-center">
           <div className="text-left">
              <h3 className="text-3xl font-black text-primary tracking-tighter leading-none mb-2">Automated Seating</h3>
              <p className="text-xs font-black text-primary/30 tracking-[0.4em]">BULK SESSION CONFIGURATION</p>
           </div>
           <Button onClick={onClose} variant="ghost" className="h-12 w-12 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all">
              <X className="w-8 h-8" />
           </Button>
        </div>

        <div className="space-y-8">
           <div className="space-y-4">
              <Label className="text-xs font-black text-primary/40 tracking-widest ml-1">ASSIGNMENT VENUE</Label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/10 group-focus-within:text-primary transition-all" />
                <Input
                  placeholder="e.g. Main Hall A"
                  value={data.examVenue}
                  onChange={e => setData({...data, examVenue: e.target.value})}
                  className="h-18 pl-18 rounded-[24px] bg-slate-50 border-4 border-primary/5 focus:border-primary font-black text-xl shadow-inner"
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-xs font-black text-primary/40 tracking-widest ml-1">EXAM DATE</Label>
                <div className="relative group">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/10 group-focus-within:text-primary transition-all" />
                  <Input
                    type="date"
                    value={data.examDate}
                    onChange={e => setData({...data, examDate: e.target.value})}
                    className="h-18 pl-18 rounded-[24px] bg-slate-50 border-4 border-primary/5 focus:border-primary font-black text-xl shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-xs font-black text-primary/40 tracking-widest ml-1">EXAM TIME</Label>
                <div className="relative group">
                  <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/10 group-focus-within:text-primary transition-all" />
                  <Input
                    type="time"
                    value={data.examTime}
                    onChange={e => setData({...data, examTime: e.target.value})}
                    className="h-18 pl-18 rounded-[24px] bg-slate-50 border-4 border-primary/5 focus:border-primary font-black text-xl shadow-inner"
                  />
                </div>
              </div>
           </div>

           <div className="space-y-4">
              <Label className="text-xs font-black text-primary/40 tracking-widest ml-1">STARTING SEAT NUMBER</Label>
              <div className="relative group">
                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/10 group-focus-within:text-primary transition-all" />
                <Input
                  type="number"
                  placeholder="1"
                  value={data.startSeatNumber}
                  onChange={e => setData({...data, startSeatNumber: e.target.value})}
                  className="h-18 pl-18 rounded-[24px] bg-slate-50 border-4 border-primary/5 focus:border-primary font-black text-xl shadow-inner"
                />
              </div>
              <p className="text-xs font-bold text-primary/20 px-4">System will auto-increment from this number for all students.</p>
           </div>
        </div>

        <div className="flex gap-8 pt-6">
          <Button
            onClick={() => handleBulkAssign(data)}
            className="flex-1 h-20 bg-primary text-white font-black rounded-[32px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-base tracking-[0.3em]"
          >
            EXECUTE BULK ASSIGNMENT
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
