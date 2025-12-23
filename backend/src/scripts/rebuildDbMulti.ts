import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'searchimg_db',
});

async function rebuild() {
  const client = await pool.connect();
  try {
    console.log('🔄 正在重建数据库表以支持 5 个向量模型...');

    // 1. 删除旧表
    await client.query('DROP TABLE IF EXISTS media_items');

    // 2. 确保 vector 扩展已安装
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    // 3. 创建新表
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        
        emb_doubao_250615 vector(1024),
        emb_doubao_251215 vector(1024),
        
        emb_jina_v4 vector(1024),
        emb_jina_clip_v2 vector(1024),
        
        emb_qwen_vl vector(1024),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ 数据库表重建完成 (5个 1024D 向量列)');
  } catch (err: any) {
    console.error('❌ 重建失败:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

rebuild();
