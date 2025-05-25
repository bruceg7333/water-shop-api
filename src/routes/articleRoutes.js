const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { protect, authorize } = require('../middlewares/auth');

// 公开API
router.get('/', articleController.getArticles);
router.get('/hot', articleController.getHotArticles);
router.get('/:id', articleController.getArticleById);
router.post('/:id/share', articleController.incrementShareCount);

// 管理员API（需要权限验证）
router.use(protect);
router.use(authorize('admin'));

router.post('/', articleController.createArticle);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);

module.exports = router; 