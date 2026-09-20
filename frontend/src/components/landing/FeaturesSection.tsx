import React from 'react';
import {
  Building2,
  Users,
  FileText,
  Receipt,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { FeatureCard, FeatureCardProps } from './FeatureCard';

const coreFeatures: FeatureCardProps[] = [
  {
    icon: Building2,
    title: 'Property & Unit Hierarchy',
    description:
      'Model complex real-estate assets with full depth: Property → Building → Floor → Unit. Track unit types, monthly rent, and occupancy statuses seamlessly.',
    points: ['Hierarchical data tree', 'Occupancy state tracking', 'Search & multi-filter support'],
    tag: 'Core Asset Management',
    accentColor: 'indigo',
  },
  {
    icon: Users,
    title: 'Tenant & Owner Directory',
    description:
      'Manage complete tenant and property owner profiles. Link owners to owned units and tenants to active leases with emergency contacts and identity records.',
    points: ['Owner portfolio management', 'Tenant contact & KYC tracking', 'Emergency contact records'],
    tag: 'Stakeholder CRM',
    accentColor: 'emerald',
  },
  {
    icon: FileText,
    title: 'Leases & Occupancy Tracking',
    description:
      'Handle end-to-end lease contracts. Monitor lease duration, security deposit status, rent frequencies, renewal cycles, and automated expiration warnings.',
    points: ['Security deposit management', 'Contract lifecycle states', 'Automated renewal reminders'],
    tag: 'Contract Engine',
    accentColor: 'blue',
  },
  {
    icon: Receipt,
    title: 'Rent, Invoicing & Payments',
    description:
      'Automate monthly rent invoice generation with precise fee breakdown: base rent, maintenance charges, late fees, and discounts. Record full or partial payments.',
    points: ['Math-validated balance due', 'Partial payment handling', 'Instant PDF & CSV receipting'],
    tag: 'Financial Engine',
    accentColor: 'purple',
  },
  {
    icon: Wrench,
    title: 'Maintenance Ticket System',
    description:
      'Coordinate repairs efficiently with priority levels (Low, Medium, High, Urgent), technician assignments, real-time status transitions, and collaborative comments.',
    points: ['Live Socket.IO updates', 'Role-scoped ticket dispatches', 'Time-stamped resolution logs'],
    tag: 'Operations Dispatch',
    accentColor: 'amber',
  },
  {
    icon: ShieldCheck,
    title: 'Visitor & Gate Pass Management',
    description:
      'Elevate physical site security with digital gate passes. Tenants pre-approve guests and deliveries; security teams log verified check-ins and check-outs in real time.',
    points: ['Pre-approval passcodes', 'Delivery tracking mode', 'Time-stamped digital gate logs'],
    tag: 'Access & Security',
    accentColor: 'rose',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-16 sm:py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Complete Capabilities
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything Required to Run Your Properties at Scale
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminate fragmented spreadsheets and disparate tools. TPMS delivers a unified,
            enterprise-grade platform connecting administration, leasing, billing, and site operations.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {coreFeatures.map((feat, index) => (
            <FeatureCard key={index} {...feat} />
          ))}
        </div>
      </div>
    </section>
  );
};

