
import React, { useState, useEffect, useRef } from 'react';
import { DBService } from '../services/dbService';
import { EmbeddingService } from '../services/embeddingService';
import { MediaItem, MediaType } from '../types';
import { validateFile } from '../utils/validation';
import MediaCard from './MediaCard';

interface DatasetSectionProps {
  onPreview: (item: MediaItem) => void;
}

const DatasetSection: React.FC<DatasetSectionProps> = ({ onPreview }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await DBService.getAll();
    setItems(data);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(5);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(10 + (i / files.length) * 85);

      try {
        const check = await validateFile(file);
        if (!check.isValid) {
          showError(`跳过 ${file.name}: ${check.error}`);
          failCount++;
          continue;
        }

        // 调用后端上传 API
        await DBService.uploadMedia(file);
        successCount++;
      } catch (error) {
        console.error('Upload failed for', file.name, error);
        showError(`处理文件 ${file.name} 时出错`);
        failCount++;
      }
    }

    setUploadProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      loadItems();
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (successCount > 0) {
        console.log(`✅ 成功上传 ${successCount} 个文件`);
      }
    }, 500);
  };

  return (
    <div className="space-y-8">
      {errorMsg && (
        <div className="fixed top-24 right-6 z-[60] animate-in slide-in-from-right-4">
          <div className="bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500/50">
            <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
            <span className="text-sm">{errorMsg}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">我的数据集</h2>
          <p className="text-slate-400 text-sm mt-1">管理并预览视觉资源库 (图片最大 10MB/36M像素, 视频最大 50MB)</p>
        </div>

        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            multiple
            accept=".jpg,.jpeg,.png,.apng,.gif,.webp,.bmp,.dib,.tiff,.tif,.ico,.icns,.sgi,.jp2,.j2k,.j2c,.jpc,.jpf,.jpx,.mp4,.avi,.mov"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg"
          >
            {isUploading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                正在向量化 {Math.round(uploadProgress)}%
              </>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up"></i>
                上传媒体
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-24">
        {items.map(item => (
          <MediaCard key={item.id} item={item} onClick={onPreview} />
        ))}

        {items.length === 0 && !isUploading && (
          <div className="col-span-full py-32 glass-panel rounded-3xl flex flex-col items-center justify-center text-slate-500">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 text-slate-400">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <p className="text-lg font-medium">数据集暂无内容，请开始上传</p>
            <p className="text-xs mt-2 text-slate-600">支持全格式图片及 MP4, AVI, MOV 视频</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetSection;
