import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  ...props
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 border-emerald-200',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 border-rose-200',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 ring-1 ring-slate-400/20 border-slate-200',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 border-blue-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

