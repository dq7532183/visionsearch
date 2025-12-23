import { Router, Request, Response } from 'express';
import { upload, FileService } from '../services/fileService.js';
import { EmbeddingService } from '../services/embeddingService.js';
import { MediaService } from '../services/mediaService.js';
import fs from 'fs/promises';

const router = Router();

const DEFAULT_LIMIT = 10;
const DEFAULT_THRESHOLD = 0.2;

/**
 * 文本搜索
 */
router.post('/text', async (req: Request, res: Response) => {
    try {
        const { text, limit = DEFAULT_LIMIT, minScore = DEFAULT_THRESHOLD, primaryModel = 'doubao_250615' } = req.body;

        if (!text) return res.status(400).json({ error: '缺少有效的文本查询' });

        // 生成所有模型向量
        const embeddings = await EmbeddingService.generateMultiTextEmbeddings(text);

        // 多模型向量搜索
        const results = await MediaService.searchMultiModel(embeddings, limit, minScore, primaryModel);

        res.json({
            success: true,
            data: results,
            query: text,
            count: results.length,
        });
    } catch (error: any) {
        console.error('❌ 文本搜索失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 媒体搜索 (图片或视频)
 */
router.post('/media', upload.single('file'), async (req: Request, res: Response) => {
    let tempFilePath: string | null = null;
    try {
        const limit = parseInt(req.body.limit) || DEFAULT_LIMIT;
        const minScore = req.body.minScore !== undefined ? parseFloat(req.body.minScore) : DEFAULT_THRESHOLD;
        const primaryModel = req.body.primaryModel || 'doubao_250615';

        let embeddings: any;

        if (req.file) {
            tempFilePath = req.file.path;
            const mediaType = FileService.getMediaType(req.file.mimetype);

            // 1. 将搜索用的媒体也上传到 TOS，以获得公网 URL (Qwen 等模型必需)
            const publicUrl = await FileService.uploadToTos(tempFilePath, req.file.originalname) || '';

            // 2. 生成多模型向量
            embeddings = await EmbeddingService.generateMultiMediaEmbeddings(tempFilePath, publicUrl, mediaType);

            // 3. 清理本地临时文件
            await fs.unlink(tempFilePath);
        } else if (req.body.imageBase64) {
            // 此处略过 Base64 的多模型处理，通常前端会传文件
            throw new Error("Base64 搜索暂不支持多模型生成，请上传文件");
        } else {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        const results = await MediaService.searchMultiModel(embeddings, limit, minScore, primaryModel);

        res.json({
            success: true,
            data: results,
            count: results.length,
        });
    } catch (error: any) {
        if (tempFilePath) await fs.unlink(tempFilePath).catch(() => { });
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
