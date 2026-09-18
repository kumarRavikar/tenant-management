import React from 'react';
import { Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePaymentReceipt } from '@/features/payment/payment.hooks';

interface ReceiptModalProps {
  paymentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  paymentId,
  isOpen,
  onClose,
}) => {
  const { data: receipt, isLoading } = usePaymentReceipt(paymentId || undefined);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt"
      description="Proof of transaction and payment acknowledgment"
      maxWidth="xl"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            className="flex items-center gap-2"
            disabled={isLoading || !receipt}
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-slate-500">
          Loading receipt details...
        </div>
      ) : !receipt ? (
        <div className="py-12 text-center text-slate-500">
          Receipt details not available.
        </div>
      ) : (
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 print:border-none print:p-0">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900">PAYMENT RECEIPT</span>
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="w-3 h-3" /> PAID
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Receipt #{receipt.receiptNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600">
                ${receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Paid on {new Date(receipt.paymentDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Property & Unit
              </span>
              <p className="font-medium text-slate-900">{receipt.property.name}</p>
              <p className="text-xs text-slate-600">
                Building: {receipt.property.buildingName} | Unit: {receipt.property.unitNumber}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Tenant Information
              </span>
              <p className="font-medium text-slate-900">{receipt.tenant.name}</p>
              <p className="text-xs text-slate-600">{receipt.tenant.email}</p>
            </div>
          </div>

          {/* Transaction & Invoice Details */}
          <div className="border border-slate-100 rounded-lg overflow-hidden text-sm">
            <div className="bg-slate-50 px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider">
              Payment Breakdown
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice Reference</span>
                <span className="font-medium text-slate-900">{receipt.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Billing Month</span>
                <span className="font-medium text-slate-900">{receipt.invoice.billingMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Method</span>
                <span className="font-medium text-slate-900">{receipt.paymentMethod}</span>
              </div>
              {receipt.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Reference / Txn ID</span>
                  <span className="font-mono text-xs text-slate-800">{receipt.transactionReference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice Total Amount</span>
                <span className="text-slate-900">${receipt.invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
                <span className="text-slate-900">Amount Paid Here</span>
                <span className="text-emerald-600">${receipt.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>This is an electronically verified and generated digital receipt.</span>
          </div>
        </div>
      )}
    </Modal>
  );
};

