import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/lib/ui/button';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { CircleX, Eye } from 'lucide-react';
import { Attempt } from '@/src/types';
import { cn } from '@/src/lib/utils/utils';

interface EvidenceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId: string | null;
  attempts: Attempt[];
}

export const EvidenceReviewModal: React.FC<EvidenceReviewModalProps> = ({
  isOpen,
  onClose,
  attemptId,
  attempts,
}) => {
  const currentAttempt = attempts.find(s => s.id === attemptId) as any;

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 overflow-hidden">
      <div className="cbt-background" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col h-[80vh] relative z-10"
      >
        <div className="p-6 bg-primary text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xs font-black tracking-widest uppercase">Evidence Review</h3>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">{attemptId}</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-white/40 h-10 w-10 hover:bg-white/10 transition-colors">
            <CircleX className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 flex-1 overflow-hidden text-sm font-medium">
          <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentAttempt?.proctoringSnaps?.map((snap: string, i: number) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-primary/5 relative group shadow-sm">
                  <img src={snap} className="w-full h-full object-cover grayscale contrast-125 transition-transform duration-500 group-hover:scale-110" alt={`Snap ${i}`} />
                  <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button variant="ghost" size="icon" className="text-white" onClick={() => window.open(snap)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )) || <div className="col-span-full py-20 text-center opacity-10 font-black text-xs uppercase tracking-widest">No visual data recorded</div>}
            </div>
          </ScrollArea>
          <div className="flex flex-col h-full gap-4">
            <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase px-2">Anomaly Log</h4>
            <ScrollArea className="flex-1 bg-slate-50 p-4 rounded-[32px] border border-primary/5 shadow-inner">
              <div className="space-y-3">
                {currentAttempt?.violationLogs?.map((v: any, i: number) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className={cn("absolute left-0 top-0 w-1 h-full", v.severity === 'critical' ? "bg-rose-500" : "bg-amber-500")} />
                    <p className="text-[8px] font-black opacity-30 uppercase">{new Date(v.timestamp).toLocaleTimeString()}</p>
                    <p className="text-[10px] font-bold text-slate-700 mt-1 leading-tight uppercase tracking-tight">{v.reason}</p>
                  </div>
                )) || <p className="text-[9px] font-black opacity-10 italic text-center py-10 uppercase tracking-widest">Clear session record</p>}
              </div>
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
