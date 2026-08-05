import React from 'react';
import { FileText, Trash2, CheckCircle2, Loader2, AlertTriangle, Layers } from 'lucide-react';

export default function DocumentTable({ documents, onDeleteClick }) {
  return (
    <div className="space-y-4">
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">

            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Filename</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Pages</th>
                <th className="py-3.5 px-3">Chunks</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors group">

                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-blue-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate max-w-xs">
                        <span className="block font-medium text-slate-200 truncate">{doc.filename}</span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {doc.size}{doc.author ? ` • ${doc.author}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeStyle(doc.type)}`}>
                      {doc.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300 font-medium">
                    {doc.pages || '—'}
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1 text-slate-300 font-medium">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>{doc.chunks}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-medium">
                    {doc.uploadDate}
                  </td>

                  <td className="py-3.5 px-3">
                    <StatusBadge status={doc.status} error={doc.error} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onDeleteClick(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, error }) {
  if (status === 'Processing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing
      </span>
    );
  }

  if (status === 'Failed') {
    return (
      <span
        title={error || 'Processing failed'}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20"
      >
        <AlertTriangle className="w-3 h-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-3 h-3" />
      {status}
    </span>
  );
}

function typeStyle(type) {
  if (type === 'PDF') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (type === 'DOCX') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
}
