import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Eye,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import { useInvoices, useCreateInvoice } from '@/features/invoice/invoice.hooks';
import { useRecordPayment } from '@/features/payment/payment.hooks';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { RentInvoice, InvoiceStatus } from '@/features/invoice/invoice.types';
import { PaymentMethod } from '@/features/payment/payment.types';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ReceiptModal } from '../payments/ReceiptModal';

export const InvoicesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const leaseIdParam = searchParams.get('leaseId');

  const { data: user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useInvoices({
    page,
    limit,
    leaseId: leaseIdParam || undefined,
    status: (statusFilter as InvoiceStatus) || undefined,
    billingMonth: monthFilter || undefined,
  });

  const createInvoiceMutation = useCreateInvoice();
  const recordPaymentMutation = useRecordPayment();

  // Create Invoice Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    leaseId: leaseIdParam || '',
    billingMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rentAmount: 2000,
    maintenanceAmount: 150,
    lateFee: 0,
    discount: 0,
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Pay Modal State
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<RentInvoice | null>(null);
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

  const canCreate =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'PROPERTY_ADMIN' ||
    user?.role === 'MANAGER';

  const calculatedTotal =
    Number(createForm.rentAmount || 0) +
    Number(createForm.maintenanceAmount || 0) +
    Number(createForm.lateFee || 0) -
    Number(createForm.discount || 0);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (calculatedTotal < 0) {
      setCreateError('Total invoice amount cannot be negative');
      return;
    }

    try {
      await createInvoiceMutation.mutateAsync({
        ...createForm,
        rentAmount: Number(createForm.rentAmount),
        maintenanceAmount: Number(createForm.maintenanceAmount),
        lateFee: Number(createForm.lateFee),
        discount: Number(createForm.discount),
      });
      setIsCreateOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCreateError(
        error.response?.data?.message || 'Failed to create invoice. Ensure lease is valid.'
      );
    }
  };

  const handleOpenPay = (inv: RentInvoice) => {
    setSelectedInvoice(inv);
    const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
    setPaymentForm({
      amount: remaining,
      paymentMethod: user?.role === 'TENANT' ? 'ONLINE' : 'BANK_TRANSFER',
      transactionReference: '',
      notes: '',
    });
    setPayError(null);
    setIsPayOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPayError(null);

    try {
      const payment = await recordPaymentMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference || undefined,
        notes: paymentForm.notes || undefined,
      });

      setIsPayOpen(false);
      refetch();
      // Prompt receipt view
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
            <Clock className="w-3 h-3" /> Partial
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

  const invoices = data?.invoices || [];

  // Summary Metrics
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const balanceOutstanding = Math.max(0, totalBilled - totalPaid);
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  const columns: Column<RentInvoice>[] = [
    {
      header: 'Invoice #',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.invoiceNumber}</div>
          <div className="text-xs text-slate-500">{row.billingMonth}</div>
        </div>
      ),
    },
    {
      header: 'Due Date',
      render: (row) => (
        <div className="text-sm text-slate-700">
          {new Date(row.dueDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: 'Total Amount',
      render: (row) => (
        <div className="font-medium text-slate-900">
          ${row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: 'Paid / Balance',
      render: (row) => {
        const balance = Math.max(0, row.totalAmount - row.paidAmount);
        return (
          <div>
            <div className="text-xs text-emerald-600 font-medium">
              Paid: ${row.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            {balance > 0 && (
              <div className="text-xs text-rose-600 font-semibold">
                Due: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Actions',
      render: (row) => {
        const balance = row.totalAmount - row.paidAmount;
        return (
          <div className="flex items-center gap-2">
            <Link to={`/invoices/${row.id}`}>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Eye className="w-3.5 h-3.5 mr-1" />
                Details
              </Button>
            </Link>
            {balance > 0 && row.status !== 'CANCELLED' && (
              <Button
                variant="primary"
                size="sm"
                className="h-8 px-2.5"
                onClick={() => handleOpenPay(row)}
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                Pay
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rent & Invoices</h1>
          <p className="text-sm text-slate-500">
            Monitor rental billing, track payment status, and process transactions.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Billed</p>
            <p className="text-xl font-bold text-slate-900">
              ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Collected</p>
            <p className="text-xl font-bold text-emerald-600">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Balance Due</p>
            <p className="text-xl font-bold text-slate-900">
              ${balanceOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-bold text-rose-600">{overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-48">
          <Select
            label=""
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Overdue', value: 'OVERDUE' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />
        </div>

        <div className="w-48">
          <Input
            type="month"
            label=""
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Billing Month"
          />
        </div>

        {(statusFilter || monthFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('');
              setMonthFilter('');
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          emptyMessage="No invoices found matching the current criteria."
        />

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={page}
              totalPages={data.meta.totalPages}
              totalItems={data.meta.total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Rent Invoice"
        description="Create an invoice for a tenant lease with automatic calculation"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {createError}
            </div>
          )}

          <Input
            label="Lease ID"
            required
            value={createForm.leaseId}
            onChange={(e) => setCreateForm({ ...createForm, leaseId: e.target.value })}
            placeholder="e.g. 00000000-0000-0000-0000-000000000000"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="month"
              label="Billing Month"
              required
              value={createForm.billingMonth}
              onChange={(e) => setCreateForm({ ...createForm, billingMonth: e.target.value })}
            />
            <Input
              type="date"
              label="Due Date"
              required
              value={createForm.dueDate}
              onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Rent Amount ($)"
              required
              min={0}
              step="0.01"
              value={createForm.rentAmount}
              onChange={(e) => setCreateForm({ ...createForm, rentAmount: Number(e.target.value) })}
            />
            <Input
              type="number"
              label="Maintenance Amount ($)"
              min={0}
              step="0.01"
              value={createForm.maintenanceAmount}
              onChange={(e) =>
                setCreateForm({ ...createForm, maintenanceAmount: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Late Fee ($)"
              min={0}
              step="0.01"
              value={createForm.lateFee}
              onChange={(e) => setCreateForm({ ...createForm, lateFee: Number(e.target.value) })}
            />
            <Input
              type="number"
              label="Discount ($)"
              min={0}
              step="0.01"
              value={createForm.discount}
              onChange={(e) => setCreateForm({ ...createForm, discount: Number(e.target.value) })}
            />
          </div>

          {/* Calculated Total Display */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Calculated Total</span>
            <span
              className={`text-xl font-bold ${
                calculatedTotal < 0 ? 'text-rose-600' : 'text-indigo-600'
              }`}
            >
              ${calculatedTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createInvoiceMutation.isPending || calculatedTotal < 0}
            >
              {createInvoiceMutation.isPending ? 'Generating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title="Record Payment"
        description={`Make a payment towards invoice ${selectedInvoice?.invoiceNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {payError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {payError}
            </div>
          )}

          {selectedInvoice && (
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Invoice Total:</span>
                <span className="font-semibold text-slate-900">${selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Already Paid:</span>
                <span className="text-emerald-600">${selectedInvoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold">
                <span>Remaining Balance:</span>
                <span className="text-rose-600">
                  ${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Input
            type="number"
            label="Payment Amount ($)"
            required
            step="0.01"
            min={0.01}
            max={selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.paidAmount : undefined}
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
            label="Transaction Reference / Note (Optional)"
            placeholder="e.g. TXN-10928374 or Cheque #"
            value={paymentForm.transactionReference}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
            }
          />

          <Input
            label="Internal Notes (Optional)"
            placeholder="Additional details"
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
