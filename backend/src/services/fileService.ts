import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { tosClient, bucket, region } from '../config/tos.js';

// 确保上传目录存在
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 配置 Multer 存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') }
});

export class FileService {
    static getFileUrl(filename: string): string {
        return `http://localhost:${process.env.PORT || 3000}/uploads/${filename}`;
    }

    static getMediaType(mimetype: string): 'image' | 'video' {
        return mimetype.startsWith('video/') ? 'video' : 'image';
    }

    /**
     * 上传文件到 TOS
     */
    static async uploadToTos(localFilePath: string, originalFilename: string): Promise<string | null> {
        if (!tosClient) return null;

        try {
            console.log(`☁️ 正在上传文件到 TOS: ${originalFilename}`);
            const ext = path.extname(localFilePath);
            const objectName = `visionsearch/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

            // 读取文件流
            const fileStream = fs.createReadStream(localFilePath);
            const stats = fs.statSync(localFilePath);

            await tosClient.putObject({
                bucket: bucket,
                key: objectName,
                body: fileStream,
                contentLength: stats.size,
            });

            // 生成 URL
            // Format: https://{bucket}.tos-{region}.volces.com/{objectName}
            const url = `https://${bucket}.tos-${region}.volces.com/${objectName}`;

            console.log(`✅ TOS 上传成功: ${url}`);
            return url;
        } catch (error: any) {
            console.error('❌ TOS 上传失败:', error);
            return null;
        }
    }
}
