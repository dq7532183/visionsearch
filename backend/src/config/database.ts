import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 创建数据库连接池
export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'searchimg_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 测试连接
pool.on('connect', () => {
    console.log('✅ PostgreSQL 连接成功');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL 连接错误:', err);
    process.exit(-1);
});

// 优雅关闭
process.on('SIGTERM', async () => {
    await pool.end();
    console.log('PostgreSQL 连接池已关闭');
});

export default pool;
