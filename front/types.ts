export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: number;
  url: string;
  name: string;
  type: MediaType;
  created_at: string;
  // 多模型分数
  scores?: {
    doubao_250615?: number;
    doubao_251215?: number;
    jina_v4?: number;
    jina_clip_v2?: number;
    qwen_vl?: number;
  };
  score?: number; // 当前排序得分
}

export type AppTab = 'search' | 'dataset';
