import React from 'react';
import { Sparkles, UploadCloud } from 'lucide-react';

export default function ChatHeader({ 
  hasDocuments, 
  activeDocCount, 
  onOpenUpload
}) {
  return (
    <header className="px-6 py-3 bg-[#0B0F17]/80 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white leading-tight">
            Document Assistant Workspace
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            {hasDocuments ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeDocCount} Document(s) Active
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                No active document connected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenUpload}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 transition-all text-xs font-medium flex items-center gap-2"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Docs</span>
        </button>
      </div>
    </header>
  );
}
