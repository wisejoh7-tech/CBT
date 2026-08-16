import React from 'react';
import { Card } from '@/lib/ui/card';
import { Badge } from '@/lib/ui/badge';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { MessageCircle, Send } from 'lucide-react';
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
  chatEndRef: React.RefObject<HTMLDivElement>;
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
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr_350px] gap-6 h-[70vh]">
        <div className="space-y-6 h-full flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black uppercase tracking-tighter">Proctor Surveillance</h3>
            <Badge className="bg-emerald-500 text-white animate-pulse text-[8px]">
              {activeAttempts.length} Active sessions
            </Badge>
          </div>
          <ScrollArea className="flex-1 pr-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeAttempts.map(s => (
                <Card key={s.id} className="p-5 rounded-[24px] bg-white shadow-md border-l-4 border-emerald-500 relative">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-[10px] uppercase truncate max-w-[120px]">
                        {candidates.find(c => c.examNumber === s.userId)?.fullName || s.userId}
                      </p>
                      <p className="text-[7px] font-bold opacity-30 uppercase tracking-widest mt-0.5">Session {s.id.substring(0, 4)}</p>
                    </div>
                    <Badge className={cn("border-none text-[8px]", (s.trustScore || 100) < 70 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500")}>
                      {Math.round(s.trustScore || 100)}%
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setViewingSnaps(s.id)} size="sm" variant="ghost" className="flex-1 bg-slate-50 text-slate-400 h-8 text-[9px] uppercase font-black">Snaps</Button>
                    <Button onClick={() => setActiveChatId(s.userId)} size="icon" className="bg-primary/5 text-primary h-8 w-8">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
        <Card className="flex flex-col rounded-[32px] shadow-xl border border-primary/5 overflow-hidden bg-white">
          <div className="p-6 border-b border-primary/5 bg-slate-50/50 font-black text-[9px] uppercase tracking-widest text-primary flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" /> Proctor Chat
          </div>
          {activeChatId ? (
            <>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-3">
                  {messages.filter(m => m.from === activeChatId || (m.from === 'admin' && m.to === activeChatId)).map((m, i) => (
                    <div key={i} className={cn("flex flex-col", m.from === 'admin' ? "items-end" : "items-start")}>
                      <div className={cn("max-w-[90%] p-3 rounded-xl font-bold text-xs shadow-sm", m.from === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none")}>
                        {m.message}
                      </div>
                      <span className="text-[7px] font-black opacity-20 mt-0.5 uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <form onSubmit={sendChatMessage} className="p-4 border-t border-primary/5 bg-white flex gap-2">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Authorized message..." className="h-10 rounded-lg bg-slate-50 border-none font-bold shadow-inner text-xs" />
                <Button type="submit" size="icon" className="h-10 w-10 rounded-lg bg-primary text-white shadow-lg">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-center p-8 uppercase font-black text-[8px] tracking-widest">
              Engage terminal to chat
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
