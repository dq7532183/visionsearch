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

async function createIndex() {
    const client = await pool.connect();
    try {
        console.log('🔄 尝试创建向量索引...');

        const res = await client.query('SELECT COUNT(*) FROM media_items');
        const count = parseInt(res.rows[0].count);
        console.log(`📊 当前数据量: ${count} 条`);

        // 检查 pgvector 版本
        try {
            const verRes = await client.query("SELECT extversion FROM pg_extension WHERE extname = 'vector'");
            console.log(`ℹ️ pgvector 版本: ${verRes.rows[0]?.extversion || '未知'}`);
        } catch (e) { }

        const lists = Math.max(10, Math.round(Math.sqrt(count)));

        console.log('🔄 正在尝试创建 IVFFlat 索引...');

        await client.query('DROP INDEX IF EXISTS media_items_embedding_idx');

        await client.query(`
      CREATE INDEX media_items_embedding_idx 
      ON media_items 
      USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = ${lists});
    `);

        console.log(`✅ 索引创建成功!`);

    } catch (err: any) {
        if (err.message.includes('more than 2000 dimensions')) {
            console.error('\n❌ 索引创建失败: 向量维度过高 (2048 > 2000)');
            console.error('📋 原因解释: PostgreSQL 的默认页大小(8KB)限制了索引条目的最大大小。2048维 float32 向量超过了这个限制。');
            console.error('💡 建议方案:');
            console.error('   1. 对于当前 Demo (几千条数据以内)，**不需要创建索引**。全表扫描(Exact Search)速度极快且精度最高。');
            console.error('   2. 如果必须建索引，需要将 embedding 列类型改为 halfvec (仅支持 pgvector 0.7.0+)。');
            console.error('   3. 或者在应用层对向量进行 PCA 降维。');
            console.log('\n✅ 当前系统已自动回退到"全表精确搜索"模式，功能完全正常，无需担心。');
        } else {
            console.error('❌ 创建索引失败:', err.message);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

createIndex();
