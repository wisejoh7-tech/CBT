import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { Cpu, Terminal, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';

interface AuditTrailProps {
  logs: any[];
  handleDeleteLog: (id: string) => void;
  handleClearAllLogs: () => void;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs, handleDeleteLog, handleClearAllLogs }) => {
  return (
    <div className="space-y-4 text-sm font-medium max-w-3xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Terminal className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-xl font-black tracking-tighter uppercase text-slate-800">System Audit</h3>
              <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase">Security logs</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button
            onClick={handleClearAllLogs}
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-xl border-rose-100 text-rose-500 font-black tracking-widest uppercase text-[9px] hover:bg-rose-50 flex gap-2"
           >
             <ShieldAlert className="w-3.5 h-3.5" /> Clear All Logs
           </Button>
           <div className="h-6 w-[1px] bg-slate-100 mx-2" />
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Stream</span>
        </div>
      </div>

      <Card className="h-[450px] overflow-hidden rounded-[28px] border border-primary/5 shadow-xl bg-white flex flex-col">
        <div className="p-3 bg-slate-50/50 border-b border-primary/5 flex items-center gap-6 justify-center">
           <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[8px] font-black uppercase text-slate-400">Auth</span></div>
           <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /><span className="text-[8px] font-black uppercase text-slate-400">Security</span></div>
           <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="text-[8px] font-black uppercase text-slate-400">Exam</span></div>
           <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-900" /><span className="text-[8px] font-black uppercase text-slate-400">System</span></div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l.id} className="p-4 bg-slate-50 rounded-[20px] flex justify-between items-center group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-primary/5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "w-1.5 h-8 rounded-full shrink-0",
                    l.type === 'auth' ? "bg-blue-500" :
                    l.type === 'security' ? "bg-rose-500" :
                    l.type === 'exam' ? "bg-amber-500" : "bg-slate-900"
                  )} />
                  <div className="min-w-0 flex-1 uppercase">
                    <p className="font-bold text-xs text-slate-700 group-hover:text-primary transition-colors truncate pr-2">{l.message}</p>
                    <p className="text-[8px] font-black text-slate-300 mt-0.5 tracking-widest leading-none">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge className="text-[8px] font-black border-none bg-white text-slate-400 px-3 py-1 rounded-full shadow-sm uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">{l.type}</Badge>
                   <button
                    onClick={() => handleDeleteLog(l.id)}
                    className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
               <div className="h-[300px] flex flex-col items-center justify-center opacity-10">
                  <Cpu className="w-16 h-16 mb-4" />
                  <p className="text-xl font-black uppercase tracking-[0.4em]">No logs</p>
               </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
