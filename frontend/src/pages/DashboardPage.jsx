import React, { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import StatsCards from '../components/dashboard/StatsCards';
import QueryTable from '../components/dashboard/QueryTable';
import ResponseTable from '../components/dashboard/ResponseTable';
import { getStats, getRecentQueries, getResponses } from '../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [queries, setQueries] = useState([]);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getStats(), getRecentQueries(), getResponses()])
      .then(([loadedStats, loadedQueries, loadedResponses]) => {
        setStats(loadedStats);
        setQueries(loadedQueries);
        setResponses(loadedResponses);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex-1 h-screen flex flex-col bg-[#080B11] overflow-y-auto p-6 sm:p-8 space-y-8">

      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Analytics &amp; Audit</h1>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!stats && !error ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading analytics...
        </div>
      ) : (
        stats && (
          <>
            <StatsCards stats={stats} />

            <div className="space-y-8">
              <QueryTable queries={queries} />
              <ResponseTable history={responses} />
            </div>
          </>
        )
      )}

    </div>
  );
}
