
/**
 * 向量化服务 - 由后端处理
 * 前端不再需要生成向量,由后端调用 Doubao API
 */
export class EmbeddingService {
  /**
   * 此方法已废弃 - 向量化在后端处理
   * 保留接口以兼容现有代码
   */
  static async generateEmbedding(input: string | File): Promise<number[]> {
    console.warn('⚠️ 向量化已迁移至后端处理');
    // 返回空数组,实际不会被使用
    return [];
  }
}
