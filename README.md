# 多模态视觉搜索引擎

完整的图搜、文搜、视频搜 项目,使用React前端 + Node.js后端 + PostgreSQL+pgvector

## 项目结构

```
visionsearch-ai/
├── front/          # React + Vite 前端
└── backend/        # Node.js + Express 后端
```

## 快速开始

### 1. 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量(.env文件)

# 初始化数据库
npm run init:db

# 启动后端服务
npm run dev
```

后端服务将在 http://localhost:3000 启动

### 2. 前端启动

```bash
cd front

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:5173 启动

## 重要提示

⚠️ **需要配置 Doubao API Key**

编辑 `backend/.env` 文件,添加您的火山引擎 API Key:

```env
DOUBAO_API_KEY=your_actual_api_key_here
```

获取方式: https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey

## 技术栈

- **前端**: React 19 + Vite + TypeScript
- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL 15+ with pgvector
- **向量化**: doubao-embedding-vision-250615 (2048维)

## 功能特性

✅ 上传图片/视频并自动向量化
✅ 文本搜索图片
✅ 图片搜索相似图片
✅ 基于余弦相似度的向量检索
✅ 实时搜索结果展示

## 验证步骤

1. 上传几张图片到"数据集"
2. 在"搜索"页面输入文本或上传图片进行搜索
3. 查看返回的相似结果和相似度分数
