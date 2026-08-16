import React, { useEffect, useState } from 'react';
import { Card } from '@/lib/ui/card';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, AlertCircle } from 'lucide-react';
import { getApiUrl } from '@/src/lib/api-config';

export const PerformanceAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/analytics/detailed-performance'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-primary uppercase tracking-widest">Compiling Analytics...</div>;

  if (!data || !data.candidates || data.candidates.length === 0) return (
    <div className="p-20 text-center opacity-20">
      <TrendingUp className="w-20 h-20 mx-auto mb-6" />
      <p className="text-2xl font-black uppercase tracking-[0.4em]">No performance data available</p>
    </div>
  );

  const topics = Array.isArray(data.topics) ? data.topics : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 rounded-[40px] bg-white border border-primary/5 shadow-2xl">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><TrendingUp className="w-5 h-5" /></div>
              <h3 className="font-black text-lg tracking-tight text-slate-800 uppercase">Topic Mastery Analysis</h3>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                  <Tooltip
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 900}}
                  />
                  <Bar dataKey="avgScore" radius={[10, 10, 0, 0]}>
                    {topics.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={parseFloat(entry.avgScore) > 50 ? '#0EA5E9' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
           <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-inner"><Users className="w-5 h-5" /></div>
              <h3 className="font-black text-lg tracking-tight uppercase">Top Performance Registry</h3>
           </div>
           <ScrollArea className="h-[300px] pr-4 relative z-10">
              <div className="space-y-4">
                 {data.candidates.slice(0, 10).map((c: any, i: number) => (
                    <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all">
                       <div>
                          <p className="font-black text-sm uppercase truncate max-w-[150px]">{c.fullName}</p>
                          <p className="text-[9px] font-bold text-white/30 tracking-widest">{c.examNumber}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-lg leading-none">{c.percentage}%</p>
                          <p className="text-[7px] font-black text-emerald-400 tracking-widest mt-1">RANK #{i+1}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </ScrollArea>
        </Card>
      </div>

      <Card className="p-8 rounded-[40px] bg-white border border-primary/5 shadow-2xl">
         <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner"><BookOpen className="w-5 h-5" /></div>
            <div>
               <h3 className="font-black text-lg tracking-tight text-slate-800 uppercase">Live Performance Audit</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time candidate score distribution</p>
            </div>
         </div>
         <ScrollArea className="h-[400px]">
            <table className="w-full text-left">
               <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                     <th className="pb-4">Candidate</th>
                     <th className="pb-4 text-center">Mastery</th>
                     <th className="pb-4 text-center">Score</th>
                     <th className="pb-4 text-right">Completion</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 font-bold uppercase">
                  {data.candidates.map((c: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                       <td className="py-5">
                          <p className="text-xs font-black text-slate-700">{c.fullName}</p>
                          <p className="text-[8px] text-slate-300 tracking-widest">{c.examNumber}</p>
                       </td>
                       <td className="py-5">
                          <div className="w-24 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div
                              className={c.percentage > 70 ? "h-full bg-emerald-500" : c.percentage > 40 ? "h-full bg-amber-500" : "h-full bg-rose-500"}
                              style={{width: `${c.percentage}%`}}
                             />
                          </div>
                       </td>
                       <td className="py-5 text-center text-xs font-black text-primary">{c.score}/{c.totalPossible}</td>
                       <td className="py-5 text-right text-[9px] text-slate-400">{new Date(c.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </ScrollArea>
      </Card>
    </div>
  );
};
