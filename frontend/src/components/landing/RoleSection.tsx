import React, { useState } from 'react';
import {
  ShieldAlert,
  Building,
  Briefcase,
  Home,
  CheckCircle2,
} from 'lucide-react';

const rolesData = [
  {
    id: 'admin',
    roleName: 'Super & Property Admins',
    icon: ShieldAlert,
    tagline: 'Complete Portfolio Governance & Oversight',
    description:
      'Manage multiple properties, configure organizational structures, supervise team roles, and track portfolio-wide revenues with complete audit compliance.',
    features: [
      'Multi-property architecture & building configurations',
      'Role-Based Access Control (RBAC) permission enforcement',
      'Consolidated financial analytics & PDF/CSV reporting',
      'System-wide audit logs and administrative management',
    ],
  },
  {
    id: 'manager',
    roleName: 'Property Managers',
    icon: Briefcase,
    tagline: 'Operational Command for Daily Excellence',
    description:
      'Supervise daily operations, inspect unit states, execute lease agreements, dispatch technicians, and manage visitor entries without friction.',
    features: [
      'Assigned property and unit lifecycle operations',
      'Lease creation, document association, and renewal alerts',
      'Maintenance ticket triage with technician assignment',
      'Visitor check-in and check-out security monitoring',
    ],
  },
  {
    id: 'owner',
    roleName: 'Property Owners',
    icon: Building,
    tagline: 'Clear Visibility into Asset Performance',
    description:
      'Stay continuously informed about your owned properties, tenant status, monthly rental collections, and maintenance expenditures.',
    features: [
      'Dedicated dashboard of owned units and tenant occupancy',
      'Rental income statement and collection tracking',
      'Transparent oversight of maintenance expenditures',
      'Direct contact linkage with property management staff',
    ],
  },
  {
    id: 'tenant',
    roleName: 'Tenants',
    icon: Home,
    tagline: 'Frictionless Self-Service Resident Experience',
    description:
      'Experience modern rental living: review active lease terms, pay rent invoices digitally, submit repair tickets with live updates, and generate gate passes for guests.',
    features: [
      'Personal lease overview and security deposit status',
      'Itemized monthly rent invoices with instant payment records',
      'Quick-raise maintenance requests with real-time comments',
      'Digital guest passes and delivery tracking for front gate',
    ],
  },
];

export const RoleSection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState(rolesData[0].id);
  const currentRole = rolesData.find((r) => r.id === selectedRole) || rolesData[0];
  const Icon = currentRole.icon;

  return (
    <section id="roles" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Tailored Experiences
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Every Stakeholder in Real Estate
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Whether you oversee a multi-city portfolio or live in a single unit, TPMS delivers a
            specialized interface matching your specific operational responsibilities.
          </p>
        </div>

        {/* Role Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {rolesData.map((role) => {
            const RoleIcon = role.icon;
            const isSelected = role.id === selectedRole;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-xl w-fit ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <RoleIcon className="w-5 h-5" />
                </div>
                <div>
                  <div
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected ? 'text-indigo-950' : 'text-slate-800'
                    }`}
                  >
                    {role.roleName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Role Card Showcase */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">{currentRole.roleName}</h3>
                  <p className="text-xs sm:text-sm text-indigo-300">{currentRole.tagline}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                ROLE_BASED_ACCESS
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {currentRole.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {currentRole.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
