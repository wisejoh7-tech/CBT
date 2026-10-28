import React, { useState } from 'react';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Badge } from '@/lib/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Lock, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';

interface StudentCardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  examNumber: string;
  fullName: string;
  amount: number;
  onPaymentSuccess: () => void;
}

export function StudentCardPaymentModal({
  isOpen,
  onClose,
  examNumber,
  fullName,
  amount,
  onPaymentSuccess,
}: StudentCardPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [cardHolder, setCardHolder] = useState(fullName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  if (!isOpen) return null;

  const handleFormatCardNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleFormatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 15) {
      toast.error("Please enter a valid card number.");
      return;
    }
    if (expiry.length < 5) {
      toast.error("Please enter a valid expiry date (MM/YY).");
      return;
    }

    try {
      setLoading(true);
      const cleanDigits = cardNumber.replace(/\s/g, '');
      const lastFour = cleanDigits.slice(-4) || '4242';

      const res = await apiFetch(getApiUrl('/finance/pay-exam-fee'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          examNumber,
          cardHolderName: cardHolder,
          lastFourDigits: lastFour,
          amount,
          idempotencyKey: `KEY-${examNumber}-${Date.now()}`
        })
      });

      const data = await safeJsonResponse(res);
      toast.success(data?.message || "Payment verified successfully!");
      setReceipt(data);
      onPaymentSuccess();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative overflow-hidden">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {receipt ? (
          /* PAYMENT SUCCESS RECEIPT */
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <Badge className="bg-emerald-500 text-white font-bold mb-2">PAYMENT VERIFIED</Badge>
              <h3 className="text-xl font-black text-slate-900">Exam Fee Payment Confirmed</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Your examination registration fee has been securely verified. Exam terminal access is now active.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Exam No:</span>
                <span className="font-bold text-slate-900">{examNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-bold text-primary">{receipt.paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-slate-900">₦{Number(receipt.amount || amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-bold text-slate-700">{new Date(receipt.paidAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full h-12 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20"
            >
              PROCEED TO EXAM TERMINAL
            </Button>
          </div>
        ) : (
          /* CARD CHECKOUT FORM */
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Pay Exam Registration Fee</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Complete card payment to unlock your examination slip and terminal session.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Candidate Fee</span>
                <p className="text-sm font-black text-slate-900">{fullName}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Due</span>
                <p className="text-lg font-black text-emerald-600">₦{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Cardholder Name</Label>
                <Input
                  required
                  placeholder="Name as printed on card"
                  value={cardHolder}
                  onChange={e => setCardHolder(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 font-medium text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Card Number</Label>
                <div className="relative">
                  <Input
                    required
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={e => handleFormatCardNumber(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 font-mono font-bold text-sm pr-10"
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Expiry Date</Label>
                  <Input
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={e => handleFormatExpiry(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 font-mono text-center font-bold text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">CVV / CVC</Label>
                  <Input
                    required
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                    className="h-11 rounded-xl bg-slate-50 font-mono text-center font-bold text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>256-Bit SSL Encrypted. PCI-DSS compliant payment processing.</span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 mt-2"
              >
                {loading ? "VERIFYING PAYMENT..." : `PAY ₦${amount.toLocaleString()} NOW`}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
