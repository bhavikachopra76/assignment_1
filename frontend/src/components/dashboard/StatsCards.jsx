import React from 'react';
import { FileText, Layers, HelpCircle, Clock, TrendingUp } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Documents',
      value: stats.totalDocuments,
      growth: stats.documentGrowth,
      icon: FileText,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Chunks',
      value: stats.totalChunks,
      growth: stats.chunkGrowth,
      icon: Layers,
      color: 'from-indigo-600 to-purple-600',
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      title: 'Questions',
      value: stats.totalQuestions,
      growth: stats.questionGrowth,
      icon: HelpCircle,
      color: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Average Response Time',
      value: stats.avgResponseTime,
      growth: stats.timeTrend,
      icon: Clock,
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition-all duration-200 shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl ${card.bgColor} ${card.borderColor} border flex items-center justify-center ${card.textColor}`}>
                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white tracking-tight">
                {card.value}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                {card.growth}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
