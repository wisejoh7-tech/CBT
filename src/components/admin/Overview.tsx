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
  setActiveTab: (val: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  candidatesCount,
  examsCount,
  averageScore,
  attemptsCount,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6 text-sm font-small max-w-2xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Students', value: candidatesCount, icon: Users, color: 'text-purple-500', tab: 'enrollment' },
          { label: 'Modules', value: examsCount, icon: Activity, color: 'text-blue-500', tab: 'modules' },
          { label: 'Avg Score', value: averageScore || '0', icon: BarChart2, color: 'text-emerald-500', tab: 'analytics' },
          { label: 'Health', value: '100%', icon: Shield, color: 'text-amber-500', tab: 'audit' }
        ].map((stat, i) => (
          <Card key={i} className="p-6 rounded-2xl border-none shadow-xl bg-white group hover:scale-[1.05] transition-transform cursor-pointer" onClick={() => setActiveTab(stat.tab)}>
            <div className={cn("w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 shadow-sm", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black  mb-1 tracking-widest">{stat.label}</p>
            <h4 className="text-1xl font-black tracking-tighter leading-none ">{stat.value}</h4>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-10 rounded-[20px] bg-slate-900 text-white shadow-1xl flex flex-col justify-center items-center text-center">
          <ShieldAlert className="w-4 h-4 text-primary/40 mb-4 animate-pulse" />
          <h4 className="text-xl font-black mb-2  tracking-tight">Security Protocol Active</h4>
          <p className="text-sm font-small text-white/40 max-w-sm leading-relaxed ">Monitoring {attemptsCount} active session terminals with real-time biometric analysis.</p>
        </Card>

        <Card className="p-10 rounded-[20px] bg-white border border-primary/5 shadow-1xl space-y-6">
          <h4 className="text-[14px] font-black  text-center  border-b border-slate-50 pb-4">Cloud Infrastructure Status</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider">
              <span className="text-slate-600">Database Engine</span>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase">Operational</Badge>
            </div>
            <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider">
              <span className="text-slate-600">Socket Protocol</span>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase">Active Link</Badge>
            </div>
            <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider">
              <span className="text-slate-600">AI Logic Core</span>
              <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase">Ready</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
