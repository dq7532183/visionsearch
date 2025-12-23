import React from 'react';
import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  showScore?: boolean;
  onClick?: (item: MediaItem) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, showScore, onClick }) => {
  return (
    <div
      onClick={() => onClick?.(item)}
      className="group relative glass-panel rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
        {item.type === 'image' ? (
          <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
        ) : (
          <div className="relative w-full h-full">
            <video src={item.url} className="w-full h-full object-contain" muted loop />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <i className="fa-solid fa-play text-white text-3xl opacity-80"></i>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-medium truncate text-slate-200" title={item.name}>
            {item.name}
          </p>
          {item.type === 'video' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 font-bold">
              VIDEO
            </span>
          )}
        </div>

        {/* 只显示主分数 */}
        {showScore && item.score !== undefined && (
          <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">相似度</span>
            <div className="flex items-center gap-1 text-blue-400 font-bold font-mono text-xs">
              <i className="fa-solid fa-bullseye text-[10px]"></i>
              {(item.score * 100).toFixed(1)}%
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className='truncate'>
            {(() => {
              if (!item.created_at) return '未知时间';
              const d = new Date(item.created_at);
              // 如果直接解析失败，尝试处理一些老旧浏览器的空格格式
              if (isNaN(d.getTime())) {
                const fixed = String(item.created_at).replace(/\s/, 'T');
                const d2 = new Date(fixed);
                return isNaN(d2.getTime()) ? '格式错误' : d2.toLocaleDateString();
              }
              return d.toLocaleDateString();
            })()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
