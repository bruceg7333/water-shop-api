const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    
    // 确保目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成文件名: 时间戳-原始文件名
    const uniqueFileName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 接受的图片类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型。只允许 JPG、PNG、GIF 和 WebP 格式。'), false);
  }
};

// 创建上传中间件
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 限制5MB
});

// 压缩图片函数
const compressImage = async (filePath, options = {}) => {
  try {
    const imageInfo = await sharp(filePath).metadata();
    
    // 根据图片大小决定压缩质量
    let quality = 80; // 默认质量
    let width = imageInfo.width;
    
    // 文件大于200KB需要压缩
    const stats = fs.statSync(filePath);
    const fileSizeInKB = stats.size / 1024;
    
    if (fileSizeInKB > 200) {
      // 如果文件太大，降低质量和尺寸
      quality = Math.min(quality, Math.floor(200 / fileSizeInKB * 80));
      
      // 如果质量已经很低但文件仍然太大，则降低尺寸
      if (quality < 40 && width > 800) {
        width = Math.floor(width * 0.7); // 降低到70%
      }
    }
    
    // 根据文件类型处理
    let compressedImage;
    if (imageInfo.format === 'png') {
      compressedImage = await sharp(filePath)
        .resize({ width: width, withoutEnlargement: true })
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    } else if (imageInfo.format === 'jpeg' || imageInfo.format === 'jpg') {
      compressedImage = await sharp(filePath)
        .resize({ width: width, withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
    } else if (imageInfo.format === 'webp') {
      compressedImage = await sharp(filePath)
        .resize({ width: width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    } else {
      // 其他格式，尝试转换为jpg
      compressedImage = await sharp(filePath)
        .resize({ width: width, withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
    }
    
    // 覆盖原始文件
    await fs.promises.writeFile(filePath, compressedImage);
    
    return true;
  } catch (error) {
    console.error('图片压缩失败:', error);
    return false;
  }
};

// 单张图片上传处理
exports.uploadSingleImage = (req, res) => {
  const uploadSingle = upload.single('image');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multer 错误
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: '文件太大，限制为5MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: `上传错误: ${err.message}`
        });
      }
      
      // 其他错误
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }
    
    // 压缩图片以满足微信小程序200KB的限制
    const filePath = path.join(__dirname, '../../public/uploads', req.file.filename);
    
    try {
      await compressImage(filePath);
      
      // 获取压缩后的文件大小
      const stats = fs.statSync(filePath);
      const compressedSize = stats.size;
      
      // 生成可访问的URL路径
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.status(200).json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: compressedSize
        }
      });
    } catch (error) {
      console.error('图片处理失败:', error);
      return res.status(500).json({
        success: false,
        message: '图片处理失败'
      });
    }
  });
};

// 多张图片上传处理
exports.uploadMultipleImages = (req, res) => {
  const uploadMultiple = upload.array('images', 5); // 最多5张
  
  uploadMultiple(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multer 错误
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: '文件太大，限制为5MB'
          });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: '超过最大上传数量限制'
          });
        }
        return res.status(400).json({
          success: false,
          message: `上传错误: ${err.message}`
        });
      }
      
      // 其他错误
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }
    
    try {
      // 处理每个图片
      const filesInfo = await Promise.all(req.files.map(async (file) => {
        const filePath = path.join(__dirname, '../../public/uploads', file.filename);
        
        // 压缩图片
        await compressImage(filePath);
        
        // 获取压缩后的文件大小
        const stats = fs.statSync(filePath);
        const compressedSize = stats.size;
        
        return {
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          mimetype: file.mimetype,
          size: compressedSize
        };
      }));
      
      res.status(200).json({
        success: true,
        data: filesInfo
      });
    } catch (error) {
      console.error('图片处理失败:', error);
      return res.status(500).json({
        success: false,
        message: '图片处理失败'
      });
    }
  });
};

// 商品图片上传
exports.uploadProductImage = (req, res) => {
  exports.uploadSingleImage(req, res);
};

// 商品图片集上传
exports.uploadProductGallery = (req, res) => {
  exports.uploadMultipleImages(req, res);
};

// 轮播图上传
exports.uploadBannerImage = (req, res) => {
  exports.uploadSingleImage(req, res);
};

// 内容图片上传
exports.uploadContentImage = (req, res) => {
  exports.uploadSingleImage(req, res);
}; 