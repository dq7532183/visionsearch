import dotenv from 'dotenv';
import app from './app.js';
import pool from './config/database.js';

// 加载环境变量
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000');

/**
 * 启动服务器
 */
async function startServer() {
    try {
        // 测试数据库连接
        console.log('🔄 测试数据库连接...');
        await pool.query('SELECT NOW()');
        console.log('✅ 数据库连接成功');

        // 启动 HTTP 服务器
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ========================================');
            console.log(`   多模态视觉搜索后端服务已启动`);
            console.log(`   运行环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   服务地址: http://localhost:${PORT}`);
            console.log(`   健康检查: http://localhost:${PORT}/health`);
            console.log('========================================');
            console.log('');
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('收到 SIGTERM 信号,准备关闭服务器...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n收到 SIGINT 信号,准备关闭服务器...');
    await pool.end();
    process.exit(0);
});

// 启动
startServer();
