import { doubaoClient, DOUBAO_CONFIG } from '../config/doubao.js';
import { jinaClient, JINA_CONFIG } from '../config/jina.js';
import { qwenClient, QWEN_CONFIG } from '../config/qwen.js';
import fs from 'fs/promises';
import { MultiModelEmbeddings } from '../types.js';

interface DoubaoEmbeddingResponse {
    data: { embedding: number[]; };
}

interface JinaEmbeddingResponse {
    data: Array<{ embedding: number[]; }>;
}

interface QwenEmbeddingResponse {
    output: {
        embeddings: Array<{ embedding: number[]; }>;
    };
    code?: string;
    message?: string;
}

export class EmbeddingService {
    /**
     * Doubao (251215 支持 instructions)
     */
    private static async getDoubaoEmbedding(input: any, model: string, instruction?: string): Promise<number[]> {
        const requestBody: any = {
            model: model,
            encoding_format: 'float',
            dimensions: 1024, // User reported this key works for 1024D
            input: [input]
        };

        // 仅 doubao-embedding-vision-251215 支持 instructions (目前假设放在 extra_params 或顶层，暂未找到确切文档字段，参考用户提供链接)
        // 用户链接指出：`instructions` 字段
        // https://www.volcengine.com/docs/82379/1409291?lang=zh#ff993d7a
        // 示例显示 "instructions" 与 "input" 平级。
        if (instruction && model === 'doubao-embedding-vision-251215') {
            requestBody.instructions = instruction;
        }

        const response = await doubaoClient.post<DoubaoEmbeddingResponse>('/embeddings/multimodal', requestBody);
        return response.data.data.embedding;
    }

    /**
     * Jina V4 (Multimodal) & Clip V2
     * V4 支持 task 以及混排 input
     */
    private static async getJinaEmbedding(text: string | null, imagePath: string | null, model: string): Promise<number[] | null> {
        const input: any[] = [];

        // 构造 Jina 输入
        if (text) {
            input.push({ text });
        }
        if (imagePath) {
            const buffer = await fs.readFile(imagePath);
            const base64 = buffer.toString('base64');
            const ext = imagePath.split('.').pop()?.toLowerCase() || 'jpg';
            // jina-v4 也支持 image 字段吗？文档: "Multimodal embedding model"
            // 用户提供的 curl 示例中 input: [{image: "..."}] 
            // 所以 V4 和 Clip V2 都可以接受。
            input.push({ image: `data:image/${ext};base64,${base64}` });
        }

        if (input.length === 0) return null;

        const requestBody: any = {
            model: model,
            dimensions: 1024,
            embedding_type: 'float',
            input: input
        };

        if (model === 'jina-embeddings-v4') {
            // 对于 V4，如果是图搜图或文搜图，task 推荐为 text-matching (retrieval query) 或 separation?
            // 用户示例用了 text-matching。我们沿用。
            requestBody.task = 'text-matching';
        }

        try {
            const response = await jinaClient.post<JinaEmbeddingResponse>('/embeddings', requestBody);
            // 假设我们只生成一个 embedding (即便是 input 是数组，我们一般是一次生成一个条目的)
            // 如果 input.length > 1 (e.g. text+image)，返回的 data 长度为 2。
            // 但我们的业务逻辑是：要么存图片的向量，要么存文本的查询向量。
            // 当上传图片时，生成图片的 embedding。
            return response.data.data[0].embedding;
        } catch (e: any) {
            console.error(`Jina ${model} failed:`, e.response?.data || e.message);
            return null;
        }
    }

    private static async getQwenEmbedding(text: string | null, mediaUrl: string | null, mediaType: 'image' | 'video' | null): Promise<number[] | null> {
        const contents: any[] = [];
        if (text) contents.push({ text });
        if (mediaUrl) {
            if (mediaType === 'video') {
                contents.push({ video: mediaUrl });
            } else {
                contents.push({ image: mediaUrl });
            }
        }

        if (contents.length === 0) return null;

        if (mediaUrl && !mediaUrl.startsWith('http')) {
            console.warn("⚠️ Qwen 需要 HTTP URL，跳过");
            return null;
        }

        if (QWEN_CONFIG.apiKey.startsWith('sk-xxxx') || !QWEN_CONFIG.apiKey) {
            console.warn("⚠️ Qwen API Key 未配置或为占位符, 跳过");
            return null;
        }

        console.log(`🚀 Qwen Request: ${JSON.stringify({ model: QWEN_CONFIG.model, hasText: !!text, mediaUrl })}`);

        const requestBody = {
            model: QWEN_CONFIG.model,
            input: {
                contents: contents
            }
        };

        try {
            const response = await qwenClient.post<QwenEmbeddingResponse>('', requestBody);
            if (response.data.output?.embeddings) {
                const emb = response.data.output.embeddings[0].embedding;
                return emb;
            }
            console.warn('⚠️ Qwen returned no embeddings', JSON.stringify(response.data));
            return null;
        } catch (e: any) {
            console.error('❌ Qwen failed:', e.response?.data || e.message);
            return null;
        }
    }

    static async generateMultiTextEmbeddings(text: string): Promise<MultiModelEmbeddings> {
        console.log(`🔄 为文本生成5模型向量: "${text}"`);

        const [d06, d12, jinaV4, jinaClip, qwen] = await Promise.all([
            this.getDoubaoEmbedding({ type: 'text', text }, 'doubao-embedding-vision-250615'),
            this.getDoubaoEmbedding({ type: 'text', text }, 'doubao-embedding-vision-251215', 'Target_modality: text/image/video.\nInstruction:根据这个问题，找到能回答这个问题的相应文本或图片或视频\nQuery:'),
            this.getJinaEmbedding(text, null, 'jina-embeddings-v4'), // V4 (Text)
            this.getJinaEmbedding(text, null, 'jina-clip-v2'), // Clip (Text)
            this.getQwenEmbedding(text, null, null)
        ]);

        return {
            doubao_250615: d06,
            doubao_251215: d12,
            jina_v4: jinaV4 || new Array(1024).fill(0),
            jina_clip_v2: jinaClip || new Array(1024).fill(0),
            qwen_vl: qwen || new Array(1024).fill(0)
        };
    }

    static async generateMultiMediaEmbeddings(filePath: string, publicUrl: string, mediaType: 'image' | 'video'): Promise<MultiModelEmbeddings> {
        console.log(`🔄 为${mediaType}生成5模型向量: ${filePath}`);

        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString('base64');
        const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg';

        const doubaoInput = mediaType === 'video' ?
            { type: 'video_url', video_url: { url: `data:video/mp4;base64,${base64}` } } :
            { type: 'image_url', image_url: { url: `data:image/${ext};base64,${base64}` } };

        const doubaoInstruction = mediaType === 'image'
            ? 'Instruction:Compress the image into one word.\nQuery:'
            : 'Instruction:Compress the video into one word.\nQuery:';

        const [d06, d12, jinaV4, jinaClip, qwen] = await Promise.all([
            this.getDoubaoEmbedding(doubaoInput, 'doubao-embedding-vision-250615'),
            this.getDoubaoEmbedding(doubaoInput, 'doubao-embedding-vision-251215', doubaoInstruction),
            mediaType === 'image' ? this.getJinaEmbedding(null, filePath, 'jina-embeddings-v4') : Promise.resolve(null),
            mediaType === 'image' ? this.getJinaEmbedding(null, filePath, 'jina-clip-v2') : Promise.resolve(null),
            this.getQwenEmbedding(null, publicUrl, mediaType)
        ]);

        return {
            doubao_250615: d06,
            doubao_251215: d12,
            jina_v4: jinaV4 || new Array(1024).fill(0),
            jina_clip_v2: jinaClip || new Array(1024).fill(0),
            qwen_vl: qwen || new Array(1024).fill(0)
        };
    }
}
