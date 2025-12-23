import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const DOUBAO_CONFIG = {
    apiKey: process.env.DOUBAO_API_KEY || '',
    baseURL: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-embedding-vision-250615',
    dimension: 2048,
};

// 创建 axios 客户端
export const doubaoClient: AxiosInstance = axios.create({
    baseURL: DOUBAO_CONFIG.baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_CONFIG.apiKey}`,
    },
    timeout: 30000,
});

// 请求拦截器
doubaoClient.interceptors.request.use(
    (config) => {
        console.log(`🔄 调用 Doubao API: ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Doubao API 请求错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
doubaoClient.interceptors.response.use(
    (response) => {
        console.log('✅ Doubao API 响应成功');
        return response;
    },
    (error) => {
        console.error('❌ Doubao API 响应错误:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default doubaoClient;
