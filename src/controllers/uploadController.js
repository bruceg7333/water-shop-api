const fs = require('fs');
const path = require('path');
const multer = require('multer');

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

// 单张图片上传处理
exports.uploadSingleImage = (req, res) => {
  const uploadSingle = upload.single('image');
  
  uploadSingle(req, res, (err) => {
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
    
    // 生成可访问的URL路径
    const filePath = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      data: {
        url: filePath,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  });
};

// 多张图片上传处理
exports.uploadMultipleImages = (req, res) => {
  const uploadMultiple = upload.array('images', 5); // 最多5张
  
  uploadMultiple(req, res, (err) => {
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
    
    // 生成可访问的URL路径
    const filesInfo = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    }));
    
    res.status(200).json({
      success: true,
      data: filesInfo
    });
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