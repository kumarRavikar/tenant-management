import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { ValuePropSection } from '@/components/landing/ValuePropSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { WorkflowSection } from '@/components/landing/WorkflowSection';
import { RoleSection } from '@/components/landing/RoleSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const HomePage: React.FC = () => {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 overflow-hidden">
      {/* Hero with Dashboard Mockup */}
      <Hero />

      {/* 4 Value Pillars */}
      <ValuePropSection />

      {/* 6 Core Platform Capabilities */}
      <FeaturesSection />

      {/* Interactive Feature Deep Dive */}
      <ProductShowcase />

      {/* 4-Step Workflow */}
      <WorkflowSection />

      {/* Role-Based Personas */}
      <RoleSection />

      {/* Security & Reliability */}
      <SecuritySection />

      {/* Bottom CTA Banner */}
      <CTASection />

      {/* SaaS Landing Footer */}
      <LandingFooter />
    </div>
  );
};
