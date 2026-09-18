import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  Building2,
} from 'lucide-react';
import { useInvoice, useInvoicePayments } from '@/features/invoice/invoice.hooks';
import { useRecordPayment } from '@/features/payment/payment.hooks';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { InvoiceStatus } from '@/features/invoice/invoice.types';
import { PaymentMethod } from '@/features/payment/payment.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ReceiptModal } from '../payments/ReceiptModal';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const { data: invoice, isLoading, refetch } = useInvoice(id);
  const { data: payments = [], refetch: refetchPayments } = useInvoicePayments(id);
  const recordPaymentMutation = useRecordPayment();

  // Payment Modal State
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    notes: string;
  }>({
    amount: 0,
    paymentMethod: 'ONLINE',
    transactionReference: '',
    notes: '',
  });
  const [payError, setPayError] = useState<string | null>(null);

  // Receipt Modal State
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500">
        Loading invoice details...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Invoice not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  const handleOpenPay = () => {
    setPaymentForm({
      amount: balanceDue,
      paymentMethod: user?.role === 'TENANT' ? 'ONLINE' : 'BANK_TRANSFER',
      transactionReference: '',
      notes: '',
    });
    setPayError(null);
    setIsPayOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);

    try {
      const payment = await recordPaymentMutation.mutateAsync({
        invoiceId: invoice.id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference || undefined,
        notes: paymentForm.notes || undefined,
      });

      setIsPayOpen(false);
      refetch();
      refetchPayments();
      setReceiptPaymentId(payment.id);
      setIsReceiptOpen(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPayError(error.response?.data?.message || 'Payment processing failed');
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case 'PARTIALLY_PAID':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" /> Partially Paid
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge variant="danger" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="neutral" className="gap-1">
            <Ban className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>

        {balanceDue > 0 && invoice.status !== 'CANCELLED' && (
          <Button variant="primary" onClick={handleOpenPay} className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pay Now (${balanceDue.toFixed(2)})
          </Button>
        )}
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{invoice.invoiceNumber}</h1>
            {getStatusBadge(invoice.status)}
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Billing Month: {invoice.billingMonth} | Due Date:{' '}
            {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Amount</span>
            <p className="text-2xl font-bold text-slate-900">${invoice.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Paid Amount</span>
            <p className="text-2xl font-bold text-emerald-600">${invoice.paidAmount.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Balance Due</span>
            <p className="text-2xl font-bold text-rose-600">${balanceDue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Items Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Billing Breakdown
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Base Rent</span>
              <span className="font-semibold text-slate-900">${invoice.rentAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Maintenance Fee</span>
              <span className="font-semibold text-slate-900">
                ${invoice.maintenanceAmount.toFixed(2)}
              </span>
            </div>
            {invoice.lateFee > 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-rose-600">Late Fee</span>
                <span className="font-semibold text-rose-600">+${invoice.lateFee.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-emerald-600">Applied Discount</span>
                <span className="font-semibold text-emerald-600">
                  -${invoice.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-base font-bold">
              <span className="text-slate-900">Total Billed</span>
              <span className="text-indigo-600">${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Lease & Property Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Property & Lease
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Lease Reference</span>
              <p className="font-medium text-slate-900">{invoice.leaseId}</p>
            </div>

            {invoice.lease?.unit && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Unit Location</span>
                <p className="font-medium text-slate-900">
                  Unit {invoice.lease.unit.unitNumber}
                  {invoice.lease.unit.floor?.building?.name &&
                    ` - ${invoice.lease.unit.floor.building.name}`}
                  {invoice.lease.unit.floor?.building?.property?.name &&
                    ` (${invoice.lease.unit.floor.building.property.name})`}
                </p>
              </div>
            )}

            {invoice.lease?.tenant?.user && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Tenant</span>
                <p className="font-medium text-slate-900">
                  {invoice.lease.tenant.user.firstName} {invoice.lease.tenant.user.lastName}
                </p>
                <p className="text-xs text-slate-500">{invoice.lease.tenant.user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          Recorded Payments ({payments.length})
        </h2>

        {payments.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            No payments have been recorded for this invoice yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {p.transactionReference || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          setReceiptPaymentId(p.id);
                          setIsReceiptOpen(true);
                        }}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title="Record Payment"
        description={`Make a payment towards invoice ${invoice.invoiceNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {payError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {payError}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Invoice Total:</span>
              <span className="font-semibold text-slate-900">${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Already Paid:</span>
              <span className="text-emerald-600">${invoice.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold">
              <span>Remaining Balance:</span>
              <span className="text-rose-600">${balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <Input
            type="number"
            label="Payment Amount ($)"
            required
            step="0.01"
            min={0.01}
            max={balanceDue}
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
          />

          <Select
            label="Payment Method"
            value={paymentForm.paymentMethod}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })
            }
            options={[
              { label: 'Online / Gateway', value: 'ONLINE' },
              { label: 'Bank Transfer / Wire', value: 'BANK_TRANSFER' },
              { label: 'UPI', value: 'UPI' },
              { label: 'Card (Credit/Debit)', value: 'CARD' },
              { label: 'Cash', value: 'CASH' },
              { label: 'Other', value: 'OTHER' },
            ]}
          />

          <Input
            label="Transaction Reference (Optional)"
            placeholder="e.g. TXN-10928374"
            value={paymentForm.transactionReference}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
            }
          />

          <Input
            label="Notes (Optional)"
            placeholder="Additional notes"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={recordPaymentMutation.isPending || paymentForm.amount <= 0}
            >
              {recordPaymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setReceiptPaymentId(null);
        }}
        paymentId={receiptPaymentId}
      />
    </div>
  );
};
