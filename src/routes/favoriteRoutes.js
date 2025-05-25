const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { protect } = require('../middlewares/auth');
const router = express.Router();

// 所有收藏操作都需要登录
router.use(protect);

// 获取收藏列表
router.get('/', favoriteController.getFavorites);

// 添加商品到收藏
router.post('/', favoriteController.addFavorite);

// 检查商品是否已收藏
router.get('/check/:productId', favoriteController.checkFavorite);

// 取消收藏
router.delete('/:productId', favoriteController.removeFavorite);

module.exports = router; 