const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');
const router = express.Router();

// 创建支付参数
router.post('/create', protect, paymentController.createPayment);

// 确认支付（前端调用）
router.post('/callback', protect, paymentController.confirmPayment);

// 微信支付回调（公开路由，微信服务器会请求）
router.post('/wx-callback', paymentController.paymentCallback);

// 查询支付状态
router.get('/status/:orderId', protect, paymentController.checkPaymentStatus);

module.exports = router; 