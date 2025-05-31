const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/adminAuth');
const uploadController = require('../controllers/uploadController');

// 商品图片上传路由 - 需要管理员权限
router.post('/product', protect, authorize('product_create'), uploadController.uploadProductImage);

// 商品图片集上传路由 - 需要管理员权限
router.post('/product-gallery', protect, authorize('product_create'), uploadController.uploadProductGallery);

// 轮播图上传路由 - 需要管理员权限
router.post('/banner', protect, authorize('banner_create'), uploadController.uploadBannerImage);

// 轮播图上传路由 - 需要管理员权限
router.post('/banner', protect, authorize('banner_create'), uploadController.uploadBannerImage);

// 内容图片上传路由 - 需要管理员权限
router.post('/content', protect, authorize('content_create'), uploadController.uploadContentImage);

// 无需权限的公共上传测试路由（仅用于测试）
router.post('/test', uploadController.uploadSingleImage);

module.exports = router; 