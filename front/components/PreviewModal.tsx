
import React, { useEffect } from 'react';
import { MediaItem } from '../types';

interface PreviewModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  // 监听 ESC 键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (item) {
      window.addEventListener('keydown', handleKeyDown);
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative glass-panel w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <span className="bg-slate-900/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-slate-400 flex items-center border border-white/10">
            按 ESC 退出预览
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-red-500 text-white rounded-full transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[85vh]">
          {/* Media Viewport */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[40vh]">
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={item.url}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            )}
          </div>

          {/* Sidebar Info */}
          <div className="w-full lg:w-80 p-6 space-y-6 bg-slate-900/50 overflow-y-auto">
            <div>
              <h3 className="text-xl font-bold text-white break-words">{item.name}</h3>
              <p className="text-slate-400 text-xs mt-1">ID: {item.id}</p>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">文件类型</p>
                <div className="flex items-center gap-2 text-slate-200">
                  <i className={item.type === 'image' ? 'fa-solid fa-image' : 'fa-solid fa-video'}></i>
                  <span className="capitalize">{item.type}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">创建日期</p>
                <div className="text-slate-200">
                  {item.created_at ? new Date(item.created_at).toLocaleString() : '未知时间'}
                </div>
              </div>

              {item.score && (
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <p className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-1">匹配得分</p>
                  <div className="text-xl font-bold text-blue-300">
                    {(item.score * 100).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-2">
              <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-download"></i> 下载
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
