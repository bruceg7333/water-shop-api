const User = require('../src/models/user');
const PointRecord = require('../src/models/pointRecord');
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

async function createPointRecord(options) {
  const { userId, points, source, title, description, orderId, reviewId, productId } = options;
  
  // 确定积分类型
  const type = points >= 0 ? 'increase' : 'decrease';
  const absPoints = Math.abs(points);
  
  // 创建积分记录
  return await PointRecord.create({
    user: userId,
    points: absPoints,
    type,
    source,
    title,
    description,
    order: orderId || null,
    review: reviewId || null,
    product: productId || null,
    createdAt: options.createdAt || new Date()
  });
}

async function main() {
  try {
    await connectDB();
    
    // 获取微信用户 - 这里查找带有openid的用户
    const user = await User.findOne({ openid: { $exists: true } });
    
    if (!user) {
      console.error('未找到微信用户');
      return;
    }
    
    console.log(`找到微信用户: ${user.username}, ID: ${user._id}`);
    
    // 清除现有积分记录
    await PointRecord.deleteMany({ user: user._id });
    
    // 重置用户积分为0
    user.points = 0;
    await user.save();
    
    console.log('已清除现有积分记录并重置积分为0');
    
    // 创建积分记录 - 按时间顺序
    
    // 1. 注册奖励 (50分)
    await createPointRecord({
      userId: user._id,
      points: 50,
      source: 'register',
      title: '注册奖励',
      description: '新用户注册奖励',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 一个月前
    });
    
    // 2. 购买商品 (46分)
    await createPointRecord({
      userId: user._id,
      points: 25,
      source: 'purchase',
      title: '购买纯净水',
      description: '订单号：WO2023112001',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    });
    
    await createPointRecord({
      userId: user._id,
      points: 21,
      source: 'purchase',
      title: '购买矿泉水套装',
      description: '订单号：WO2023121501',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    });
    
    // 3. 评价订单 (20分)
    await createPointRecord({
      userId: user._id,
      points: 10,
      source: 'review',
      title: '评价订单',
      description: '订单号：WO2023112001',
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000)
    });
    
    await createPointRecord({
      userId: user._id,
      points: 10,
      source: 'review',
      title: '评价订单',
      description: '订单号：WO2023121501',
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
    });
    
    // 4. 分享商品 (15分)
    await createPointRecord({
      userId: user._id,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '高山矿泉水礼盒',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    });
    
    await createPointRecord({
      userId: user._id,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '纯净水桶装4件套',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });
    
    await createPointRecord({
      userId: user._id,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '婴儿专用矿泉水',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    
    // 5. 每日签到 (9分)
    for (let i = 3; i > 0; i--) {
      await createPointRecord({
        userId: user._id,
        points: 3,
        source: 'signin',
        title: '每日签到',
        description: `连续签到${i}天`,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      });
    }
    
    // 6. 兑换优惠券 (-20分)
    await createPointRecord({
      userId: user._id,
      points: -20,
      source: 'exchange',
      title: '兑换优惠券',
      description: '满100减10优惠券',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    
    // 计算并更新用户总积分
    const records = await PointRecord.find({ user: user._id });
    let totalPoints = 0;
    
    for (const record of records) {
      if (record.type === 'increase') {
        totalPoints += record.points;
      } else {
        totalPoints -= record.points;
      }
    }
    
    user.points = totalPoints;
    await user.save();
    
    console.log(`已创建各类积分记录，微信用户 ${user.username} 当前总积分: ${totalPoints}`);
    console.log('积分明细:');
    console.log('- 注册奖励: 50分');
    console.log('- 购物消费: 46分');
    console.log('- 评价订单: 20分');
    console.log('- 分享商品: 15分');
    console.log('- 每日签到: 9分');
    console.log('- 兑换优惠券: -20分');
    
    // 断开数据库连接
    mongoose.disconnect();
  } catch (err) {
    console.error('操作失败:', err);
    mongoose.disconnect();
  }
}

main(); 