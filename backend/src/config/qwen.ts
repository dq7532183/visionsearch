import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const QWEN_CONFIG = {
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    // DashScope 多模态 Embedding API 端点
    baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding',
    model: 'qwen2.5-vl-embedding', // 用户指定的模型名
    dimension: 1024,
};

// 创建 axios 客户端
export const qwenClient: AxiosInstance = axios.create({
    baseURL: QWEN_CONFIG.baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_CONFIG.apiKey}`,
    },
    timeout: 60000,
});

qwenClient.interceptors.request.use((config) => {
    console.log(`🔄 调用 Qwen API: ${config.url || QWEN_CONFIG.baseURL}`);
    // DashScope 需要 X-DashScope-WorkSpace 吗？通常只需要 Authorization
    return config;
});

qwenClient.interceptors.response.use(
    (response) => {
        console.log('✅ Qwen API 响应成功');
        return response;
    },
    (error) => {
        console.error('❌ Qwen API 响应错误:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
