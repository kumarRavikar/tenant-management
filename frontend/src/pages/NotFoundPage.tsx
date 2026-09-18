import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-4xl font-extrabold text-slate-900">404</h2>
      <p className="mt-2 text-base text-slate-600">The page you requested does not exist.</p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    </div>
  );
};

