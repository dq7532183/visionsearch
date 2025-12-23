import { Router, Request, Response } from 'express';
import { upload, FileService } from '../services/fileService.js';
import { EmbeddingService } from '../services/embeddingService.js';
import { MediaService } from '../services/mediaService.js';

const router = Router();

/**
 * 上传媒体文件
 * POST /api/media/upload
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未上传文件' });
        }

        const file = req.file;
        console.log(`📤 收到文件上传: ${file.originalname}`);

        // 确定媒体类型
        const mediaType = FileService.getMediaType(file.mimetype);

        // 1. 尝试上传到 TOS (或使用本地 URL)
        let fileUrl = FileService.getFileUrl(file.filename);
        const tosUrl = await FileService.uploadToTos(file.path, file.originalname);
        if (tosUrl) {
            fileUrl = tosUrl;
        }

        // 2. 生成所有模型向量 (传入 fileUrl 供 Qwen 等模型使用)
        console.log('🔄 开始多模型向量化 (Doubao, Jina, Qwen)...');
        // generateMultiMediaEmbeddings 用于本地文件读取 (Doubao/Jina) + URL (Qwen)
        const embeddings = await EmbeddingService.generateMultiMediaEmbeddings(file.path, fileUrl, mediaType);

        // 3. 保存到数据库
        const mediaItem = await MediaService.saveMedia(
            file.originalname,
            fileUrl,
            mediaType,
            embeddings
        );

        res.json({
            success: true,
            data: mediaItem,
            message: '上传及多模型向量化成功',
        });
    } catch (error: any) {
        console.error('❌ 上传失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '上传失败',
        });
    }
});

/**
 * 获取所有媒体
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const items = await MediaService.getAllMedia();
        const count = await MediaService.getMediaCount();

        res.json({
            success: true,
            data: items,
            total: count,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 删除媒体
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await MediaService.deleteMedia(parseInt(req.params.id));
        res.json({ success: true, message: '删除成功' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
