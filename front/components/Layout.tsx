
import React from 'react';
import { AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-panel px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 search-gradient rounded-xl flex items-center justify-center text-white text-xl">
            <i className="fa-solid fa-eye"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">VisionSearch <span className="text-blue-400">AI</span></h1>
        </div>

        <nav className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
          <button
            onClick={() => onTabChange('search')}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'search' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-magnifying-glass mr-2"></i>
            搜索
          </button>
          <button
            onClick={() => onTabChange('dataset')}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'dataset' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-database mr-2"></i>
            数据集
          </button>
        </nav>

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            PGVector 已连接
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-800">
        VisionSearch AI Demo • 基于多模态 5 模型对标搜索 & PostgreSQL pgvector
      </footer>
    </div>
  );
};

export default Layout;
