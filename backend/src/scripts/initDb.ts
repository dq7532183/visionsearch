import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

/**
 * 数据库初始化脚本
 * 创建表和索引
 */
async function initDatabase() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'searchimg_db',
    });

    try {
        console.log('🔄 连接数据库...');
        await client.connect();
        console.log('✅ 数据库连接成功');

        // 1. 创建 pgvector 扩展
        console.log('🔄 创建 pgvector 扩展...');
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('✅ pgvector 扩展已就绪');

        // 2. 创建媒体表
        console.log('🔄 创建 media_items 表...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS media_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        embedding vector(2048),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ media_items 表已就绪');

        // 3. 创建 HNSW 索引
        console.log('🔄 创建 HNSW 向量索引...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS media_items_embedding_idx 
      ON media_items USING hnsw (embedding vector_cosine_ops);
    `);
        console.log('✅ HNSW 索引已创建');

        // 4. 验证表结构
        const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'media_items'
      ORDER BY ordinal_position;
    `);

        console.log('\n📋 表结构:');
        console.table(result.rows);

        // 5. 检查现有数据
        const countResult = await client.query('SELECT COUNT(*) FROM media_items');
        console.log(`\n📊 当前数据量: ${countResult.rows[0].count} 条记录`);

        console.log('\n✅ 数据库初始化完成!');
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// 运行初始化
initDatabase();
