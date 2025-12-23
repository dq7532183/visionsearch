import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const JINA_CONFIG = {
    apiKey: process.env.JINA_API_KEY || '',
    baseURL: 'https://api.jina.ai/v1',
    model: 'jina-embeddings-v4',
    dimension: 1024,
};

// 创建 axios 客户端
export const jinaClient: AxiosInstance = axios.create({
    baseURL: JINA_CONFIG.baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JINA_CONFIG.apiKey}`,
    },
    timeout: 60000, // Jina 响应可能较慢
});

// 请求和响应拦截器
jinaClient.interceptors.request.use(
    (config) => {
        console.log(`🔄 调用 Jina API: ${config.url}`);
        return config;
    }
);

jinaClient.interceptors.response.use(
    (response) => {
        console.log('✅ Jina API 响应成功');
        return response;
    },
    (error) => {
        console.error('❌ Jina API 响应错误:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
