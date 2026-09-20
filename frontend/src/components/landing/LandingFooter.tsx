import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-base">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Building2 className="h-4 w-4" />
              </div>
              <span>TPMS Platform</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The modern operating system for landlords, property managers, owners, and tenants.
              Manage assets, leases, billing, and site security seamlessly.
            </p>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Platform Features
                </a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-white transition-colors">
                  Product Deep Dive
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">
                  Security & Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Solutions by Role */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#roles" className="hover:text-white transition-colors">
                  Super & Property Admins
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-white transition-colors">
                  Property Managers
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-white transition-colors">
                  Property Owners
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-white transition-colors">
                  Tenant Self-Service
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Account & Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Access</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/signin" className="hover:text-white transition-colors">
                  Sign In to Account
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create New Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Operations Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Tenant & Property Management System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Production Grade</span>
            <span>•</span>
            <span>RBAC Protected</span>
            <span>•</span>
            <span>Prisma & PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

