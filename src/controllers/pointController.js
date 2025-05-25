const PointRecord = require('../models/pointRecord');
const User = require('../models/user');

/**
 * @desc    获取用户积分记录
 * @route   GET /api/points/records
 * @access  Private
 */
const getUserPointRecords = async (req, res) => {
  try {
    // 从请求中获取用户ID
    const userId = req.user.id;
    
    // 查询该用户的所有积分记录，按创建时间降序排列
    const pointRecords = await PointRecord.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber')
      .populate('product', 'name')
      .populate('review');
    
    // 计算用户总积分
    const user = await User.findById(userId);
    
    res.status(200).json({
      success: true,
      data: pointRecords,
      totalPoints: user.points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取积分记录失败',
      error: error.message
    });
  }
};

/**
 * @desc    创建积分记录并更新用户积分
 * @route   POST /api/points/records
 * @access  Private/Admin
 */
const createPointRecord = async (req, res) => {
  try {
    const { userId, points, type, source, title, description, orderId, reviewId, productId } = req.body;
    
    // 创建新的积分记录
    const pointRecord = await PointRecord.create({
      user: userId,
      points,
      type,
      source,
      title,
      description,
      order: orderId || null,
      review: reviewId || null,
      product: productId || null
    });
    
    // 更新用户积分
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 根据类型增加或减少积分
    if (type === 'increase') {
      user.points += points;
    } else if (type === 'decrease') {
      user.points = Math.max(0, user.points - points); // 确保积分不会为负数
    }
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: '积分记录创建成功',
      data: pointRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建积分记录失败',
      error: error.message
    });
  }
};

/**
 * @desc    计算用户总积分
 * @route   GET /api/points/total
 * @access  Private
 */
const getUserTotalPoints = async (req, res) => {
  try {
    // 从请求中获取用户ID
    const userId = req.user.id;
    
    // 查询用户获取总积分
    const user = await User.findById(userId).select('points');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取总积分失败',
      error: error.message
    });
  }
};

/**
 * @desc    根据用户行为自动创建积分记录
 * @param   {Object} options - 积分选项
 * @returns {Promise}
 */
const createPointRecordByAction = async (options) => {
  try {
    const { userId, points, source, title, description, orderId, reviewId, productId } = options;
    
    // 确定积分类型
    const type = points >= 0 ? 'increase' : 'decrease';
    const absPoints = Math.abs(points);
    
    // 创建积分记录
    const pointRecord = await PointRecord.create({
      user: userId,
      points: absPoints,
      type,
      source,
      title,
      description,
      order: orderId || null,
      review: reviewId || null,
      product: productId || null
    });
    
    // 更新用户积分
    const user = await User.findById(userId);
    if (user) {
      if (type === 'increase') {
        user.points += absPoints;
      } else {
        user.points = Math.max(0, user.points - absPoints);
      }
      await user.save();
    }
    
    return pointRecord;
  } catch (error) {
    console.error('自动创建积分记录失败:', error);
    throw error;
  }
};

/**
 * @desc    初始化测试用户的积分数据
 * @route   POST /api/points/init-demo
 * @access  Private/Admin
 */
const initDemoPointRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 清除该用户已有的积分记录
    await PointRecord.deleteMany({ user: userId });
    
    // 重置用户积分为0
    await User.findByIdAndUpdate(userId, { points: 0 });
    
    // 创建购物消费积分记录 - 总计180分
    await createPointRecordByAction({
      userId,
      points: 60,
      source: 'purchase',
      title: '购买矿泉水套餐',
      description: '订单号：WO2023121501'
    });
    
    await createPointRecordByAction({
      userId,
      points: 45,
      source: 'purchase',
      title: '购买纯净水大桶装',
      description: '订单号：WO2023120802'
    });
    
    await createPointRecordByAction({
      userId,
      points: 50,
      source: 'purchase',
      title: '购买矿泉水礼盒',
      description: '订单号：WO2023112504'
    });
    
    await createPointRecordByAction({
      userId,
      points: 25,
      source: 'purchase',
      title: '购买饮水机',
      description: '订单号：WO2023111103'
    });
    
    // 创建评价订单积分记录 - 总计40分
    await createPointRecordByAction({
      userId,
      points: 10,
      source: 'review',
      title: '评价订单',
      description: '订单号：WO2023121501'
    });
    
    await createPointRecordByAction({
      userId,
      points: 10,
      source: 'review',
      title: '评价订单',
      description: '订单号：WO2023120802'
    });
    
    await createPointRecordByAction({
      userId,
      points: 10,
      source: 'review',
      title: '评价订单',
      description: '订单号：WO2023112504'
    });
    
    await createPointRecordByAction({
      userId,
      points: 10,
      source: 'review',
      title: '评价订单',
      description: '订单号：WO2023111103'
    });
    
    // 创建分享商品积分记录 - 总计30分
    await createPointRecordByAction({
      userId,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '高山矿泉水礼盒'
    });
    
    await createPointRecordByAction({
      userId,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '纯净水桶装4件套'
    });
    
    await createPointRecordByAction({
      userId,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '高端饮水机'
    });
    
    await createPointRecordByAction({
      userId,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '婴儿专用矿泉水'
    });
    
    await createPointRecordByAction({
      userId,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '运动型矿泉水6瓶装'
    });
    
    await createPointRecordByAction({
      userId,
      points: 5,
      source: 'share',
      title: '分享商品',
      description: '高端矿泉水礼盒'
    });
    
    // 创建每日签到积分记录 - 总计30分
    await createPointRecordByAction({
      userId,
      points: 3,
      source: 'signin',
      title: '每日签到',
      description: '连续签到1天'
    });
    
    await createPointRecordByAction({
      userId,
      points: 3,
      source: 'signin',
      title: '每日签到',
      description: '连续签到20天'
    });
    
    await createPointRecordByAction({
      userId,
      points: 3,
      source: 'signin',
      title: '每日签到',
      description: '连续签到19天'
    });
    
    await createPointRecordByAction({
      userId,
      points: 3,
      source: 'signin',
      title: '每日签到',
      description: '连续签到18天'
    });
    
    await createPointRecordByAction({
      userId,
      points: 3,
      source: 'signin',
      title: '每日签到',
      description: '连续签到17天'
    });
    
    await createPointRecordByAction({
      userId,
      points: 15,
      source: 'signin',
      title: '每日签到奖励',
      description: '连续签到半月奖励'
    });
    
    // 创建积分兑换消耗积分记录 - 总计-20分
    await createPointRecordByAction({
      userId,
      points: -20,
      source: 'exchange',
      title: '兑换优惠券',
      description: '满100减10优惠券'
    });
    
    // 创建注册奖励和生日特惠等其他积分记录 - 总计100分
    await createPointRecordByAction({
      userId,
      points: 50,
      source: 'register',
      title: '注册奖励',
      description: '新用户注册奖励'
    });
    
    await createPointRecordByAction({
      userId,
      points: 30,
      source: 'birthday',
      title: '生日特惠',
      description: '生日当月特别奖励'
    });
    
    await createPointRecordByAction({
      userId,
      points: 20,
      source: 'invite',
      title: '邀请新用户',
      description: '成功邀请好友注册'
    });
    
    // 获取当前用户的最新积分记录
    const pointRecords = await PointRecord.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber')
      .populate('product', 'name')
      .populate('review');
    
    // 获取用户最新的总积分
    const user = await User.findById(userId);
    
    res.status(200).json({
      success: true,
      message: '演示数据初始化成功',
      data: pointRecords,
      totalPoints: user.points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '初始化演示数据失败',
      error: error.message
    });
  }
};

module.exports = {
  getUserPointRecords,
  createPointRecord,
  getUserTotalPoints,
  createPointRecordByAction,
  initDemoPointRecords
}; 