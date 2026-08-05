import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  name,
  title = 'Delete Document',
  note = 'This will permanently remove its embeddings and vector index chunks.',
  confirmLabel = 'Delete Document',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-slide-up">

        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-slate-200">"{name}"</span>? {note}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 transition-all duration-150 active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
