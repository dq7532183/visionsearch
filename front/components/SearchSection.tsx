import React, { useState, useRef, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { MediaItem } from '../types';
import { validateText, validateFile } from '../utils/validation';
import MediaCard from './MediaCard';

interface SearchSectionProps {
  onPreview: (item: MediaItem) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onPreview }) => {
  const [query, setQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<'image' | 'video' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 默认展开模型选择，因为用户强调必须选择
  const [showSettings, setShowSettings] = useState(false);
  const [limit, setLimit] = useState(10);
  const [minScoreText, setMinScoreText] = useState(0.2);
  const [minScoreImage, setMinScoreImage] = useState(0.2);
  const [primaryModel, setPrimaryModel] = useState('doubao_250615');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query && !selectedFile && !selectedMedia) return;

    // 二次校验：如果当前是视频搜索但切换到了 Jina 模型
    if (selectedFileType === 'video' && (primaryModel === 'jina_v4' || primaryModel === 'jina_clip_v2')) {
      showError('Jina 模型不支持视频搜索，请先移除视频或更换模型');
      return;
    }

    setIsSearching(true);
    try {
      let searchResults;
      const minScore = selectedFile ? minScoreImage : minScoreText;

      if (selectedFile) {
        searchResults = await DBService.searchByMedia(selectedFile, limit, minScore, primaryModel);
      } else if (selectedMedia && !selectedFile) {
        // 这一块主要针对从 URL 粘贴或 Mock 数据处理
        const response = await fetch(selectedMedia);
        const blob = await response.blob();
        const file = new File([blob], `search.${selectedFileType === 'video' ? 'mp4' : 'jpg'}`, { type: blob.type });
        searchResults = await DBService.searchByMedia(file, limit, minScore, primaryModel);
      } else if (query) {
        searchResults = await DBService.searchByText(query, limit, minScore, primaryModel);
      }

      setResults(searchResults || []);
    } catch (error: any) {
      console.error('Search failed', error);
      showError(error.message || '搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('video/') ? 'video' : 'image';

      // Jina 模型不支持视频搜索校验
      if (type === 'video' && (primaryModel === 'jina_v4' || primaryModel === 'jina_clip_v2')) {
        showError('Jina 模型目前仅支持文本和图片，请选择 Doubao 或 Qwen 模型进行视频搜索');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setSelectedFile(file);
      setSelectedFileType(type);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedMedia(ev.target?.result as string);
        setQuery('');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12">
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <section className="text-center space-y-8 max-w-3xl mx-auto py-12 relative">
        <h2 className="text-4xl font-extrabold tracking-tight">
          多模型 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">对标搜索 (5模型)</span>
        </h2>

        {/* 模型选择器 - 显式展示 */}
        <div className="max-w-md mx-auto relative z-20">
          <div className="bg-slate-800/50 p-1 rounded-lg border border-slate-700 flex gap-2 items-center px-3">
            <span className="text-sm text-slate-400 whitespace-nowrap"><i className="fa-solid fa-microchip mr-1"></i>当前模型:</span>
            <select
              value={primaryModel}
              onChange={(e) => setPrimaryModel(e.target.value)}
              className="w-full bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer [&>option]:text-black"
            >
              <option value="doubao_250615">Doubao-Embedding-250615</option>
              <option value="doubao_251215">Doubao-Embedding-251215</option>
              <option value="jina_v4">Jina-Embedding-V4</option>
              <option value="jina_clip_v2">Jina-CLIP-V2</option>
              <option value="qwen_vl">Qwen2.5-VL-Embedding</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative z-10">
          <div className="flex items-center glass-panel rounded-2xl p-2 focus-within:ring-2 ring-blue-500 shadow-2xl">
            <div className="pl-4 pr-2 text-slate-500"><i className="fa-solid fa-magnifying-glass"></i></div>

            {selectedMedia && (
              <div className="flex items-center bg-slate-800 rounded-lg p-1 pr-3 border border-slate-700">
                {selectedFileType === 'image' ? (
                  <img src={selectedMedia} alt="query" className="w-10 h-10 object-contain rounded-md" />
                ) : (
                  <div className="w-10 h-10 bg-black rounded-md flex items-center justify-center">
                    <i className="fa-solid fa-film text-blue-400 text-xs"></i>
                  </div>
                )}
                <button onClick={() => { setSelectedMedia(null); setSelectedFile(null); setSelectedFileType(null); }} className="ml-2 hover:text-red-400"><i className="fa-solid fa-circle-xmark"></i></button>
              </div>
            )}

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedMedia ? "" : "搜索你想找的内容..."}
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-lg"
            />

            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-400"><i className="fa-solid fa-video"></i></button>
            <button type="button" onClick={() => setShowSettings(!showSettings)} className={`p-3 ${showSettings ? 'text-blue-400' : 'text-slate-400'}`}><i className="fa-solid fa-sliders"></i></button>
            <button type="submit" disabled={isSearching} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg">
              {isSearching ? <i className="fa-solid fa-spinner fa-spin"></i> : '搜 索'}
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" className="hidden" />
        </form>

        {showSettings && (
          <div className="absolute left-0 right-0 top-full mt-4 p-6 glass-panel rounded-2xl z-20 shadow-2xl border border-slate-700 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">数量: {limit}</label>
                  <input type="range" min="1" max="50" value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} className="w-full accent-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">阈值: {selectedFile ? minScoreImage : minScoreText}</label>
                  <input type="range" min="0" max="1" step="0.05" value={selectedFile ? minScoreImage : minScoreText} onChange={(e) => selectedFile ? setMinScoreImage(parseFloat(e.target.value)) : setMinScoreText(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-6">
        {results.length > 0 && <h3 className="text-xl font-bold">搜索结果: <span className="text-blue-400">{primaryModel}</span></h3>}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-10">
            {results.map((item) => <MediaCard key={item.id} item={item} showScore onClick={onPreview} />)}
          </div>
        ) : !isSearching && query ? (
          <div className="text-center py-20 text-slate-500">未找到结果，请尝试调整阈值</div>
        ) : null}
      </section>
    </div>
  );
};

export default SearchSection;
