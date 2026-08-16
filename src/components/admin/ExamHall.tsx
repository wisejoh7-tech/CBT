import React from 'react';
import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { cn } from '@/src/lib/utils/utils';

interface ExamHallProps {
  seats: any[];
  handleGenerateSeats: () => void;
}

export const ExamHall: React.FC<ExamHallProps> = ({ seats, handleGenerateSeats }) => {
  return (
    <div className="space-y-6">
      <Card className="p-8 rounded-[32px] bg-white shadow-xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-black text-md uppercase tracking-tight leading-none mb-1">Center Hall Visualization</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Operational Environment v1.0</p>
          </div>
          {seats.length === 0 && <Button onClick={handleGenerateSeats} size="sm">Initialize 50 Seats</Button>}
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
          {seats.length === 0 ? (
            <div className="col-span-full py-12 text-center opacity-10 font-black uppercase border-2 border-dashed border-primary/10 rounded-[24px] text-xs">
              Hall not initialized
            </div>
          ) : (
            seats.map(s => (
              <div key={s.id} className={cn(
                "aspect-square rounded-lg flex items-center justify-center font-black text-[8px] border-2 transition-all",
                s.status === 'occupied' ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md" : "bg-slate-50 border-slate-100 text-slate-200"
              )}>
                {s.seatNumber}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
