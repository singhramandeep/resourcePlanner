/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Plus, Calendar as CalendarIcon, ChevronDown, Bell, Eye, EyeOff } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddResource: () => void;
  onAddProject: () => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
}

export default function Header({ searchQuery, setSearchQuery, onAddResource, onAddProject, privacyMode, setPrivacyMode }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      {/* Left: Search Bar as a Pill */}
      <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full w-96 border border-transparent focus-within:bg-white focus-within:border-slate-200 transition-all relative">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search resources or projects..."
          className="bg-transparent border-none text-sm focus:outline-none w-full text-slate-900 placeholder:text-slate-400 pr-6"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400 rotate-45" />
          </button>
        )}
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        <button 
          onClick={() => setPrivacyMode(!privacyMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            privacyMode 
              ? 'bg-rose-50 text-rose-600 border-rose-200' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
        >
          {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{privacyMode ? "Privacy ON" : "Privacy"}</span>
        </button>

        <button 
          onClick={onAddResource}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          + Add Resource
        </button>
        
        <button 
          onClick={onAddProject}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-shadow shadow-sm"
        >
          + Add Project
        </button>

        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full" />
        </button>
      </div>
    </header>
  );
}
