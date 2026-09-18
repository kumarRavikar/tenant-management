import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { usePayments } from '@/features/payment/payment.hooks';
import { Payment, PaymentMethod, PaymentStatus } from '@/features/payment/payment.types';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ReceiptModal } from './ReceiptModal';

export const PaymentsPage: React.FC = () => {
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = usePayments({
    page,
    limit,
    paymentMethod: (methodFilter as PaymentMethod) || undefined,
    status: (statusFilter as PaymentStatus) || undefined,
    search: search || undefined,
  });

  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const payments = data?.payments || [];
  const totalVolume = payments.reduce((acc, p) => acc + p.amount, 0);

  const getMethodBadge = (method: PaymentMethod) => {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {method}
      </span>
    );
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Success
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="danger" className="gap-1">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="gap-1">
            {status}
          </Badge>
        );
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Receipt #',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.receiptNumber}</div>
          <div className="text-xs text-slate-500">
            {new Date(row.paymentDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Invoice Info',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.invoice?.invoiceNumber || '—'}
          </div>
          <div className="text-xs text-slate-500">
            Month: {row.invoice?.billingMonth || '—'}
          </div>
        </div>
      ),
    },
    {
      header: 'Method',
      render: (row) => getMethodBadge(row.paymentMethod),
    },
    {
      header: 'Reference',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.transactionReference || '—'}
        </span>
      ),
    },
    {
      header: 'Amount',
      render: (row) => (
        <div className="font-bold text-emerald-600">
          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Receipt',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5"
          onClick={() => {
            setReceiptPaymentId(row.id);
            setIsReceiptOpen(true);
          }}
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Ledger</h1>
        <p className="text-sm text-slate-500">
          Comprehensive ledger of all recorded payments and official receipts.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Page Volume</p>
            <p className="text-xl font-bold text-emerald-600">
              ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Payments Count</p>
            <p className="text-xl font-bold text-slate-900">{data?.meta?.total || payments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Success Rate</p>
            <p className="text-xl font-bold text-slate-900">100%</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-48">
          <Select
            label=""
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Methods', value: '' },
              { label: 'Online', value: 'ONLINE' },
              { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
              { label: 'UPI', value: 'UPI' },
              { label: 'Card', value: 'CARD' },
              { label: 'Cash', value: 'CASH' },
              { label: 'Other', value: 'OTHER' },
            ]}
          />
        </div>

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
              { label: 'Success', value: 'SUCCESS' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Failed', value: 'FAILED' },
            ]}
          />
        </div>

        <div className="w-64">
          <Input
            label=""
            placeholder="Search by receipt or reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {(methodFilter || statusFilter || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMethodFilter('');
              setStatusFilter('');
              setSearch('');
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={payments}
          isLoading={isLoading}
          emptyMessage="No payments found matching the selected filters."
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
