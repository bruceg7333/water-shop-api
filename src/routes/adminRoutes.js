const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/adminAuth');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const administratorController = require('../controllers/administratorController');
const uploadController = require('../controllers/uploadController');

// 管理员登录路由 - 不需要身份验证
router.post('/auth/login', administratorController.adminLogin);

// 所有其他管理后台路由都需要认证
router.use(protect);

// 获取当前管理员信息
router.get('/auth/profile', administratorController.getCurrentAdmin);

// 修改管理员密码
router.put('/auth/password', administratorController.updateAdminPassword);

// 用户管理路由（C端用户，不包括操作员）
router.get('/users', authorize('user_view'), userController.getAllUsers);
router.get('/users/:id', authorize('user_view'), userController.getUserDetail);
router.delete('/users', authorize('user_delete'), userController.deleteUsers);

// 操作员管理路由（需要admin_manage权限）
router.get('/administrators', authorize('admin_manage'), administratorController.getAllAdministrators);
router.post('/administrators', authorize('admin_manage'), administratorController.createAdministrator);
router.put('/administrators/:id', authorize('admin_manage'), administratorController.updateAdministrator);
router.delete('/administrators/:id', authorize('admin_manage'), administratorController.deleteAdministrator);
router.put('/administrators/:id/password', authorize('admin_manage'), administratorController.resetAdminPassword);

// 商品管理路由
router.get('/products', authorize('product_view'), productController.getProductsForAdmin);
router.get('/products/:id', authorize('product_view'), productController.getProductById);
router.post('/products', authorize('product_create'), productController.createProduct);
router.put('/products/:id', authorize('product_edit'), productController.updateProduct);
router.delete('/products/:id', authorize('product_delete'), productController.deleteProduct);

// 商品批量导入路由
router.get('/products/import/template', authorize('product_create'), productController.downloadImportTemplate);
router.post('/products/import', authorize('product_create'), uploadController.uploadExcelFile, productController.importProducts);

// 订单管理路由
router.get('/orders', authorize('order_view'), orderController.getAllOrders);
router.get("/orders/latest", authorize('order_view'), orderController.getLatestOrders);
router.get('/orders/:id', authorize('order_view'), orderController.getOrder);
router.put('/orders/:id/status', authorize('order_edit'), orderController.updateOrderStatus);
router.put('/orders/:id/deliver', authorize('order_edit'), orderController.updateOrderToDelivered);
router.put('/orders/:id/complete', authorize('order_edit'), orderController.updateOrderToCompleted);
router.put('/orders/:id/pay', authorize('order_edit'), orderController.updateOrderToPaid);
router.put('/orders/:id/cancel', authorize('order_edit'), orderController.cancelOrder);

// 优惠券管理路由
router.get('/coupons', authorize('product_view'), couponController.getCoupons);
router.get('/coupons/check-code', authorize('product_view'), couponController.checkCouponCode);
router.post('/coupons', authorize('product_manage'), couponController.createCoupon);
router.put('/coupons/:id', authorize('product_manage'), couponController.updateCoupon);
router.delete('/coupons/:id', authorize('product_manage'), couponController.deleteCoupon);

// 优惠券分发路由
router.post('/coupons/distribute', authorize('user_manage'), couponController.distributeCoupons);

// 用户优惠券管理路由
router.get('/users/:userId/coupons', authorize('user_view'), couponController.getUserCoupons);

// 统计数据路由
router.get('/products/sales/stats', authorize('statistics_view'), orderController.getProductSalesData);
router.get('/sales/trends', authorize('statistics_view'), orderController.getSalesTrends);
router.get('/statistics/overview', authorize('statistics_view'), orderController.getStatisticsOverview);

module.exports = router;