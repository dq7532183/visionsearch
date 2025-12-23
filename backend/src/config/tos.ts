import { TosClient } from '@volcengine/tos-sdk';
import dotenv from 'dotenv';

dotenv.config();

// 检查是否配置了 TOS
const isTosConfigured =
    process.env.TOS_REGION &&
    process.env.TOS_ACCESS_KEY &&
    process.env.TOS_SECRET_KEY &&
    process.env.TOS_BUCKET;

let tosClient: TosClient | null = null;
const bucket = process.env.TOS_BUCKET || '';
const region = process.env.TOS_REGION || 'cn-beijing';

if (isTosConfigured) {
    try {
        tosClient = new TosClient({
            accessKeyId: process.env.TOS_ACCESS_KEY!,
            accessKeySecret: process.env.TOS_SECRET_KEY!,
            region: region,
        });
        console.log('✅ 火山引擎 TOS 客户端已初始化');
    } catch (e) {
        console.error('❌ TOS 客户端初始化失败:', e);
    }
} else {
    console.warn('⚠️ 未检测到完整的 TOS 配置，文件将仅保存在本地');
}

export { tosClient, bucket, region };
