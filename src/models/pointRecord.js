const mongoose = require('mongoose');

/**
 * 积分记录模型
 * 记录用户积分变动情况
 */
const pointRecordSchema = new mongoose.Schema({
  // 关联用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 积分变动值
  points: {
    type: Number,
    required: true
  },
  // 积分变动类型: increase(增加), decrease(减少)
  type: {
    type: String,
    enum: ['increase', 'decrease'],
    required: true
  },
  // 积分来源
  source: {
    type: String,
    enum: ['purchase', 'review', 'share', 'signin', 'exchange', 'register', 'invite', 'birthday', 'other'],
    required: true
  },
  // 标题
  title: {
    type: String,
    required: true
  },
  // 详细描述
  description: {
    type: String
  },
  // 关联订单ID (可选)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  // 关联评价ID (可选)
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  // 关联商品ID (可选，用于分享商品)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PointRecord = mongoose.model('PointRecord', pointRecordSchema);

module.exports = PointRecord; 