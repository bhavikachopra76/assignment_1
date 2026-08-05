import React, { useState } from 'react';
import { History, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

const PREVIEW_ROWS = 5;

// Timestamps arrive as UTC, so show them in the reader's own timezone.
function formatTimestamp(value) {
  const date = new Date(value);
  return isNaN(date) ? '' : date.toLocaleString();
}

export default function ResponseTable({ history }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? history : history.slice(0, PREVIEW_ROWS);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          Response History
        </h3>
        <span className="text-xs text-slate-500 font-medium">Audit Log</span>
      </div>

      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Answer</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Nothing answered yet.
                  </td>
                </tr>
              )}
              {shown.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">

                  <td className="py-3.5 px-4 font-semibold text-slate-200 truncate max-w-xs">
                    {item.question}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 leading-relaxed max-w-md">
                    <p className="line-clamp-2">{item.answer}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium text-[11px] whitespace-nowrap">
                      <Bookmark className="w-3 h-3" />
                      {item.source}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-medium whitespace-nowrap">
                    {formatTimestamp(item.timestamp)}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length > PREVIEW_ROWS && (
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
                <ChevronDown className="w-3.5 h-3.5" /> Show all {history.length}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
