import React, { useState } from 'react';
import { useReport } from '@/features/report/hooks';
import { reportApi } from '@/features/report/api';
import { ReportType, ReportQueryParams } from '@/features/report/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Building,
  DollarSign,
  CreditCard,
  Wrench,
  Clock,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportType>('occupancy');
  const [propertyId, setPropertyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [days, setDays] = useState('30');
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const queryParams: ReportQueryParams = {
    propertyId: propertyId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    method: method || undefined,
    status: status || undefined,
    priority: priority || undefined,
    days: days || undefined,
  };

  const { data: report, isLoading, error } = useReport(activeTab, queryParams);

  const handleDownload = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') setIsExportingCSV(true);
      else setIsExportingPDF(true);

      await reportApi.downloadExport(activeTab, format, queryParams);
    } catch (err) {
      console.error(`Failed to download ${format} report:`, err);
    } finally {
      if (format === 'csv') setIsExportingCSV(false);
      else setIsExportingPDF(false);
    }
  };

  const tabs: { id: ReportType; label: string; icon: React.ReactNode }[] = [
    { id: 'occupancy', label: 'Occupancy', icon: <Building className="w-4 h-4" /> },
    { id: 'rent-collection', label: 'Rent Collection', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'payments', label: 'Payment Transactions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
    { id: 'lease-expiration', label: 'Lease Expirations', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Reporting & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export operational, financial, and lease reports in instant CSV or PDF formats.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('csv')}
            isLoading={isExportingCSV}
            className="flex items-center gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('pdf')}
            isLoading={isExportingPDF}
            className="flex items-center gap-1.5 text-rose-700 border-rose-300 hover:bg-rose-50"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Parameters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Property ID
            </label>
            <input
              type="text"
              placeholder="All Properties"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-44 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(activeTab === 'rent-collection' || activeTab === 'payments' || activeTab === 'maintenance') && (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Methods</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE_GATEWAY">Online Gateway</option>
              </select>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'lease-expiration' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Expiry Window
              </label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="30">Next 30 Days</option>
                <option value="60">Next 60 Days</option>
                <option value="90">Next 90 Days</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {report?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(report.summary).map(([key, value]) => (
            <div
              key={key}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
            >
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <p className="text-xl font-extrabold text-slate-800 mt-1">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Report Data Table Preview */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">
            {report?.title || 'Report Preview'} ({report?.rows.length || 0} Records)
          </CardTitle>
          <div className="text-xs text-slate-400">Live Database Snapshot</div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">Querying report data...</div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-rose-600">Failed to load report data.</div>
          ) : report?.rows && report.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    {report.headers.map((h, i) => (
                      <th key={i} className="px-6 py-3.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.rows.map((row, rIndex) => (
                    <tr key={rIndex} className="hover:bg-slate-50/75 transition-colors">
                      {row.map((cell, cIndex) => (
                        <td key={cIndex} className="px-6 py-3.5 font-medium">
                          {String(cell ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No data found</p>
              <p className="text-xs text-slate-400 mt-1">Try expanding your filter criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
