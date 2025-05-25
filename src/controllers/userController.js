const User = require('../models/user');
const { generateToken } = require('../utils/jwt');
// 引入axios用于发送HTTP请求到微信API
const axios = require('axios');
// 引入配置文件
const config = require('../config/config');
const mongoose = require('mongoose');

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, password, phone } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
    }
    
    // 创建新用户
    const user = await User.create({
      username,
      password,
      phone,
      lastLogin: Date.now()
    });
    
    // 生成JWT令牌
    const token = generateToken({ id: user._id });
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          nickName: user.nickName,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查用户名和密码是否提供
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      });
    }
    
    // 查找用户并选择包含密码字段
    const user = await User.findOne({ username }).select('+password');
    
    // 检查用户是否存在
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码是否匹配
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save();
    
    // 生成JWT令牌
    const token = generateToken({ id: user._id });
    
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          nickName: user.nickName,
          role: user.role,
          gender: user.gender,
          points: user.points
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

// 获取当前用户资料
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          nickName: user.nickName,
          gender: user.gender,
          points: user.points,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户资料失败',
      error: error.message
    });
  }
};

// 更新用户资料
exports.updateProfile = async (req, res) => {
  try {
    const { nickName, avatar, gender, phone } = req.body;
    
    // 查找并更新用户
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { nickName, avatar, gender, phone },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '个人资料更新成功',
      data: {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          nickName: updatedUser.nickName,
          gender: updatedUser.gender,
          points: updatedUser.points
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新个人资料失败',
      error: error.message
    });
  }
};

// 修改密码
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 获取用户信息（包含密码）
    const user = await User.findById(req.user.id).select('+password');
    
    // 验证当前密码
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '当前密码不正确'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    });
  }
};

// 管理员获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      gender = '', 
      isActive = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      fields = '',
      createdAtStart = '',
      createdAtEnd = '',
      lastLoginStart = '',
      lastLoginEnd = '',
      memberLevel = '',
      consumptionRange = ''
    } = req.query;
    
    // 构建查询条件 - 只查询普通用户，排除管理员
    const query = {
      role: { $ne: 'admin' } // 排除所有admin角色的用户
    };
    
    // 模糊搜索（用户名、昵称、手机号）
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { nickName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 性别筛选
    if (gender && gender !== '') {
      query.gender = gender;
    }
    
    // 激活状态筛选
    if (isActive && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    // 注册时间范围筛选
    if (createdAtStart || createdAtEnd) {
      query.createdAt = {};
      if (createdAtStart) {
        query.createdAt.$gte = new Date(createdAtStart);
      }
      if (createdAtEnd) {
        // 将结束日期设置为当天的23:59:59
        const endDate = new Date(createdAtEnd);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    // 最后登录时间范围筛选
    if (lastLoginStart || lastLoginEnd) {
      query.lastLogin = {};
      if (lastLoginStart) {
        query.lastLogin.$gte = new Date(lastLoginStart);
      }
      if (lastLoginEnd) {
        // 将结束日期设置为当天的23:59:59
        const endDate = new Date(lastLoginEnd);
        endDate.setHours(23, 59, 59, 999);
        query.lastLogin.$lte = endDate;
      }
    }
    
    // 构建排序条件
    const sortCondition = {};
    sortCondition[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // 查询总数（在应用会员等级和消费金额筛选之前）
    let total;
    
    // 使用聚合查询获取用户及其总消费金额
    const Order = require('../models/order');
    
    const pipeline = [
      // 匹配基础查询条件
      { $match: query },
      // 查找用户的所有已支付订单
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders',
          pipeline: [
            {
              $match: {
                isPaid: true, // 只计算已支付的订单
                status: { $ne: 'canceled' } // 排除已取消的订单
              }
            }
          ]
        }
      },
      // 计算总消费金额
      {
        $addFields: {
          totalConsumption: {
            $reduce: {
              input: '$orders',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.totalPrice'] }
            }
          }
        }
      },
      // 根据积分计算会员等级
      {
        $addFields: {
          calculatedMemberLevel: {
            $switch: {
              branches: [
                { case: { $lt: ['$points', 100] }, then: '普通会员' },
                { case: { $lt: ['$points', 500] }, then: '铜牌会员' },
                { case: { $lt: ['$points', 1000] }, then: '银牌会员' },
                { case: { $lt: ['$points', 2000] }, then: '金牌会员' },
                { case: { $lt: ['$points', 5000] }, then: '白金会员' }
              ],
              default: '钻石会员'
            }
          }
        }
      }
    ];
    
    // 会员等级筛选
    if (memberLevel && memberLevel !== '') {
      pipeline.push({
        $match: {
          calculatedMemberLevel: memberLevel
        }
      });
    }
    
    // 消费金额区间筛选
    if (consumptionRange && consumptionRange !== '') {
      try {
        // 解析消费金额区间，例如 "100-500" 或 "1000+"
        let minAmount = 0;
        let maxAmount = null;
        
        if (consumptionRange.includes('-')) {
          const [min, max] = consumptionRange.split('-').map(num => parseFloat(num.trim()));
          minAmount = min || 0;
          maxAmount = max || null;
        } else if (consumptionRange.includes('+')) {
          minAmount = parseFloat(consumptionRange.replace('+', '').trim()) || 0;
          maxAmount = null;
        } else {
          // 单个数值，当作最小值
          minAmount = parseFloat(consumptionRange) || 0;
        }
        
        const consumptionMatch = {};
        if (minAmount > 0) {
          consumptionMatch.totalConsumption = { $gte: minAmount };
        }
        if (maxAmount !== null) {
          consumptionMatch.totalConsumption = consumptionMatch.totalConsumption || {};
          consumptionMatch.totalConsumption.$lte = maxAmount;
        }
        
        if (Object.keys(consumptionMatch).length > 0) {
          pipeline.push({ $match: consumptionMatch });
        }
      } catch (error) {
        console.error('解析消费金额区间失败:', error);
      }
    }
    
    // 先计算总数（在排序和分页之前）
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    total = countResult.length > 0 ? countResult[0].total : 0;
    
    // 添加排序、分页和字段过滤
    pipeline.push(
      // 移除订单数据（减少返回数据量）
      {
        $project: {
          password: 0,
          orders: 0
        }
      },
      // 排序
      { $sort: sortCondition },
      // 分页
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );
    
    const users = await User.aggregate(pipeline);
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        users
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
};

// 微信一键登录
exports.wechatLogin = async (req, res) => {
  try {
    const { code, userInfo, password } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少微信登录凭证code'
      });
    }
    
    // 调用微信API获取openid
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    // 检查微信API响应
    if (wxResponse.data.errcode) {
      return res.status(400).json({
        success: false,
        message: `微信登录失败: ${wxResponse.data.errmsg}`
      });
    }
    
    const { openid, session_key } = wxResponse.data;
    
    // 根据openid查找用户
    let user = await User.findOne({ openid });
    
    // 如果用户不存在，自动为其创建账号（一键注册）
    if (!user) {
      // 创建随机用户名
      const username = `wx_user_${Math.floor(Math.random() * 1000000)}`;
      
      // 创建默认密码（如果前端没有提供）
      const defaultPassword = password || `wx_pwd_${Math.floor(Math.random() * 1000000)}`;
      
      // 创建新用户
      user = await User.create({
        username,
        password: defaultPassword, // 设置密码
        openid, // 保存微信openid
        nickName: userInfo ? userInfo.nickName : username,
        avatar: userInfo ? userInfo.avatarUrl : '',
        gender: userInfo ? userInfo.gender : '未知',
        lastLogin: Date.now()
      });
      
      console.log('用户不存在，已自动创建新用户:', username);
    } else {
      // 用户存在，更新用户信息
      if (userInfo) {
        user.nickName = userInfo.nickName || user.nickName;
        user.avatar = userInfo.avatarUrl || user.avatar;
        user.gender = userInfo.gender !== undefined ? userInfo.gender : user.gender;
        user.lastLogin = Date.now();
        await user.save();
      }
    }
    
    // 生成JWT令牌
    const token = generateToken({ id: user._id });
    
    res.status(200).json({
      success: true,
      message: user.lastLogin ? '微信登录成功' : '微信注册并登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          nickName: user.nickName,
          gender: user.gender,
          points: user.points,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({
      success: false,
      message: '微信登录失败',
      error: error.message
    });
  }
};

// 微信一键注册
exports.wechatRegister = async (req, res) => {
  try {
    const { code, userInfo, phone, password } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少微信登录凭证code'
      });
    }
    
    // 调用微信API获取openid
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    // 检查微信API响应
    if (wxResponse.data.errcode) {
      return res.status(400).json({
        success: false,
        message: `微信注册失败: ${wxResponse.data.errmsg}`
      });
    }
    
    const { openid, session_key } = wxResponse.data;
    
    // 检查是否已存在该openid的用户
    let user = await User.findOne({ openid });
    
    if (user) {
      // 用户已存在，直接返回登录信息
      // 更新用户信息
      if (userInfo) {
        user.nickName = userInfo.nickName || user.nickName;
        user.avatar = userInfo.avatarUrl || user.avatar;
        user.gender = userInfo.gender !== undefined ? userInfo.gender : user.gender;
        if (phone) {
          user.phone = phone;
        }
        user.lastLogin = Date.now();
        await user.save();
      }
      
      // 生成JWT令牌
      const token = generateToken({ id: user._id });
      
      return res.status(200).json({
        success: true,
        message: '该微信账号已注册，已为您登录',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            phone: user.phone,
            avatar: user.avatar,
            nickName: user.nickName,
            gender: user.gender,
            points: user.points,
            role: user.role
          }
        }
      });
    }
    
    // 创建随机用户名
    const username = `wx_user_${Math.floor(Math.random() * 1000000)}`;
    
    // 创建默认密码（如果前端没有提供）
    const defaultPassword = password || `wx_pwd_${Math.floor(Math.random() * 1000000)}`;
    
    // 创建新用户
    user = await User.create({
      username,
      password: defaultPassword, // 设置密码
      openid, // 保存微信openid
      nickName: userInfo ? userInfo.nickName : username,
      avatar: userInfo ? userInfo.avatarUrl : '',
      gender: userInfo ? userInfo.gender : '未知',
      phone: phone || '',
      lastLogin: Date.now()
    });
    
    // 生成JWT令牌
    const token = generateToken({ id: user._id });
    
    res.status(201).json({
      success: true,
      message: '微信注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          nickName: user.nickName,
          gender: user.gender,
          points: user.points,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('微信注册错误:', error);
    res.status(500).json({
      success: false,
      message: '微信注册失败',
      error: error.message
    });
  }
};

// 获取用户详情（包含订单信息等）
exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 获取用户基本信息
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取用户的订单信息
    const Order = require('../models/order');
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name imageUrl')
      .limit(50); // 限制最多返回50个订单
    
    // 计算用户总消费金额
    const totalConsumption = await Order.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId), 
          isPaid: true,
          status: { $ne: 'canceled' } // 排除已取消的订单
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    const totalAmount = totalConsumption.length > 0 ? totalConsumption[0].total : 0;
    
    // 获取用户的优惠券信息（如果有优惠券模型）
    let userCoupons = [];
    try {
      const UserCoupon = require('../models/userCoupon');
      userCoupons = await UserCoupon.find({ user: userId })
        .populate('coupon')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.log('优惠券模型不存在或查询失败:', error.message);
    }
    
    // 计算会员等级（基于消费金额）
    let memberLevel = '普通会员';
    if (totalAmount >= 10000) {
      memberLevel = '钻石会员';
    } else if (totalAmount >= 5000) {
      memberLevel = '黄金会员';
    } else if (totalAmount >= 1000) {
      memberLevel = '银牌会员';
    }
    
    const userDetail = {
      ...user.toObject(),
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        totalPrice: order.totalPrice,
        status: order.status,
        isPaid: order.isPaid,
        isDelivered: order.isDelivered,
        createdAt: order.createdAt,
        orderItems: order.orderItems
      })),
      totalConsumption: totalAmount,
      memberLevel,
      userCoupons: userCoupons.map(uc => ({
        id: uc._id,
        coupon: uc.coupon,
        usedAt: uc.usedAt,
        isUsed: uc.isUsed,
        createdAt: uc.createdAt
      }))
    };
    
    res.status(200).json({
      success: true,
      data: userDetail
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
};

// 批量删除用户
exports.deleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的用户ID列表'
      });
    }
    
    // 检查是否包含管理员账户
    const adminUsers = await User.find({ 
      _id: { $in: userIds }, 
      role: 'admin' 
    });
    
    if (adminUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '不能删除管理员账户'
      });
    }
    
    // 删除用户
    const result = await User.deleteMany({ 
      _id: { $in: userIds },
      role: { $ne: 'admin' } // 额外保护，确保不删除管理员
    });
    
    res.status(200).json({
      success: true,
      message: `成功删除 ${result.deletedCount} 个用户`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('批量删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除用户失败',
      error: error.message
    });
  }
}; 