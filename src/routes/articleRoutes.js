const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { protect, authorize } = require('../middlewares/adminAuth');

// 公开API
router.get('/', articleController.getArticles);
router.get('/hot', articleController.getHotArticles);
router.get('/:id', articleController.getArticleById);
router.post('/:id/share', articleController.incrementShareCount);

// 管理员API（需要权限验证）
router.get('/admin/contents', protect, authorize('content_read'), articleController.getContentsForAdmin);
router.get('/admin/contents/:id', protect, authorize('content_read'), articleController.getContentByIdForAdmin);
router.post('/admin/contents', protect, authorize('content_create'), articleController.createContent);
router.put('/admin/contents/:id', protect, authorize('content_update'), articleController.updateArticle);
router.delete('/admin/contents/:id', protect, authorize('content_delete'), articleController.deleteArticle);

module.exports = router; 