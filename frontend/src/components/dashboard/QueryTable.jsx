import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const PREVIEW_ROWS = 5;

export default function QueryTable({ queries }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? queries : queries.slice(0, PREVIEW_ROWS);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          Recent Queries
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          {queries.length} total
        </span>
      </div>

      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queries.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    No questions asked yet.
                  </td>
                </tr>
              )}
              {shown.map((q) => (
                <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
                    {q.question}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{q.time}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {queries.length > PREVIEW_ROWS && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-t border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Show all {queries.length}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
