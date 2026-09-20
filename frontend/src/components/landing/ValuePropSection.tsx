import React from 'react';
import { Building, Users, CreditCard, Shield } from 'lucide-react';

const valuePillars = [
  {
    icon: Building,
    title: 'Multi-Property Hierarchy',
    description:
      'Seamlessly structure assets from Properties down to Buildings, Floors, and Units with live occupancy states.',
    highlight: 'Granular Hierarchy',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    iconColor: 'text-indigo-600 bg-indigo-50',
  },
  {
    icon: Users,
    title: 'Tenant & Lease Lifecycle',
    description:
      'Automate onboarding, digital lease agreements, security deposit records, and renewal alerts in one place.',
    highlight: 'Zero Paperwork',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    iconColor: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: CreditCard,
    title: 'Automated Billing & Payments',
    description:
      'Generate monthly rent invoices, record partial or full payments, and track overdue accounts automatically.',
    highlight: 'Instant Invoicing',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    iconColor: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Shield,
    title: 'Operations & Gate Passes',
    description:
      'Resolve maintenance issues via real-time tickets and secure premises with digital visitor gate passes.',
    highlight: 'Real-Time Dispatch',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/60',
    iconColor: 'text-purple-600 bg-purple-50',
  },
];

export const ValuePropSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 border-y border-slate-200/80 bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valuePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${pillar.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pillar.badgeColor}`}>
                      {pillar.highlight}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

