import React from 'react';
import {
  ShieldCheck,
  KeyRound,
  Radio,
  FileSpreadsheet,
  Lock,
  Database,
} from 'lucide-react';

const trustHighlights = [
  {
    icon: KeyRound,
    title: '5-Tier RBAC Architecture',
    description:
      'Strict permission isolation across Super Admin, Property Admin, Manager, Owner, and Tenant. No cross-tenant data leaks.',
  },
  {
    icon: Lock,
    title: 'Secure JWT Session Lifecycle',
    description:
      'Access tokens with automated refresh rotation, bcrypt password hashing, and complete server-side session revoking.',
  },
  {
    icon: Radio,
    title: 'Real-Time WebSocket Sync',
    description:
      'Authenticated Socket.IO channels instantly dispatch ticket updates and critical notifications without polling.',
  },
  {
    icon: Database,
    title: 'Relational Integrity & Audits',
    description:
      'PostgreSQL-backed relational guarantees with Prisma ORM ensure mathematically validated invoices and audit timestamps.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Instant PDF & CSV Exports',
    description:
      'Generate audit-ready reports on demand. Export occupancy metrics, rent collection logs, and maintenance logs in one click.',
  },
  {
    icon: ShieldCheck,
    title: 'Input & Route Validation',
    description:
      'Zod-validated schemas on every request and rate-limiting safeguards protect against invalid payloads and abuse.',
  },
];

export const SecuritySection: React.FC = () => {
  return (
    <section id="security" className="py-16 sm:py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Engineering & Security
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built on a Reliable, Production-Grade Foundation
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Enterprise property data requires dependable guarantees. We built TPMS with rigorous
            security standards, transactional consistency, and predictable performance.
          </p>
        </div>

        {/* 6 Grid items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3"
              >
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

