import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/ui/card';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, TrendingDown, Building2, CreditCard, RefreshCw, Layers } from 'lucide-react';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export function FinancialDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(getApiUrl('/banking/dashboard'), { headers: getHeaders() });
      const data = await safeJsonResponse(res);
      setMetrics(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading Financial Dashboard...</div>;

  const barData = [
    { name: 'Revenue', amount: Number(metrics?.totalRevenue || 0) },
    { name: 'Expenses', amount: Number(metrics?.totalExpenses || 0) },
    { name: 'Net Income', amount: Number(metrics?.netProfit || 0) },
  ];

  const pieData = [
    { name: 'Exam Fee Income', value: Number(metrics?.totalRevenue || 0) || 1 },
    { name: 'Operating Costs', value: Number(metrics?.totalExpenses || 0) || 0.1 },
  ];

  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Live Verified Bank Balance</span>
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            ₦{Number(metrics?.verifiedBankBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Sum of active admin bank accounts</p>
        </Card>

        <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600">
            ₦{Number(metrics?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Examination registration fee income</p>
        </Card>

        <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Operating Expenses</span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600">
            ₦{Number(metrics?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Logged operational expenses</p>
        </Card>

        <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Net Surplus / Profit</span>
            <DollarSign className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className={`text-2xl font-black ${Number(metrics?.netProfit || 0) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            ₦{Number(metrics?.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Net balance after all charges</p>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h4 className="font-black text-slate-900 text-sm tracking-tight">Income vs Expense Summary</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="amount" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h4 className="font-black text-slate-900 text-sm tracking-tight">Revenue Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
