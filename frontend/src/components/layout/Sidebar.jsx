import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  MessageSquarePlus,
  MessageSquare,
  FileText,
  BarChart3,
  Trash2
} from 'lucide-react';

export default function Sidebar({ recentChats, activeChatId, onNewChat, onOpenChat, onDeleteChat }) {
  return (
    <aside className="w-64 h-screen bg-[#0B0F17] border-r border-slate-800/60 flex flex-col justify-between select-none z-20 shrink-0">
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top Logo & App Title */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-slate-100 leading-tight">DocIntelligence</h1>
            </div>
          </div>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all duration-200 active:scale-[0.98]"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Recent Chats Section */}
        <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recent Chats</span>
          </div>

          {recentChats.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-600">No conversations yet</p>
          ) : (
            recentChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center rounded-lg text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800/80 text-white font-medium shadow-sm border border-slate-700/50'
                      : 'text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <button
                    onClick={() => onOpenChat(chat.id)}
                    title={chat.title}
                    className="flex-1 flex items-center gap-2.5 truncate px-3 py-2 text-left hover:text-slate-200"
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="truncate">{chat.title}</span>
                  </button>
                  <button
                    onClick={() => onDeleteChat(chat)}
                    title="Delete chat"
                    className="p-1.5 mr-1 rounded-lg text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Divider */}
        <div className="px-4 py-2">
          <div className="h-[1px] bg-slate-800/60" />
        </div>

        {/* Primary Navigation */}
        <div className="p-3 space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`
            }
          >
            <MessageSquare className="w-4 h-4" />
            <span>Assistant Chat</span>
          </NavLink>

          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`
            }
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
