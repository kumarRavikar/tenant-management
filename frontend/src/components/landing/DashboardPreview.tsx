import React from 'react';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const DashboardPreview: React.FC = () => {
  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-indigo-950/10 overflow-hidden text-left">
      {/* Mock App Header */}
      <div className="bg-slate-900 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-medium text-slate-400 pl-2 border-l border-slate-800">
            app.tpms.cloud/dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60 text-xs text-slate-300">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search properties, tenants, invoices...</span>
            <kbd className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</kbd>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Mock Subheader / Property Context */}
      <div className="bg-slate-50/80 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Portfolio:</span>
          <span className="font-semibold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            All Properties (Grandview & Skyline Towers)
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated just now</span>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="p-4 sm:p-6 space-y-6 bg-slate-50/30">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Properties</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">12</span>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +2 new
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">48 buildings • 4 complexes</p>
          </div>

          {/* Card 2 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupancy</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">94.2%</span>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600">
                186 / 198 units
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '94.2%' }} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collections</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">₹24.85L</span>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600">
                98.2%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">₹45K pending overdue</p>
          </div>

          {/* Card 4 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tickets</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">8 Active</span>
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-600">
                2 High Priority
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Avg turnaround 3.4 hrs</p>
          </div>
        </div>

        {/* Two Columns: Recent Collections & Live Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Invoices & Collections */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Rent Invoices
                </span>
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer flex items-center gap-0.5">
                View all <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                    AS
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Unit 402 • Arvind Sharma</div>
                    <div className="text-[10px] text-slate-500">INV-2026-0042 • Due 1st</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹35,000</div>
                  <Badge variant="success" className="text-[10px] py-0 px-1.5">
                    Paid
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                    NP
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Unit 105 • Neha Patel</div>
                    <div className="text-[10px] text-slate-500">INV-2026-0043 • Due 1st</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹28,500</div>
                  <Badge variant="success" className="text-[10px] py-0 px-1.5">
                    Paid
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[11px]">
                    RV
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Unit 204 • Rahul Verma</div>
                    <div className="text-[10px] text-slate-500">INV-2026-0044 • Due 5th</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹42,000</div>
                  <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                    Pending
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Maintenance & Visitors */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Operations
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Updated 2m ago</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">HVAC Filter Replacement</div>
                    <div className="text-[10px] text-slate-500">Unit 301 • Assigned to John D.</div>
                  </div>
                </div>
                <Badge variant="info" className="text-[10px] py-0 px-1.5 shrink-0">
                  In Progress
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Visitor Pass #GP-8841</div>
                    <div className="text-[10px] text-slate-500">Unit 502 • Courier Delivery</div>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px] py-0 px-1.5 shrink-0">
                  Checked In
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Lease Renewal Completed</div>
                    <div className="text-[10px] text-slate-500">Unit 112 • 12 Months Contract</div>
                  </div>
                </div>
                <Badge variant="neutral" className="text-[10px] py-0 px-1.5 shrink-0">
                  Renewed
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

