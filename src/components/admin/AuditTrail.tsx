import React from 'react';
import { Card } from '@/lib/ui/card';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';

interface AuditTrailProps {
  logs: any[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black uppercase tracking-tighter">Global Audit Trail</h3>
      <Card className="h-[550px] overflow-hidden rounded-[32px] border border-primary/5 shadow-xl bg-white flex flex-col">
        <ScrollArea className="flex-1 p-5">
          <div className="space-y-2.5">
            {logs.map(l => (
              <div key={l.id} className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center group">
                <div>
                  <p className="font-bold text-[9px] uppercase text-primary group-hover:text-black transition-colors">{l.message}</p>
                  <p className="text-[7px] opacity-20 mt-0.5 uppercase">{new Date(l.timestamp).toLocaleString()}</p>
                </div>
                <Badge className="text-[6px] border-none bg-primary/5 text-primary uppercase">{l.type}</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
