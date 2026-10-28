import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { Building2, Plus, CreditCard, Trash2, Edit, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode?: string;
  currency: string;
  balance: number;
  isActive: boolean;
  description?: string;
}

export function AdminBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    sortCode: '',
    currency: 'NGN',
    balance: 0,
    description: '',
  });

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(getApiUrl('/banking/accounts'), { headers: getHeaders() });
      const data = await safeJsonResponse(res);
      if (Array.isArray(data)) {
        setAccounts(data);
      }
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(getApiUrl('/banking/accounts'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form)
      });
      await safeJsonResponse(res);
      toast.success("Admin Bank Account added successfully");
      setShowAddModal(false);
      setForm({ bankName: '', accountName: '', accountNumber: '', sortCode: '', currency: 'NGN', balance: 0, description: '' });
      fetchAccounts();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this bank account record?")) return;
    try {
      const res = await apiFetch(getApiUrl(`/banking/accounts/${id}`), {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Bank account removed");
        fetchAccounts();
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Admin & Organization Bank Accounts
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage institutional bank accounts where student exam fees and payments are deposited.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> ADD BANK ACCOUNT
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading Bank Accounts...</div>
      ) : accounts.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed border-2 border-slate-200 bg-slate-50/50 space-y-3">
          <Building2 className="w-10 h-10 mx-auto text-slate-300" />
          <h4 className="font-bold text-slate-700">No Admin Bank Accounts Registered</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your institution's bank details so candidates can verify fee transfers and payments.
          </p>
          <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-primary text-white font-bold rounded-xl mt-2">
            Add First Bank Account
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <Card key={acc.id} className="p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-sm hover:shadow-md transition-all relative group overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={acc.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500"}>
                    {acc.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  <button onClick={() => handleDelete(acc.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs font-black uppercase text-slate-400 tracking-wider">{acc.bankName}</p>
                <h4 className="text-lg font-black text-slate-900 leading-tight">{acc.accountName}</h4>
                <p className="font-mono text-sm font-bold text-primary tracking-widest bg-primary/5 p-2 rounded-lg border border-primary/10">
                  {acc.accountNumber}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Verified Balance</span>
                <span className="font-black text-slate-900 text-base">
                  {acc.currency} {Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Add Admin Bank Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Bank Name</Label>
                <Input
                  required
                  placeholder="e.g., Zenith Bank, GTBank, First Bank"
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Account Name</Label>
                <Input
                  required
                  placeholder="e.g., VIVI CBT System Limited"
                  value={form.accountName}
                  onChange={e => setForm({ ...form, accountName: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Account Number</Label>
                  <Input
                    required
                    placeholder="10 digit account no."
                    value={form.accountNumber}
                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 font-mono font-bold text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Sort Code / SWIFT</Label>
                  <Input
                    placeholder="Optional"
                    value={form.sortCode}
                    onChange={e => setForm({ ...form, sortCode: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Currency</Label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Opening Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })}
                    className="h-11 rounded-xl bg-slate-50 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="submit" className="flex-1 h-12 bg-primary text-white font-bold rounded-xl text-xs tracking-wider shadow-lg shadow-primary/20">
                  SAVE BANK ACCOUNT
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="h-12 px-6 rounded-xl font-bold text-xs">
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
