const express = require('express');
const couponController = require('../controllers/couponController');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

// 需要登录的路由
router.use(protect);

// 获取所有可用优惠券
router.get('/available', couponController.getAvailableCoupons);

// 领取优惠券
router.post('/claim', couponController.claimCoupon);

// 获取用户的优惠券
router.get('/me', couponController.getUserCoupons);

// 验证优惠券
router.get('/verify/:couponId', couponController.verifyCoupon);

// 管理员路由
router.post('/', authorize('admin'), couponController.createCoupon);

module.exports = router; 