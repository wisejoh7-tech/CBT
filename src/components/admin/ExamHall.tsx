import React from 'react';
import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { MapPin, Calendar, Clock, Users, Send, Monitor, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Candidate, Exam } from '@/src/types';
import { getApiUrl, apiFetch } from '@/src/lib/api-config';

interface ExamHallProps {
  seats: any[];
  candidates: Candidate[];
  exams: Exam[];
  handleGenerateSeats: () => void;
  setShowBulkAssign: (val: boolean) => void;
  handleAssignExamToAll: (examId: string) => void;
  setEditingCandidate: (c: Candidate) => void;
}

export const ExamHall: React.FC<ExamHallProps> = ({
  seats,
  candidates,
  exams,
  handleGenerateSeats,
  setShowBulkAssign,
  handleAssignExamToAll,
  setEditingCandidate
}) => {
  const [selectedExamId, setSelectedExamId] = React.useState('');
  const [sessionLabel, setSessionLabel] = React.useState('Aug 20');

  return (
    <div className="space-y-6 text-sm font-medium w-full max-w-7xl mx-auto px-4 md:px-6 pb-20">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-4 rounded-2xl bg-white border border-primary/5 shadow-md flex items-center gap-4">
           <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0"><Users className="w-5 h-5" /></div>
           <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Enrolled</p>
              <p className="font-black text-xl text-primary leading-none uppercase truncate">{candidates.length}</p>
           </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border border-primary/5 shadow-md flex items-center gap-4">
           <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><Calendar className="w-5 h-5" /></div>
           <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Session</p>
              <input
                value={sessionLabel}
                onChange={e => setSessionLabel(e.target.value)}
                className="font-black text-sm bg-transparent border-none outline-none focus:text-primary transition-colors p-0 w-full"
                placeholder="Set Date"
              />
           </div>
        </Card>

        <Card onClick={() => setShowBulkAssign(true)} className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg flex items-center gap-4 cursor-pointer hover:bg-black transition-all group">
           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Clock className="w-5 h-5" /></div>
           <div>
              <p className="text-[10px] font-black text-white/30 tracking-widest mb-0.5 uppercase">Logic</p>
              <p className="font-black text-sm leading-none uppercase">Assign</p>
           </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border-2 border-primary shadow-md flex flex-col justify-center gap-2">
           <div className="flex gap-2">
             <select
               value={selectedExamId}
               onChange={e => setSelectedExamId(e.target.value)}
               className="flex-1 h-8 rounded-lg bg-slate-50 border-none font-bold text-[10px] outline-none px-2 uppercase focus:ring-4 focus:ring-primary/5 min-w-0"
             >
               <option value="">Module</option>
               {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
             </select>
             <Button
               disabled={!selectedExamId}
               onClick={() => handleAssignExamToAll(selectedExamId)}
               size="icon"
               className="h-8 w-8 rounded-lg bg-primary text-white shadow-md shrink-0 hover:scale-105 transition-transform"
             >
               <Send className="w-4 h-4" />
             </Button>
           </div>
           <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest text-center leading-none">Push to Terminals</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 md:gap-8 items-start">
        {/* Terminal Map Section */}
        <Card className="p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-white shadow-xl border border-primary/5 h-[600px] md:h-[800px] lg:h-[1000px] flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 border-b border-primary/5 pb-6 gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg md:text-xl tracking-tighter leading-none mb-1.5 uppercase text-slate-800">Terminal Map</h3>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px] md:text-[9px] px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Free: {seats.filter(s => s.status !== 'occupied').length}</Badge>
                   <Badge className="bg-primary/5 text-primary border-none font-black text-[8px] md:text-[9px] px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Active: {seats.filter(s => s.status === 'occupied').length}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {seats.length > 0 && (
                <Button
                  onClick={async () => {
                    if(!confirm("Clear all terminals from map?")) return;
                    await apiFetch(getApiUrl('/center/seats/bulk'), {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`},
                      body: JSON.stringify({ count: 0 })
                    });
                    window.location.reload();
                  }}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-xl border-rose-100 text-rose-500 font-black tracking-widest uppercase text-[9px] hover:bg-rose-50 flex-1 sm:flex-none"
                >
                  Clear
                </Button>
              )}
              <Button onClick={handleGenerateSeats} size="sm" className="h-10 px-6 rounded-xl bg-slate-900 text-white font-black tracking-widest uppercase text-[9px] shadow-lg hover:bg-black transition-all flex-1 sm:flex-none">
                {seats.length > 0 ? "RESET (100)" : "Initialize"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
            <div className="min-w-[600px] sm:min-w-[800px] pb-10">
              <div className="grid grid-cols-10 gap-2 md:gap-3">
                {seats.length === 0 ? (
                  <div className="col-span-full py-32 md:py-40 text-center">
                    <Info className="w-10 h-10 md:w-12 md:h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-xs md:text-sm font-black text-slate-200 tracking-[0.4em] uppercase">Infrastructure Offline</p>
                  </div>
                ) : (
                  [...seats]
                    .sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber))
                    .map(s => {
                      const assignedCandidate = candidates.find(c => c.assignedSeatNumber === s.seatNumber);
                      return (
                        <div
                          key={s.id}
                          onClick={() => assignedCandidate && setEditingCandidate(assignedCandidate)}
                          className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 shadow-sm group relative overflow-hidden border-2 min-h-[50px] sm:min-h-[75px]",
                            s.status === 'occupied' || assignedCandidate
                              ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-emerald-100 ring-4 ring-emerald-500/5 cursor-pointer hover:scale-105 md:hover:scale-110"
                              : "bg-slate-50 border-slate-100 text-slate-300 cursor-default"
                          )}
                        >
                          <span className="font-black text-[9px] md:text-[11px] leading-none mb-1 md:mb-1.5">{s.seatNumber}</span>
                          {assignedCandidate && (
                             <span className="text-[6px] md:text-[8px] font-black uppercase text-emerald-600/80 truncate w-full text-center px-1 md:px-1.5">
                                {assignedCandidate.fullName.split(' ')[0]}
                             </span>
                          )}
                          <div className={cn(
                            "absolute top-0 right-0 w-1.5 h-1.5 md:w-2 md:h-2 rounded-bl-md",
                            s.status === 'occupied' || assignedCandidate ? "bg-emerald-500" : "bg-slate-200"
                          )} />
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Enrollment Queue Sidebar */}
        <Card className="flex flex-col rounded-[32px] md:rounded-[40px] shadow-xl border border-primary/5 overflow-hidden bg-white h-[600px] md:h-[800px] lg:h-[1000px]">
          <div className="p-6 border-b border-primary/5 font-black text-[13px] text-primary flex items-center gap-3 shrink-0 uppercase tracking-widest">
            <Users className="w-4 h-4" /> Enrollment Queue
          </div>
          <ScrollArea className="flex-1 p-4">
             <div className="space-y-2">
                {candidates.map(c => (
                  <div key={c.examNumber} onClick={() => setEditingCandidate(c)} className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-transparent hover:border-primary/10 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                     <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-primary/30 text-[10px] shadow-inner shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                       {c.assignedSeatNumber || '?'}
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="font-black text-[10px] text-slate-800 uppercase truncate leading-none mb-1">{c.fullName}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{c.examNumber}</p>
                     </div>
                  </div>
                ))}
                {candidates.length === 0 && (
                   <div className="py-12 text-center opacity-10 flex flex-col items-center gap-3">
                      <Users className="w-10 h-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest leading-loose text-center">No active <br/> registrations</p>
                   </div>
                )}
             </div>
          </ScrollArea>
          <div className="p-4 bg-slate-50/50 border-t border-primary/5 shrink-0">
            <p className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest">Live System Synchronization</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
