import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/features/auth/auth.hooks';

export const CTASection: React.FC = () => {
  const { data: user } = useCurrentUser();

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xl">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Modernize Your Portfolio Today</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to Transform Your Property Operations?
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-indigo-200/90 leading-relaxed max-w-2xl mx-auto">
              Join landlords, property managers, and owners using TPMS to streamline leasing, automate
              rent collection, dispatch maintenance, and secure physical access.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-indigo-950 hover:bg-slate-100 flex items-center gap-2 px-8 font-bold shadow-lg">
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="bg-white text-indigo-950 hover:bg-slate-100 flex items-center gap-2 px-8 font-bold shadow-lg">
                      <span>Create Free Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/signin">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-indigo-400/40 text-white hover:bg-indigo-800/40 px-8"
                    >
                      <span>Sign In</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <p className="text-xs text-indigo-300/80 pt-2">
              Role-based permissions • Instant deployment • Real-time notifications
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

