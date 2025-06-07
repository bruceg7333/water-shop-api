const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

// 需要身份验证的路由
router.post('/', protect, orderController.createOrder);
router.get('/me', protect, orderController.getMyOrders);
router.get('/statistics', protect, orderController.getUserOrderStatistics);
router.get('/status/:status', protect, orderController.getOrdersByStatus);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/pay', protect, orderController.updateOrderToPaid);
router.put('/:id/confirm', protect, orderController.confirmReceipt);
router.put('/:id/cancel', protect, orderController.cancelOrder);
router.post('/:id/buy-again', protect, orderController.buyAgain);
router.delete('/:id', protect, orderController.deleteOrder);

// 管理员路由
router.get('/', protect, authorize('admin'), orderController.getAllOrders);
router.put('/:id/deliver', protect, authorize('admin'), orderController.updateOrderToDelivered);
router.put('/:id/complete', protect, authorize('admin'), orderController.updateOrderToCompleted);

module.exports = router; 