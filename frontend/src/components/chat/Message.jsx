import React from 'react';
import { User, Sparkles, FileText } from 'lucide-react';

// The backend sends UTC timestamps, so let the browser show them in
// whatever timezone the reader is in.
function formatTime(value) {
  const date = new Date(value);
  return isNaN(date) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`p-4 flex gap-4 ${isUser ? 'bg-[#0B0F17]/40' : 'bg-[#0B0F17]'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser ? 'bg-slate-800 text-slate-300' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            {isUser ? 'You' : 'DocIntelligence Assistant'}
          </span>
          <span className="text-[10px] text-slate-500">{formatTime(message.timestamp)}</span>
        </div>

        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {message.text}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Citations</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {message.citations.map((cit) => (
                <div key={cit.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-blue-400 font-medium mb-1">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {cit.documentName}
                      {cit.pageNumber ? ` (Page ${cit.pageNumber})` : ''}
                    </span>
                  </div>
                  {cit.section && (
                    <p className="text-[10px] text-slate-500 mb-1 truncate">{cit.section}</p>
                  )}
                  <p className="text-[11px] text-slate-400 line-clamp-2">{cit.originalParagraph}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
