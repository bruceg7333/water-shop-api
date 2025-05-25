const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

// 获取热销商品（销量前3）
router.get('/hot', productController.getHotProducts);

// 搜索商品
router.get('/search', productController.searchProducts);

// 获取商品列表
router.get('/', productController.getProducts);

// 获取单个商品详情
router.get('/:id', productController.getProductById);

// 创建商品
router.post('/', productController.createProduct);

// 创建测试商品数据
router.post('/test-data', productController.createTestProducts);

module.exports = router; 
router.post('/test-data', productController.createTestProducts);

module.exports = router; 