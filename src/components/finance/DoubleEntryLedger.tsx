import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Plus, DollarSign, Layers, ArrowRightLeft, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  currency: string;
  balance: number;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  reference?: string;
  status: string;
  lines: Array<{
    id: string;
    account: Account;
    debit: number;
    credit: number;
  }>;
}

export function DoubleEntryLedger() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'entries' | 'new_entry'>('accounts');

  // Form for posting balanced Journal Entry
  const [entryForm, setEntryForm] = useState({
    description: '',
    reference: '',
    entryDate: new Date().toISOString().split('T')[0],
    lines: [
      { accountId: '', debit: 0, credit: 0, currency: 'NGN', exchangeRate: 1.0 },
      { accountId: '', debit: 0, credit: 0, currency: 'NGN', exchangeRate: 1.0 },
    ],
  });

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, entRes] = await Promise.all([
        apiFetch(getApiUrl('/finance/accounts'), { headers: getHeaders() }),
        apiFetch(getApiUrl('/finance/journal-entries'), { headers: getHeaders() }),
      ]);

      const accData = await safeJsonResponse(accRes);
      const entData = await safeJsonResponse(entRes);

      if (Array.isArray(accData)) setAccounts(accData);
      if (Array.isArray(entData)) setEntries(entData);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalDebit = entryForm.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = entryForm.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setEntryForm({
      ...entryForm,
      lines: [...entryForm.lines, { accountId: '', debit: 0, credit: 0, currency: 'NGN', exchangeRate: 1.0 }],
    });
  };

  const handleLineChange = (index: number, field: string, val: any) => {
    const updated = [...entryForm.lines];
    updated[index] = { ...updated[index], [field]: val };
    setEntryForm({ ...entryForm, lines: updated });
  };

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error(`Journal entry is not balanced! Total Debit (${totalDebit.toFixed(2)}) must equal Total Credit (${totalCredit.toFixed(2)}).`);
      return;
    }

    try {
      const res = await apiFetch(getApiUrl('/finance/journal-entries'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(entryForm),
      });

      await safeJsonResponse(res);
      toast.success("Balanced Journal Entry posted successfully");
      setActiveSubTab('entries');
      setEntryForm({
        description: '',
        reference: '',
        entryDate: new Date().toISOString().split('T')[0],
        lines: [
          { accountId: '', debit: 0, credit: 0, currency: 'NGN', exchangeRate: 1.0 },
          { accountId: '', debit: 0, credit: 0, currency: 'NGN', exchangeRate: 1.0 },
        ],
      });
      fetchData();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveSubTab('accounts')}
            variant={activeSubTab === 'accounts' ? 'default' : 'ghost'}
            className="h-10 text-xs font-bold rounded-xl"
          >
            <Layers className="w-4 h-4 mr-1.5" /> CHART OF ACCOUNTS ({accounts.length})
          </Button>
          <Button
            onClick={() => setActiveSubTab('entries')}
            variant={activeSubTab === 'entries' ? 'default' : 'ghost'}
            className="h-10 text-xs font-bold rounded-xl"
          >
            <BookOpen className="w-4 h-4 mr-1.5" /> JOURNAL ENTRIES ({entries.length})
          </Button>
        </div>
        <Button
          onClick={() => setActiveSubTab('new_entry')}
          className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" /> POST JOURNAL ENTRY
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading Ledger Records...</div>
      ) : activeSubTab === 'accounts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <Card key={acc.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <Badge className="bg-primary/10 text-primary font-mono text-xs font-black">
                  {acc.code}
                </Badge>
                <Badge variant="outline" className="uppercase font-black text-[10px] tracking-wider text-slate-500">
                  {acc.type}
                </Badge>
              </div>
              <h4 className="font-black text-slate-900 text-base mb-1">{acc.name}</h4>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline mt-4">
                <span className="text-xs text-slate-400 font-medium">Balance</span>
                <span className="text-lg font-black text-slate-900">
                  {acc.currency} {Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : activeSubTab === 'entries' ? (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-dashed border-2 border-slate-200 bg-slate-50/50">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">No Journal Entries Posted Yet</p>
            </Card>
          ) : (
            entries.map(entry => (
              <Card key={entry.id} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-lg mr-2">
                      {entry.entryNumber}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">{entry.description}</span>
                  </div>
                  <div className="text-right text-xs text-slate-400 font-bold">
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 font-mono text-xs">
                  {entry.lines?.map(line => (
                    <div key={line.id} className="py-2 flex justify-between items-center">
                      <span className="font-bold text-slate-700">
                        {line.account?.code} - {line.account?.name}
                      </span>
                      <div className="flex gap-6 text-right font-bold">
                        <span className="w-24 text-emerald-600">
                          {Number(line.debit) > 0 ? `DR ₦${Number(line.debit).toLocaleString()}` : ''}
                        </span>
                        <span className="w-24 text-rose-600">
                          {Number(line.credit) > 0 ? `CR ₦${Number(line.credit).toLocaleString()}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* POST JOURNAL ENTRY FORM */
        <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xl max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" /> Post Double-Entry Journal
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ensure Total Debits equal Total Credits ($\sum DR = \sum CR$).
              </p>
            </div>
            <Badge className={isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}>
              {isBalanced ? "BALANCED" : "UNBALANCED"}
            </Badge>
          </div>

          <form onSubmit={handlePostJournal} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Description</Label>
                <Input
                  required
                  placeholder="e.g., Student Exam Fee Payment Deposit"
                  value={entryForm.description}
                  onChange={e => setEntryForm({ ...entryForm, description: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Reference / Ref No.</Label>
                <Input
                  placeholder="e.g., REF-2026-001"
                  value={entryForm.reference}
                  onChange={e => setEntryForm({ ...entryForm, reference: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 font-mono text-sm"
                />
              </div>
            </div>

            {/* Lines Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Journal Lines</Label>
                <Button type="button" onClick={handleAddLine} size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold">
                  + Add Line
                </Button>
              </div>

              <div className="space-y-2">
                {entryForm.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 items-center">
                    <select
                      required
                      value={line.accountId}
                      onChange={e => handleLineChange(idx, 'accountId', e.target.value)}
                      className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none"
                    >
                      <option value="">Select Ledger Account</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.type.toUpperCase()})
                        </option>
                      ))}
                    </select>

                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Debit (DR)"
                      value={line.debit || ''}
                      onChange={e => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                      className="h-10 rounded-xl bg-white font-mono font-bold text-xs"
                    />

                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Credit (CR)"
                      value={line.credit || ''}
                      onChange={e => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                      className="h-10 rounded-xl bg-white font-mono font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-2xl flex justify-between items-center font-mono text-xs font-bold">
              <span>TOTAL DEBITS: <strong className="text-emerald-700">₦{totalDebit.toFixed(2)}</strong></span>
              <span>TOTAL CREDITS: <strong className="text-rose-700">₦{totalCredit.toFixed(2)}</strong></span>
            </div>

            <Button
              type="submit"
              disabled={!isBalanced}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs tracking-wider shadow-lg shadow-emerald-600/20"
            >
              POST BALANCED JOURNAL ENTRY
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
