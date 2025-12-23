<img width="1719" height="1221" alt="591ae86a672ec69c5d421f34198a8f49" src="https://github.com/user-attachments/assets/b05b944f-88f2-43a9-be99-16cb32028657" />

<img width="995" height="878" alt="bf925ae73e98807e057e030bbc1b8882" src="https://github.com/user-attachments/assets/42f01dd8-bdb3-458d-9fc5-00849acb655b" />
<img width="999" height="1106" alt="15942dcc9017dae4dfa1e0c8e7f51c00" src="https://github.com/user-attachments/assets/d31c7505-3b58-45ed-8a5a-20dd69d25dac" />

<img width="973" height="814" alt="344217fa92670c2410f29b548a0b778e" src="https://github.com/user-attachments/assets/0cddca07-43c2-4c22-b9d0-e547b6f9586e" />

# 多模态视觉搜索引擎 (VisionSearch AI)

基于最新多模态向量化模型与 PostgreSQL `pgvector` 的跨模态搜索引擎。支持 **文搜、图搜、视频搜**，并集成了 5 种先进的向量化模型。

## 🌟 核心新功能

-   **五大模型引擎支持**：
    -   **Doubao-VL (250615 & 251215)**: 强大的多模态向量化。
    -   **Jina AI (v4 & Clip v2)**: 针对检索优化的中英文双语模型。
    -   **Qwen-VL (DashScope)**: 阿里通义千问多模态向量模型。
-   **全媒体类型覆盖**：不仅支持图片，还完整支持了**短视频**的上传、向量化与相似度检索。
-   **TOS 云端集成**：集成火山引擎 TOS 对象存储，支持大文件上传及公网 URL 访问。
-   **指令检索 (Instruction-based)**：利用 Doubao 251215 模型支持指令引导，提升搜索意图理解。

## 项目结构

```
visionsearch-ai/
├── front/          # React + Vite 前端 (支持多模型切换、文件预览)
└── backend/        # Node.js + Express 后端 (支持多模型并发生成、pgvector 检索)
```

## 快速开始

### 1. 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量 (复制 .env.example 并填写 Key)
cp .env.example .env

# 初始化数据库
npm run init:db

# 启动后端服务
npm run dev
```

### 2. 前端启动

```bash
cd front

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 🔑 环境变量配置

编辑 `backend/.env` 文件，完善以下配置以启用所有引擎：

-   **Doubao**: `DOUBAO_API_KEY` (必填)
-   **Jina AI**: `JINA_API_KEY`
-   **Qwen-VL**: `DASHSCOPE_API_KEY`
-   **Storage**: `TOS_ACCESS_KEY`, `TOS_SECRET_KEY`, `TOS_BUCKET` (启用云存储)

## 技术栈

-   **前端**: React 19 + TypeScript + Vite + Lucide Icons
-   **后端**: Node.js + Express + Multer + Sharp
-   **数据库**: PostgreSQL 15+ + **pgvector** (向量搜索扩展)
-   **模型引擎**:
    -   `doubao-embedding-vision-250615` (2048D)
    -   `doubao-embedding-vision-251215` (1024D + Instructions)
    -   `jina-embeddings-v4` / `jina-clip-v2`
    -   `qwen2.5-vl-embedding`

## 功能特性

✅ **多模态搜索**: 文本、图片、视频自由检索。
✅ **多模型并联**: 一次上传，5 个模型同时生成向量，支持效果对比。
✅ **HNSW 索引**: 数据库侧使用 HNSW 算法加速向量检索。
✅ **流畅体验**: 支持视频悬停预览、图片长按放大、多级相似度过滤。
✅ **持久化**: 所有媒体元数据与向量均存储在本地 PostgreSQL 数据库。
