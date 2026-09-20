import React, { useState } from 'react';
import {
  Receipt,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'billing' | 'maintenance' | 'visitors'>('billing');

  return (
    <section id="showcase" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Product Deep Dive
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Precision, Clarity, and Daily Efficiency
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Inspect how key operational workflows look and feel inside the platform.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'billing'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoicing & Financials</span>
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Maintenance Tickets</span>
            </button>
            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'visitors'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Visitor Passes</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-slate-50 border border-slate-200/80 p-5 sm:p-8 shadow-sm">
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Rent Invoice #INV-2026-0812</h3>
                    <Badge variant="success">PAID</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Billed to Arvind Sharma • Unit 402, Building A (Skyline Heights)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total Billed</div>
                  <div className="text-2xl font-extrabold text-slate-900">₹35,000</div>
                </div>
              </div>

              {/* Financial Calculation Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden text-xs sm:text-sm">
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-700 flex justify-between">
                  <span>Line Item Description</span>
                  <span>Amount</span>
                </div>
                <div className="p-3 flex justify-between border-b border-slate-100">
                  <span className="text-slate-600">Base Monthly Rent (Lease #LSE-0082)</span>
                  <span className="font-semibold text-slate-900">₹32,000.00</span>
                </div>
                <div className="p-3 flex justify-between border-b border-slate-100">
                  <span className="text-slate-600">Monthly Society Maintenance & Facilities</span>
                  <span className="font-semibold text-slate-900">₹3,000.00</span>
                </div>
                <div className="p-3 flex justify-between border-b border-slate-100 text-slate-400">
                  <span>Late Fee Penalty</span>
                  <span>₹0.00</span>
                </div>
                <div className="p-3 bg-slate-50 font-bold text-slate-900 flex justify-between">
                  <span>Total Amount Due</span>
                  <span className="text-indigo-600">₹35,000.00</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Paid in full via Bank Transfer on 02 Oct 2026
                </span>
                <span>Auto-generated by Billing Engine</span>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Ticket #TKT-412: Water Heater Leak</h3>
                    <Badge variant="warning">IN_PROGRESS</Badge>
                    <Badge variant="danger">HIGH PRIORITY</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Created by Neha Patel (Unit 105) • Assigned to Senior Technician John D.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>SLA: 4 Hours</span>
                </div>
              </div>

              {/* Simulated Comment Thread */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Neha Patel (Tenant)</span>
                    <span className="text-slate-400">10:15 AM</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Noticeable water dripping beneath the utility heater since early morning.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1 ml-4 sm:ml-8">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900">John D. (Technician)</span>
                    <span className="text-slate-400">10:45 AM</span>
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-950">
                    Inspecting unit now. Replacing the gasket and tightening the intake valve. Will resolve by 11:30 AM.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-400">
                  Write a reply or update status...
                </div>
                <button className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'visitors' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Gate Pass #PASS-892401</h3>
                    <Badge variant="success">CHECKED_IN</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pre-approved by Rahul Verma • Unit 204
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase font-mono">Digital Code</div>
                  <div className="text-lg font-mono font-bold text-indigo-700">892-401</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Visitor Name</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Deepak Sharma
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">+91 98765 43210</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Purpose</div>
                  <div className="font-bold text-slate-900">Personal Visit</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Family guest</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Entry Timestamp</div>
                  <div className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> 11:20 AM Today
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Logged by Gate Guard #02</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span>Security verified via digital OTP passcode matching host record.</span>
                <span className="font-semibold text-emerald-900">Secure Access Logged</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

