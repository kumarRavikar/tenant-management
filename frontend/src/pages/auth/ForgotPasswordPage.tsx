import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/features/auth/auth.hooks';
import { forgotPasswordFormSchema } from '@/features/auth/auth.schemas';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ZodError } from 'zod';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const forgotMutation = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setResultMessage(null);
    setDevResetToken(null);

    try {
      const validated = forgotPasswordFormSchema.parse({ email });
      const result = await forgotMutation.mutateAsync(validated);
      setResultMessage(result.message);
      if (result.resetToken) {
        setDevResetToken(result.resetToken);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        setFieldErrors({ email: err.errors[0]?.message || 'Invalid email' });
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Failed to initiate password reset');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive password reset instructions</CardDescription>
        </CardHeader>

        <CardContent>
          {generalError && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {resultMessage && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col gap-2 text-emerald-800 text-sm">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{resultMessage}</span>
              </div>
              {devResetToken && (
                <div className="mt-2 p-2 bg-white rounded border border-emerald-300 text-xs font-mono text-slate-800 break-all">
                  <strong>Dev Reset Token:</strong> {devResetToken}
                  <div className="mt-2">
                    <Link
                      to={`/reset-password?token=${devResetToken}`}
                      className="text-indigo-600 font-bold underline"
                    >
                      Click here to proceed to Reset Password Page
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={forgotMutation.isPending}
            >
              Send Reset Instructions
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-xs text-slate-600 justify-center">
          Remember your password?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline ml-1">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

