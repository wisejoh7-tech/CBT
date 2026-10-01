import React from 'react';
import { Card } from '@/lib/ui/card';
import { Badge } from '@/lib/ui/badge';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { MessageCircle, Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Attempt, Candidate } from '@/src/types';
import { cn } from '@/src/lib/utils/utils';

interface ProctoringSecurityProps {
  attempts: Attempt[];
  candidates: Candidate[];
  activeChatId: string | null;
  messages: any[];
  newMessage: string;
  setNewMessage: (val: string) => void;
  setActiveChatId: (id: string | null) => void;
  setViewingSnaps: (id: string | null) => void;
  sendChatMessage: (e: React.FormEvent) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ProctoringSecurity: React.FC<ProctoringSecurityProps> = ({
  attempts,
  candidates,
  activeChatId,
  messages,
  newMessage,
  setNewMessage,
  setActiveChatId,
  setViewingSnaps,
  sendChatMessage,
  chatEndRef,
}) => {
  const activeAttempts = attempts.filter(a => a.status === 'in-progress');

  return (
    <div className="space-y-4 text-sm font-medium h-[calc(100vh-200px)] max-w-5xl mx-auto relative z-10">
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 h-full">
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-primary/5 shrink-0">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-xl font-black tracking-tighter uppercase text-slate-800 leading-none mb-1">Surveillance</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity & Integrity monitoring</p>
               </div>
            </div>
            <Badge className="bg-emerald-500 text-white animate-pulse text-[9px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-emerald-200 tracking-widest uppercase">
              {activeAttempts.length} Online
            </Badge>
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
              {activeAttempts.map(s => {
                const candidate = candidates.find(c => c.examNumber === s.userId);
                const isWarning = (s.trustScore || 100) < 70;

                return (
                  <Card key={s.id} className={cn(
                    "p-5 rounded-[32px] bg-white shadow-xl border-l-[8px] relative hover:scale-[1.02] transition-all duration-300",
                    isWarning ? "border-rose-500 shadow-rose-100" : "border-emerald-500 shadow-emerald-100"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <p className="font-black text-sm text-slate-800 uppercase truncate max-w-[130px] tracking-tight">
                          {candidate?.fullName || s.userId}
                        </p>
                        <div className="flex flex-wrap gap-1">
                           <Badge variant="outline" className="bg-slate-50 border-none text-[7px] font-black tracking-widest uppercase px-2 py-0.5">{candidate?.examVenue?.substring(0, 10) || 'HALL A'}</Badge>
                           <Badge variant="outline" className="bg-slate-50 border-none text-[7px] font-black tracking-widest uppercase px-2 py-0.5">SEAT: {candidate?.assignedSeatNumber || '-'}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={cn("text-xl font-black leading-none", isWarning ? "text-rose-500" : "text-emerald-500")}>
                           {Math.round(s.trustScore || 100)}%
                         </p>
                         <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">Trust Matrix</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={() => setViewingSnaps(s.id)} variant="ghost" className="flex-1 bg-slate-50 text-slate-500 h-9 text-[8px] font-black hover:bg-primary/5 hover:text-primary rounded-xl tracking-widest uppercase border border-slate-100">VIEW FEED</Button>
                      <Button onClick={() => setActiveChatId(s.userId)} size="icon" className={cn("h-9 w-9 rounded-xl transition-all shadow-md", activeChatId === s.userId ? "bg-primary text-white" : "bg-primary/5 text-primary hover:bg-primary/10")}>
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
            {activeAttempts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 py-16">
                 <ShieldAlert className="w-16 h-16 mb-4" />
                 <p className="text-lg font-black tracking-[0.4em] uppercase text-center">No active <br/> sessions</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <Card className="flex flex-col rounded-[32px] shadow-xl border border-primary/5 overflow-hidden bg-white h-full relative z-20">
          <div className="p-5 border-b border-primary/5 bg-slate-900 text-white font-black text-[9px] tracking-[0.3em] flex items-center gap-3 uppercase">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
            Control
          </div>

          {activeChatId ? (
            <>
              <div className="bg-slate-50 p-4 border-b border-primary/5">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Engaged with</p>
                 <p className="font-black text-[11px] text-primary uppercase truncate">{candidates.find(c => c.examNumber === activeChatId)?.fullName}</p>
              </div>

              <ScrollArea className="flex-1 p-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                <div className="space-y-4">
                  {messages.filter(m => m.from === activeChatId || (m.from === 'admin' && m.to === activeChatId)).map((m, i) => (
                    <div key={i} className={cn("flex flex-col", m.from === 'admin' ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[95%] p-3.5 rounded-[20px] font-bold text-[11px] shadow-sm transition-all leading-tight",
                        m.from === 'admin'
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      )}>
                        {m.message}
                      </div>
                      <span className="text-[7px] font-black opacity-20 mt-1.5 mx-2 uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <form onSubmit={sendChatMessage} className="p-4 border-t border-primary/5 bg-white flex gap-2">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Protocol instruction..." className="h-10 rounded-xl bg-slate-50 border-none font-bold shadow-inner text-[10px] px-4 flex-1 focus:ring-2 focus:ring-primary/5 transition-all" />
                <Button type="submit" size="icon" className="h-10 w-10 rounded-xl bg-primary text-white shadow-md hover:scale-105 active:scale-95 transition-all">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-center p-8 font-black text-sm tracking-[0.2em] leading-relaxed uppercase">
              Select Session <br/> To Monitor
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
