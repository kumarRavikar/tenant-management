import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LayoutDashboard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardPreview } from './DashboardPreview';
import { useCurrentUser } from '@/features/auth/auth.hooks';

export const Hero: React.FC = () => {
  const { data: user } = useCurrentUser();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/40 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-purple-200/30 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Release / Category Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-100/60 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Unified Real-Estate Operations Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-indigo-900 font-bold">Release 2.0</span>
        </div>

        {/* Hero Title */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            The Modern Operating System for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800">
              Property & Tenant Management
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal max-w-3xl mx-auto leading-relaxed">
            Eliminate operational chaos with an all-in-one platform built for landlords, property
            managers, owners, and tenants. Effortlessly orchestrate properties, digital leases, automated rent
            invoicing, real-time maintenance, and digital gate passes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="flex items-center gap-2 shadow-lg shadow-indigo-600/20 px-7">
                <LayoutDashboard className="w-5 h-5" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="flex items-center gap-2 shadow-lg shadow-indigo-600/20 px-7">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="lg" className="px-7 bg-white/90 hover:bg-white">
                  <span>Sign In</span>
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Micro-copy Proof Points */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>5 Role-Based Portals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Automated Invoicing & Payments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Real-Time WebSockets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Bank-Grade RBAC Security</span>
          </div>
        </div>

        {/* Product Showcase Container */}
        <div className="pt-6 sm:pt-10">
          <div className="relative mx-auto max-w-5xl rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-200/80 via-slate-100/50 to-slate-200/30 shadow-2xl ring-1 ring-slate-900/5">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
};

