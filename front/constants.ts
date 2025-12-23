
export const EMBEDDING_MODEL = 'doubao-embedding-vision-250615';
export const EMBEDDING_DIMENSION = 2048; // 更新为 2048 维度
export const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'searchimg_db',
  table: 'media_items'
};

export const SQL_SCHEMA = `
-- 数据库初始化脚本
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS media_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(20),
    embedding vector(2048), -- 同步更新为 2048
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以加速相似度搜索 (HNSW 索引)
CREATE INDEX ON media_items USING hnsw (embedding vector_cosine_ops);
`;

export const MOCK_ITEMS = [
  {
    id: '1',
    name: '山脉风景.jpg',
    url: 'https://picsum.photos/id/10/1200/800',
    type: 'image' as const,
    createdAt: Date.now() - 100000,
  },
  {
    id: '2',
    name: '城市夜景.jpg',
    url: 'https://picsum.photos/id/11/1200/800',
    type: 'image' as const,
    createdAt: Date.now() - 200000,
  },
  {
    id: '3',
    name: '海滩度假.mp4',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    type: 'video' as const,
    createdAt: Date.now() - 300000,
  }
];
