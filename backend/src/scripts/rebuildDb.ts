import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

/**
 * 重建数据库表
 * 删除旧表,创建符合代码设计的新表
 */
async function rebuildDatabase() {
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
        console.log('✅ 数据库连接成功\n');

        // 1. 删除旧表(如果存在)
        console.log('🗑️  删除旧表...');
        await client.query('DROP TABLE IF EXISTS media_items CASCADE;');
        console.log('✅ 旧表已删除\n');

        // 2. 确保pgvector扩展存在
        console.log('🔄 检查pgvector扩展...');
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('✅ pgvector扩展已就绪\n');

        // 3. 创建新表(使用规范的字段名)
        console.log('📋 创建新表 media_items...');
        await client.query(`
      CREATE TABLE media_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        embedding vector(2048),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ 新表创建成功\n');

        // 4. 创建IVFFlat索引(HNSW不支持2048维,改用IVFFlat)
        // 注意:需要有数据后才能创建IVFFlat索引
        console.log('💡 提示: 向量索引将在有数据后自动创建');
        console.log('   (IVFFlat索引需要至少一些数据才能训练)\n');

        // 5. 显示表结构
        const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'media_items'
      ORDER BY ordinal_position;
    `);

        console.log('📋 新表结构:');
        console.table(result.rows);

        console.log('\n✅ 数据库重建完成!');
        console.log('💡 提示: 现在可以开始上传图片和视频了');
        console.log('   上传足够数据后可以运行: npm run create:index');

    } catch (error: any) {
        console.error('❌ 数据库重建失败:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// 运行重建
rebuildDatabase();
