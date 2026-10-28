import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { UploadCloud, CheckCircle2, AlertTriangle, RefreshCw, FileText, Filter, Check } from 'lucide-react';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';

interface Statement {
  id: string;
  filename: string;
  totalLines: number;
  matchedLines: number;
  unmatchedLines: number;
  createdAt: string;
  lines?: Array<{
    id: string;
    transactionDate: string;
    description: string;
    reference?: string;
    amount: number;
    type: 'credit' | 'debit';
    status: 'unmatched' | 'matched' | 'discrepancy';
  }>;
}

export function BankReconciliation() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [filename, setFilename] = useState('bank_statement.csv');

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(getApiUrl('/banking/statements'), { headers: getHeaders() });
      const data = await safeJsonResponse(res);
      if (Array.isArray(data)) setStatements(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCsvContent(evt.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      toast.error("Please upload or paste CSV bank statement content.");
      return;
    }

    try {
      const res = await apiFetch(getApiUrl('/banking/import-statement'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ filename, csvContent }),
      });

      await safeJsonResponse(res);
      toast.success("Bank statement imported successfully");
      setCsvContent('');
      fetchStatements();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  const handleRunReconciliation = async () => {
    try {
      setReconciling(true);
      const res = await apiFetch(getApiUrl('/banking/reconcile'), {
        method: 'POST',
        headers: getHeaders(),
      });

      const data = await safeJsonResponse(res);
      toast.success(data?.message || "Reconciliation process completed");
      fetchStatements();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setReconciling(false);
    }
  };

  const handleManualMatch = async (lineId: string, status: 'matched' | 'discrepancy') => {
    try {
      const res = await apiFetch(getApiUrl('/banking/reconcile/manual'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ statementLineId: lineId, status }),
      });

      await safeJsonResponse(res);
      toast.success(`Transaction marked as ${status}`);
      fetchStatements();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" /> Bank Reconciliation & Matching Engine
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Import CSV bank statements, automatically match transaction references, and generate discrepancy reports.
          </p>
        </div>

        <Button
          onClick={handleRunReconciliation}
          disabled={reconciling}
          className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
          {reconciling ? "MATCHING..." : "RUN AUTO-RECONCILIATION"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: Statements & Transaction Matching Table */}
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading Statement Records...</div>
          ) : statements.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-dashed border-2 border-slate-200 bg-slate-50/50 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700">No Bank Statements Uploaded Yet</h4>
              <p className="text-xs text-slate-500">Upload a CSV bank statement on the right panel to begin reconciliation.</p>
            </Card>
          ) : (
            statements.map(stmt => (
              <Card key={stmt.id} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{stmt.filename}</h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Uploaded on {new Date(stmt.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-slate-100 text-slate-700">Total: {stmt.totalLines}</Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-600">Matched: {stmt.lines?.filter(l => l.status === 'matched').length || 0}</Badge>
                    <Badge className="bg-rose-500/10 text-rose-600">Unmatched: {stmt.lines?.filter(l => l.status !== 'matched').length || 0}</Badge>
                  </div>
                </div>

                {/* Line items */}
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {stmt.lines?.map(line => (
                    <div key={line.id} className="py-3 flex flex-wrap justify-between items-center gap-2 text-xs">
                      <div className="space-y-0.5 max-w-xs">
                        <p className="font-bold text-slate-800">{line.description}</p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {new Date(line.transactionDate).toLocaleDateString()} {line.reference ? `• Ref: ${line.reference}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₦{Number(line.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>

                        <Badge
                          className={
                            line.status === 'matched'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                              : line.status === 'discrepancy'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-200'
                              : 'bg-amber-500/10 text-amber-600 border-amber-200'
                          }
                        >
                          {line.status.toUpperCase()}
                        </Badge>

                        {line.status === 'unmatched' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleManualMatch(line.id, 'matched')}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-bold text-[10px]"
                              title="Confirm Match"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleManualMatch(line.id, 'discrepancy')}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-bold text-[10px]"
                              title="Flag Discrepancy"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Right: Statement Importer Form */}
        <Card className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 shadow-sm space-y-4 h-fit">
          <h4 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-primary" /> Import CSV Bank Statement
          </h4>
          <p className="text-xs text-slate-500">
            Upload CSV containing Columns: <br />
            <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">Date, Description, Reference, Amount, Type</code>
          </p>

          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">CSV File</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="h-10 text-xs bg-white rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Or Paste CSV Content</Label>
              <textarea
                rows={6}
                placeholder={`Date,Description,Reference,Amount,Type\n2026-03-30,Student Fee Payment,PAY-882193,5000,credit`}
                value={csvContent}
                onChange={e => setCsvContent(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button type="submit" className="w-full h-11 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20">
              IMPORT STATEMENT CONTENT
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
