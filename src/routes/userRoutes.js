const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

// 公开路由
router.post('/register', userController.register);
router.post('/login', userController.login);
// 添加微信登录和注册路由
router.post('/wechat-login', userController.wechatLogin);
router.post('/wechat-register', userController.wechatRegister);

// 需要身份验证的路由
router.get('/me', protect, userController.getCurrentUser);
router.put('/me', protect, userController.updateProfile);
router.put('/password', protect, userController.updatePassword);

// 仅管理员可访问的路由
router.get('/', protect, authorize('admin'), userController.getAllUsers);

module.exports = router; 