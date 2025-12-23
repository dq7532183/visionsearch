
export const LIMITS = {
  TEXT_MAX_LENGTH: 1024,
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 单张图片小于 10 MB
  VIDEO_MAX_SIZE: 50 * 1024 * 1024,  // 单视频文件需在 50MB 以内
  // 文档支持的图片格式列表
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',   // JPEG (.jpg, .jpeg)
    'image/png',    // PNG (.png)
    'image/apng',   // PNG (.apng)
    'image/gif',    // GIF (.gif)
    'image/webp',   // WEBP (.webp)
    'image/bmp',    // BMP/DIB (.bmp, .dib)
    'image/tiff',   // TIFF (.tiff, .tif)
    'image/tif',    // TIFF (.tif)
    'image/x-icon', // ICO (.ico)
    'image/vnd.microsoft.icon', // ICO
    'image/icns',   // ICNS (.icns)
    'image/sgi',    // SGI (.sgi)
    'image/jp2',    // JPEG2000 (.jp2)
    'image/j2k',    // JPEG2000 (.j2k)
    'image/j2c',    // JPEG2000 (.j2c)
    'image/jpc',    // JPEG2000 (.jpc)
    'image/jpf',    // JPEG2000 (.jpf)
    'image/jpx'     // JPEG2000 (.jpx)
  ],
  // 文档支持的视频格式列表
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',        // MP4 (.mp4)
    'video/avi',        // AVI (.avi)
    'video/x-msvideo',  // AVI (.avi)
    'video/quicktime'   // MOV (.mov)
  ],
  MIN_IMAGE_DIM: 15,          // 宽高长度必须大于 14 px
  MAX_IMAGE_PIXELS: 36000000  // 图片像素 (宽*高) 必须小于 3600 万
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateText = (text: string): ValidationResult => {
  if (text.length > LIMITS.TEXT_MAX_LENGTH) {
    return { isValid: false, error: `文本长度超过限制 (最大 ${LIMITS.TEXT_MAX_LENGTH} 字符)` };
  }
  return { isValid: true };
};

export const validateFile = async (file: File): Promise<ValidationResult> => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (isImage) {
    if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { isValid: false, error: `不支持的图片格式: ${file.type}` };
    }
    if (file.size > LIMITS.IMAGE_MAX_SIZE) {
      return { isValid: false, error: `图片大小超过 10MB` };
    }
    
    // 异步校验宽高及像素总量
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const pixels = img.width * img.height;
        
        if (img.width <= 14 || img.height <= 14) {
          resolve({ isValid: false, error: `图片宽高必须大于 14px (当前: ${img.width}x${img.height})` });
        } else if (pixels >= LIMITS.MAX_IMAGE_PIXELS) {
          resolve({ isValid: false, error: `图片总像素需小于 3600万 (当前: ${(pixels / 1000000).toFixed(2)}M)` });
        } else {
          resolve({ isValid: true });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ isValid: false, error: '图片解析失败' });
      };
    });
  }

  if (isVideo) {
    if (!LIMITS.ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { isValid: false, error: `不支持的视频格式: ${file.type} (仅支持 MP4, AVI, MOV)` };
    }
    if (file.size > LIMITS.VIDEO_MAX_SIZE) {
      return { isValid: false, error: `视频文件超过 50MB 限制` };
    }
    return { isValid: true };
  }

  return { isValid: false, error: '不支持的文件类型 (仅限图片或视频)' };
};
