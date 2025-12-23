import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mediaRoutes from './routes/mediaRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// ========== 中间件配置 ==========

// CORS 配置
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

// JSON 解析 (支持大文件)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 提供上传的媒体文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 请求日志
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ========== 路由配置 ==========

// 健康检查
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'visionsearch-backend',
    });
});

// API 路由
app.use('/api/media', mediaRoutes);
app.use('/api/search', searchRoutes);

// 404 处理
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: '接口不存在',
        path: req.path,
    });
});

// 全局错误处理
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ 服务器错误:', err);

    res.status(err.status || 500).json({
        success: false,
        error: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;
