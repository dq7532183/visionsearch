import pool from '../config/database.js';
import { MediaItem, SearchResult, MultiModelEmbeddings } from '../types.js';

export class MediaService {
    /**
     * 保存媒体到数据库 (涵盖5个模型)
     */
    static async saveMedia(
        name: string,
        url: string,
        type: 'image' | 'video',
        embeddings: MultiModelEmbeddings
    ): Promise<MediaItem> {
        const query = `
      INSERT INTO media_items (
          name, url, type, 
          emb_doubao_250615, emb_doubao_251215, 
          emb_jina_v4, emb_jina_clip_v2, 
          emb_qwen_vl
      )
      VALUES ($1, $2, $3, $4::vector, $5::vector, $6::vector, $7::vector, $8::vector)
      RETURNING id, name, url, type, created_at
    `;

        try {
            // 处理 null 向量 (转为 0 向量字符串或 NULL)
            // vector 类型可以存 NULL，但为了计算方便，如果没向量，存 NULL
            // 只要前端处理好 null score 即可。

            const toVec = (vec: number[]) => {
                // 判断是否是全0 (我们在 service 里填并是全0)
                // 如果是全0，最好存为 vector(全0)，这样计算距离是 0 或 1？
                // 存 NULL 比较好，计算出来是 NULL
                if (!vec || vec.every(v => v === 0)) return null;
                return JSON.stringify(vec);
            };

            console.log('📦 Saving Media with Embeddings Status:', {
                d06: !!embeddings.doubao_250615,
                d12: !!embeddings.doubao_251215,
                jinaV4: !!embeddings.jina_v4,
                jinaClip: !!embeddings.jina_clip_v2,
                qwen: !!embeddings.qwen_vl
            });

            const result = await pool.query(query, [
                name,
                url,
                type,
                toVec(embeddings.doubao_250615),
                toVec(embeddings.doubao_251215),
                toVec(embeddings.jina_v4),
                toVec(embeddings.jina_clip_v2),
                toVec(embeddings.qwen_vl),
            ]);

            console.log(`✅ 媒体保存成功 (5模型): ${name}`);
            return result.rows[0] as MediaItem;
        } catch (error: any) {
            console.error('❌ 媒体保存失败:', error.message);
            throw new Error(`媒体保存失败: ${error.message}`);
        }
    }

    static async getAllMedia(): Promise<MediaItem[]> {
        const query = `SELECT id, name, url, type, created_at FROM media_items ORDER BY created_at DESC`;
        try {
            const result = await pool.query(query);
            return result.rows as MediaItem[];
        } catch (error: any) {
            console.error('❌ 获取媒体列表失败:', error.message);
            throw new Error(`获取媒体列表失败: ${error.message}`);
        }
    }

    static async searchMultiModel(
        queryEmbeddings: MultiModelEmbeddings,
        limit: number = 10,
        minScore: number = 0.2,
        primaryModel: string = 'doubao_250615'
    ): Promise<SearchResult[]> {
        // 映射主模型列名
        const colMap: any = {
            'doubao_250615': 'emb_doubao_250615',
            'doubao_251215': 'emb_doubao_251215',
            'jina_v4': 'emb_jina_v4',
            'jina_clip_v2': 'emb_jina_clip_v2',
            'qwen_vl': 'emb_qwen_vl'
        };
        const primaryCol = colMap[primaryModel] || 'emb_doubao_250615';

        // 获取所有查询向量字符串 (用于 SQL 参数)
        const vD06 = JSON.stringify(queryEmbeddings.doubao_250615);
        const vD12 = JSON.stringify(queryEmbeddings.doubao_251215);
        const vJ4 = JSON.stringify(queryEmbeddings.jina_v4);
        const vJC2 = JSON.stringify(queryEmbeddings.jina_clip_v2);
        const vQwen = JSON.stringify(queryEmbeddings.qwen_vl);

        // 如果某个向量全0，计算结果会出问题吗？Postgres Vector 除零错误?
        // 我们最好确保查询向量不是全0。如果是全0，相似度给 0。
        // 但 SQL 里太复杂。
        // 我们只查询非空的行。

        const query = `
      SELECT 
        id, name, url, type, created_at,
        1 - (emb_doubao_250615 <=> $1::vector) as score_250615,
        1 - (emb_doubao_251215 <=> $2::vector) as score_251215,
        1 - (emb_jina_v4 <=> $3::vector) as score_jina_v4,
        1 - (emb_jina_clip_v2 <=> $4::vector) as score_jina_clip_v2,
        1 - (emb_qwen_vl <=> $5::vector) as score_qwen_vl
      FROM media_items
      WHERE ${primaryCol} IS NOT NULL 
        AND (1 - (${primaryCol} <=> ${ // 动态选择参数位置
            primaryModel === 'doubao_250615' ? '$1' :
                primaryModel === 'doubao_251215' ? '$2' :
                    primaryModel === 'jina_v4' ? '$3' :
                        primaryModel === 'jina_clip_v2' ? '$4' : '$5'
            }::vector)) > $6
      ORDER BY ${primaryCol} <=> ${primaryModel === 'doubao_250615' ? '$1' :
                primaryModel === 'doubao_251215' ? '$2' :
                    primaryModel === 'jina_v4' ? '$3' :
                        primaryModel === 'jina_clip_v2' ? '$4' : '$5'
            }::vector
      LIMIT $7
    `;

        try {
            const result = await pool.query(query, [
                vD06, vD12, vJ4, vJC2, vQwen,
                minScore,
                limit
            ]);

            return result.rows.map(row => ({
                id: row.id,
                name: row.name,
                url: row.url,
                type: row.type,
                created_at: row.created_at,
                // 主分数
                score: parseFloat(
                    primaryModel === 'doubao_250615' ? row.score_250615 :
                        primaryModel === 'doubao_251215' ? row.score_251215 :
                            primaryModel === 'jina_v4' ? row.score_jina_v4 :
                                primaryModel === 'jina_clip_v2' ? row.score_jina_clip_v2 : row.score_qwen_vl
                ) || 0,
                scores: {
                    doubao_250615: parseFloat(row.score_250615) || 0,
                    doubao_251215: parseFloat(row.score_251215) || 0,
                    jina_v4: parseFloat(row.score_jina_v4) || 0,
                    jina_clip_v2: parseFloat(row.score_jina_clip_v2) || 0,
                    qwen_vl: parseFloat(row.score_qwen_vl) || 0,
                }
            })) as SearchResult[];
        } catch (error: any) {
            console.error('❌ 多模型搜索失败:', error.message);
            throw new Error(`搜索失败: ${error.message}`);
        }
    }

    // ... delete / count
    static async deleteMedia(id: number): Promise<void> {
        const query = 'DELETE FROM media_items WHERE id = $1';
        await pool.query(query, [id]);
    }

    static async getMediaCount(): Promise<number> {
        const query = 'SELECT COUNT(*) as count FROM media_items';
        const res = await pool.query(query);
        return parseInt(res.rows[0].count);
    }
}
