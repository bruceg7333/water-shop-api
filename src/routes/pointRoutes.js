const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  getUserPointRecords,
  createPointRecord,
  getUserTotalPoints,
  initDemoPointRecords
} = require('../controllers/pointController');

// 获取当前用户的积分记录
router.get('/records', protect, getUserPointRecords);

// 获取当前用户的总积分
router.get('/total', protect, getUserTotalPoints);

// 管理员创建积分记录
router.post('/records', protect, restrictTo('admin'), createPointRecord);

// 初始化演示数据（仅用于测试）
router.post('/init-demo', protect, initDemoPointRecords);

module.exports = router; 