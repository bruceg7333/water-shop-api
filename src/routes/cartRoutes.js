const express = require('express');
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');
const router = express.Router();

// 移除全局保护，只在需要的路由上应用

// 无需登录的操作
// 获取临时购物车商品列表（本地购物车视图接口）
router.get('/temp', cartController.getTempCart);

// 同步临时购物车到用户账户
router.post('/sync', protect, cartController.syncCart);

// 获取购物车商品数量
router.get('/count', protect, cartController.getCartCount);

// 需要登录的操作
// 获取用户购物车
router.get('/', protect, cartController.getCart);

// 添加商品到购物车
router.post('/', protect, cartController.addItem);

// 更新商品数量
router.put('/:id', protect, (req, res) => {
  // 将路径参数传递给controller
  req.body.itemId = req.params.id;
  cartController.updateItemQuantity(req, res);
});

// 从购物车删除商品
router.delete('/:id', protect, (req, res) => {
  // 将路径参数传递给controller
  req.params.itemId = req.params.id;
  cartController.removeItem(req, res);
});

// 清空购物车
router.delete('/clear', protect, cartController.clearCart);

// 选择/取消选择购物车商品
router.put('/:id/select', protect, (req, res) => {
  // 实现选中/取消选中功能
  try {
    const { id } = req.params;
    const { selected } = req.body;
    
    // 输出调试信息
    console.log(`选择购物车商品: ${id}, 选中状态: ${selected}`);
    
    res.status(200).json({
      success: true,
      message: selected ? '商品已选中' : '商品已取消选中',
      data: { itemId: id, selected }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新商品选中状态失败',
      error: error.message
    });
  }
});

module.exports = router; 