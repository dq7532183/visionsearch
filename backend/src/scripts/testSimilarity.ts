import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

async function testSimilarity() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'searchimg_db',
    });

    try {
        await client.connect();

        // 1. 获取一条记录
        const res = await client.query('SELECT id, name, embedding FROM media_items LIMIT 1');
        if (res.rows.length === 0) {
            console.log('数据库为空，无法测试');
            return;
        }

        const item = res.rows[0];
        console.log(`测试项目: ${item.name} (ID: ${item.id})`);

        // 解析向量字符串
        // pgvector返回的格式通常是string: "[0.123, ...]"
        // 但在node-postgres中，有时候driver会处理还是raw string?
        // 我们在查询里强制转一下看看

        // 2. 用它自己的向量去搜索
        // 注意：pgvector在JS中作为string传递
        const embeddingStr = item.embedding;

        const query = `
      SELECT id, name, 1 - (embedding <=> $1::vector) as score
      FROM media_items
      WHERE id = $2
    `;

        const searchRes = await client.query(query, [embeddingStr, item.id]);
        const selfScore = searchRes.rows[0].score;

        console.log(`自我相似度 (期望接近1.0): ${selfScore}`);

        // 3. 检查另外一条如果不相关
        const otherRes = await client.query('SELECT id, name, 1 - (embedding <=> $1::vector) as score FROM media_items WHERE id != $2 LIMIT 1', [embeddingStr, item.id]);
        if (otherRes.rows.length > 0) {
            console.log(`与其他图片相似度 (${otherRes.rows[0].name}): ${otherRes.rows[0].score}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

testSimilarity();
