import React, { useState } from 'react';
import { Send, UploadCloud, Loader2 } from 'lucide-react';

export default function ChatInput({ 
  onSendMessage, 
  isDisabled, 
  onOpenUpload, 
  loadingStep 
}) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isDisabled && !loadingStep) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  return (
    <div className="p-4 bg-[#080B11] border-t border-slate-800/80 backdrop-blur-md sticky bottom-0 z-10">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
        {loadingStep && (
          <div className="mb-2 flex items-center gap-2 text-xs text-blue-400 font-medium animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{loadingStep}</span>
          </div>
        )}
        <div className="relative flex items-center w-full">
          {/* Left Upload Button */}
          <button
            type="button"
            onClick={onOpenUpload}
            className="absolute left-3.5 z-10 p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 transition-colors"
            title="Upload new documents"
          >
            <UploadCloud className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isDisabled || !!loadingStep}
            placeholder={
              isDisabled
                ? 'Upload a document first to start asking questions...'
                : 'Ask anything about your uploaded documents...'
            }
            className="w-full py-3.5 pl-11 pr-14 rounded-2xl bg-[#0F172A]/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all disabled:opacity-50"
          />

          {/* Right Send Button */}
          <button
            type="submit"
            disabled={!text.trim() || isDisabled || !!loadingStep}
            className="absolute right-2.5 z-10 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
