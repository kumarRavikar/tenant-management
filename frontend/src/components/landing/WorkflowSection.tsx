import React from 'react';
import { Building, UserPlus, Receipt, BarChart3, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Building,
    title: 'Add Properties & Units',
    description:
      'Configure properties, buildings, floors, and individual unit specs with rental amounts and occupancy rules.',
  },
  {
    step: '02',
    icon: UserPlus,
    title: 'Onboard Tenants & Leases',
    description:
      'Assign tenants and owners to units, execute digital lease agreements, and record security deposit commitments.',
  },
  {
    step: '03',
    icon: Receipt,
    title: 'Automate Rent & Tickets',
    description:
      'Generate monthly rent invoices, track payments, and dispatch maintenance tickets with real-time updates.',
  },
  {
    step: '04',
    icon: BarChart3,
    title: 'Monitor & Export Reports',
    description:
      'Access role-specific analytics and export financial, occupancy, and maintenance data into PDF or CSV.',
  },
];

export const WorkflowSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Simple Onboarding
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How TPMS Works in Four Simple Steps
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Get up and running in minutes. From asset setup to day-to-day operations, our structured
            workflow ensures nothing slips through the cracks.
          </p>
        </div>

        {/* Steps Grid with Timeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 font-mono">
                    {item.step}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

