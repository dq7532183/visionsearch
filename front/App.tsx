
import React, { useState } from 'react';
import Layout from './components/Layout';
import SearchSection from './components/SearchSection';
import DatasetSection from './components/DatasetSection';
import PreviewModal from './components/PreviewModal';
import { AppTab, MediaItem } from './types';
import { EMBEDDING_MODEL, EMBEDDING_DIMENSION } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('search');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handlePreview = (item: MediaItem) => {
    setPreviewItem(item);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="relative">
        {activeTab === 'search' ? (
          <SearchSection onPreview={handlePreview} />
        ) : (
          <DatasetSection onPreview={handlePreview} />
        )}
      </div>

      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      {/* 数据库状态悬浮窗口 (Debug Info) */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:flex flex-col items-end gap-2">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={`p-3 rounded-full shadow-lg border transition-all ${showDebug ? 'bg-slate-800 text-blue-400 border-blue-500/50' : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'}`}
          title="Toggle System Status"
        >
          <i className="fa-solid fa-server"></i>
        </button>

        {showDebug && (
          <div className="glass-panel p-4 rounded-2xl shadow-2xl border-blue-500/30 w-72 text-xs space-y-3 animate-in slide-in-from-right-4 fade-in duration-200">
            <div className="flex items-center justify-between font-bold border-b border-white/10 pb-2 mb-2">
              <span>系统状态</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-400">运行中</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">向量模型:</span>
                <span className="text-blue-300 font-medium px-2 py-0.5 bg-blue-500/10 rounded">多模型对标 (5 Models)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">数据库:</span>
                <span className="text-slate-200">PostgreSQL (pgvector)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">向量维度:</span>
                <span className="text-slate-200">1024D (Cosine)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 text-[10px] text-slate-500 leading-relaxed italic">
              * 演示环境已配置 pgvector 插件。点击任意卡片即可预览大图或视频。支持 Doubao, Jina, Qwen 等多模型对比。
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
