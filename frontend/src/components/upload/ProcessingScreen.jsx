import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Database, FileText, Cpu, Check, AlertTriangle } from 'lucide-react';
import { getDocumentStatus } from '../../lib/api';

const STEPS = [
  { id: 'reading', label: 'Reading & Extracting Text', icon: FileText },
  { id: 'markdown', label: 'Saving Markdown File', icon: Sparkles },
  { id: 'chunking', label: 'Splitting into Chunks', icon: Database },
  { id: 'embedding', label: 'Generating Embeddings', icon: Cpu },
  { id: 'saving', label: 'Saving to Vector Store', icon: CheckCircle2 },
];

export default function ProcessingScreen({ documentIds, onComplete }) {
  const [stage, setStage] = useState('reading');
  const [finished, setFinished] = useState(0);
  const [failed, setFailed] = useState([]);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const poll = async () => {
      let docs;
      try {
        docs = await Promise.all(documentIds.map(getDocumentStatus));
      } catch {
        return; // try again on the next tick
      }
      if (cancelled) return;

      const done = docs.filter((doc) => doc.status !== 'Processing');
      setFinished(done.length);
      setFailed(done.filter((doc) => doc.status === 'Failed'));

      const running = docs.find((doc) => doc.status === 'Processing');
      if (running && running.stage) setStage(running.stage);

      if (done.length === documentIds.length) {
        clearInterval(timer);
        setTimeout(() => {
          if (!cancelled) onComplete();
        }, 900);
      }
    };

    poll();
    timer = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [documentIds]);

  const currentStep = STEPS.findIndex((step) => step.id === stage);
  const allDone = finished === documentIds.length;
  const progress = allDone
    ? 100
    : Math.round(((finished + (currentStep + 1) / STEPS.length) / documentIds.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-slide-up">

        {/* Animated Icon Glow Header */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse-glow" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-white/20">
            <Cpu className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Processing Documents</h2>
          <p className="text-xs text-slate-400 mt-1">
            {finished} of {documentIds.length} finished
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Processing Progress</span>
            <span className="text-blue-400">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5 pt-2 text-left">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = allDone || idx < currentStep;
            const isCurrent = !allDone && idx === currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                  isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/30 text-emerald-400'
                    : isCurrent
                    ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900/20 border-slate-800/60 text-slate-600 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium">{step.label}</span>
                </div>

                <div>
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {failed.length > 0 && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-left space-y-1">
            <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {failed.length} file(s) could not be processed
            </p>
            {failed.map((doc) => (
              <p key={doc.id} className="text-[11px] text-red-300/80 truncate">
                {doc.filename}: {doc.error}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
