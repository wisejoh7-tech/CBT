import React from 'react';
import { Card } from '@/lib/ui/card';
import { Badge } from '@/lib/ui/badge';
import { Users, Activity, BarChart2, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/src/lib/utils/utils';

interface OverviewProps {
  candidatesCount: number;
  examsCount: number;
  averageScore: string | number;
  attemptsCount: number;
}

export const Overview: React.FC<OverviewProps> = ({
  candidatesCount,
  examsCount,
  averageScore,
  attemptsCount,
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: candidatesCount, icon: Users, color: 'text-purple-500' },
          { label: 'Exam Modules', value: examsCount, icon: Activity, color: 'text-blue-500' },
          { label: 'Avg Score', value: averageScore || '0', icon: BarChart2, color: 'text-emerald-500' },
          { label: 'System Health', value: '100%', icon: Shield, color: 'text-amber-500' }
        ].map((stat, i) => (
          <Card key={i} className="p-6 rounded-[24px] border-none shadow-lg bg-white group">
            <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4", stat.color)}><stat.icon className="w-5 h-5" /></div>
            <p className="text-[9px] font-black text-slate-400 mb-0.5 uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-3xl font-black tracking-tighter">{stat.value}</h4>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 rounded-[32px] bg-slate-900 text-white shadow-xl flex flex-col justify-center items-center text-center">
          <ShieldAlert className="w-12 h-12 text-primary/40 mb-4" />
          <h4 className="text-lg font-black uppercase mb-1">Integrity Shield: Active</h4>
          <p className="text-[10px] font-medium text-white/40 max-w-xs uppercase leading-relaxed tracking-wider">Metrics aggregation active for {attemptsCount} terminals.</p>
        </Card>
        <Card className="p-8 rounded-[32px] bg-white border border-primary/5 shadow-xl space-y-4">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cloud Node Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs"><span>Database Layer</span><Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px]">ONLINE</Badge></div>
            <div className="flex justify-between items-center text-xs"><span>Real-time Engine</span><Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px]">ACTIVE</Badge></div>
            <div className="flex justify-between items-center text-xs"><span>AI Processor</span><Badge className="bg-blue-100 text-blue-600 border-none font-black text-[8px]">READY</Badge></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
