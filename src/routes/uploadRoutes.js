const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const uploadController = require('../controllers/uploadController');

// 商品图片上传路由 - 需要管理员权限
router.post('/product', protect, authorize('admin'), uploadController.uploadProductImage);

// 商品图片集上传路由 - 需要管理员权限
router.post('/product-gallery', protect, authorize('admin'), uploadController.uploadProductGallery);

// 无需权限的公共上传测试路由（仅用于测试）
router.post('/test', uploadController.uploadSingleImage);

module.exports = router; 