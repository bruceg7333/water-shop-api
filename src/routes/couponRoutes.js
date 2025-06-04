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

// 兑换优惠券
router.post('/exchange', couponController.exchangeCoupon);

// 验证优惠券
router.get('/verify/:couponId', couponController.verifyCoupon);

// 检查优惠券代码是否重复
router.get('/check-code', authorize('admin'), couponController.checkCouponCode);

// 管理员路由
router.post('/', authorize('admin'), couponController.createCoupon);

module.exports = router;