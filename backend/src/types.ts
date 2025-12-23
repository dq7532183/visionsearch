export interface MediaItem {
    id: number;
    name: string;
    url: string;
    type: 'image' | 'video';
    created_at: Date;
    // 多模型分数
    scores?: {
        doubao_250615?: number;
        doubao_251215?: number;
        jina_v4?: number;
        jina_clip_v2?: number;
        qwen_vl?: number;
    };
}

export interface SearchResult extends MediaItem {
    score: number; // 主模型的排分
}

export interface MultiModelEmbeddings {
    doubao_250615: number[];
    doubao_251215: number[];
    jina_v4: number[];
    jina_clip_v2: number[];
    qwen_vl: number[];
}
