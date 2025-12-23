import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

/**
 * 检查数据库表结构
 */
async function checkTableStructure() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'searchimg_db',
    });

    try {
        await client.connect();
        console.log('✅ 数据库连接成功\n');

        // 检查表结构
        const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'media_items'
      ORDER BY ordinal_position;
    `);

        console.log('📋 media_items 表结构:');
        console.table(result.rows);

        // 查看示例数据
        const dataResult = await client.query('SELECT * FROM media_items LIMIT 2');
        console.log('\n📊 示例数据:');
        console.table(dataResult.rows);

    } catch (error: any) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

checkTableStructure();
