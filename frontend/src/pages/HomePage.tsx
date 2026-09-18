import React from 'react';
import { useHealth } from '@/hooks/useHealth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Activity, CheckCircle2, XCircle, RefreshCw, Database, Server, Clock, AlertTriangle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useHealth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* System Overview Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          System Foundation & Health Monitor
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Verifying end-to-end connectivity across React, Axios, Express API, and Prisma ORM.
        </p>
      </div>

      {/* Main Connection Status Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5 text-indigo-600" />
              Backend Connection
            </CardTitle>
            <CardDescription>Live health check status from Express API (/api/health)</CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-slate-500 font-medium">Querying backend status...</p>
            </div>
          )}

          {/* Error State: Disconnected */}
          {isError && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-3">
                  <XCircle className="h-7 w-7 text-rose-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-900">Backend status:</h4>
                    <p className="text-lg font-bold text-rose-700">Disconnected</p>
                  </div>
                </div>
                <Badge variant="danger">Offline</Badge>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Connection Diagnostic:
                </div>
                <p className="font-mono text-xs bg-white p-3 rounded border border-slate-200 text-rose-600 overflow-x-auto">
                  {error?.message || 'Failed to reach API server. Ensure Express backend is running on port 5000.'}
                </p>
                <p className="text-xs text-slate-500">
                  Target Endpoint: <code className="bg-slate-200 px-1 py-0.5 rounded">{import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/health</code>
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && !data && (
            <div className="p-8 text-center rounded-lg bg-slate-50 border border-dashed border-slate-200">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm font-medium text-slate-700">No health data received</p>
              <p className="text-xs text-slate-500 mt-1">The server returned an empty response.</p>
            </div>
          )}

          {/* Success State: Connected */}
          {!isLoading && !isError && data && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-900">Backend status:</h4>
                    <p className="text-lg font-bold text-emerald-700">Connected</p>
                  </div>
                </div>
                <Badge variant="success">Online</Badge>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <Server className="h-4 w-4 text-indigo-500" />
                    API Response
                  </div>
                  <p className="text-sm font-medium text-slate-900">{data.message}</p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    API Uptime
                  </div>
                  <p className="text-sm font-medium text-slate-900 font-mono">
                    {data.data?.uptime ? `${Math.floor(data.data.uptime)}s` : 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <Database className="h-4 w-4 text-indigo-500" />
                    Database
                  </div>
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {data.data?.database || 'Not connected'}
                  </p>
                </div>
              </div>

              {/* Raw Response Payload for Verification */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Raw API Payload
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between text-xs text-slate-500">
          <span>Stack: React + Vite + Tailwind → Axios → Express → Prisma</span>
          <span>Auto-polls every 15s</span>
        </CardFooter>
      </Card>
    </div>
  );
};

