import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

/**
 * 数据库连接测试脚本
 */
async function testDatabase() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'searchimg_db',
    });

    try {
        console.log('🔄 测试数据库连接...');
        console.log(`   主机: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(`   数据库: ${process.env.DB_NAME}`);
        console.log(`   用户: ${process.env.DB_USER}`);
        console.log('');

        await client.connect();
        console.log('✅ 数据库连接成功');

        // 检查 PostgreSQL 版本
        const versionResult = await client.query('SELECT version()');
        console.log(`📌 PostgreSQL 版本: ${versionResult.rows[0].version.split(',')[0]}`);

        // 检查 pgvector 扩展
        const extensionResult = await client.query(`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `);

        if (extensionResult.rows.length > 0) {
            console.log('✅ pgvector 扩展已安装');
        } else {
            console.log('⚠️  pgvector 扩展未安装,请运行: npm run init:db');
        }

        // 检查表是否存在
        const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'media_items'
      )
    `);

        if (tableResult.rows[0].exists) {
            console.log('✅ media_items 表已存在');

            // 检查数据量
            const countResult = await client.query('SELECT COUNT(*) FROM media_items');
            console.log(`📊 数据量: ${countResult.rows[0].count} 条记录`);
        } else {
            console.log('⚠️  media_items 表不存在,请运行: npm run init:db');
        }

        console.log('\n✅ 数据库测试完成!');
    } catch (error: any) {
        console.error('❌ 数据库测试失败:', error.message);
        console.error('\n请检查:');
        console.error('  1. PostgreSQL 服务是否已启动');
        console.error('  2. 数据库 searchimg_db 是否已创建');
        console.error('  3. 连接信息是否正确 (.env 文件)');
        process.exit(1);
    } finally {
        await client.end();
    }
}

// 运行测试
testDatabase();
