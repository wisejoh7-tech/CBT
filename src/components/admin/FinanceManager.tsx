import React, { useState } from 'react';
import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Building2, BookOpen, RefreshCw, BarChart2, DollarSign } from 'lucide-react';
import { FinancialDashboard } from '../finance/FinancialDashboard';
import { AdminBankAccounts } from '../finance/AdminBankAccounts';
import { DoubleEntryLedger } from '../finance/DoubleEntryLedger';
import { BankReconciliation } from '../finance/BankReconciliation';

export function FinanceManager() {
  const [financeTab, setFinanceTab] = useState<'dashboard' | 'bank_accounts' | 'ledger' | 'reconciliation'>('dashboard');

  return (
    <div className="space-y-6">
      {/* Finance Navigation Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" /> Banking, Finance & Accounting
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Institutional ledger, organization bank accounts, automated reconciliation, and financial analytics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFinanceTab('dashboard')}
            variant={financeTab === 'dashboard' ? 'default' : 'outline'}
            className="h-10 text-xs font-bold rounded-xl"
          >
            <BarChart2 className="w-4 h-4 mr-1.5" /> Dashboard Metrics
          </Button>
          <Button
            onClick={() => setFinanceTab('bank_accounts')}
            variant={financeTab === 'bank_accounts' ? 'default' : 'outline'}
            className="h-10 text-xs font-bold rounded-xl"
          >
            <Building2 className="w-4 h-4 mr-1.5" /> Admin Bank Accounts
          </Button>
          <Button
            onClick={() => setFinanceTab('ledger')}
            variant={financeTab === 'ledger' ? 'default' : 'outline'}
            className="h-10 text-xs font-bold rounded-xl"
          >
            <BookOpen className="w-4 h-4 mr-1.5" /> Accounting Ledger
          </Button>
          <Button
            onClick={() => setFinanceTab('reconciliation')}
            variant={financeTab === 'reconciliation' ? 'default' : 'outline'}
            className="h-10 text-xs font-bold rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Bank Reconciliation
          </Button>
        </div>
      </div>

      {/* Render Selected View */}
      {financeTab === 'dashboard' && <FinancialDashboard />}
      {financeTab === 'bank_accounts' && <AdminBankAccounts />}
      {financeTab === 'ledger' && <DoubleEntryLedger />}
      {financeTab === 'reconciliation' && <BankReconciliation />}
    </div>
  );
}
