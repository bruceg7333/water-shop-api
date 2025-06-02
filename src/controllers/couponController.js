const Coupon = require('../models/coupon');
const UserCoupon = require('../models/userCoupon');
const Cart = require('../models/cart');

// 获取所有可用优惠券
exports.getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    
    // 查询有效的优惠券
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gt: now },
      $or: [
        { limit: null },
        { usedCount: { $lt: '$limit' } }
      ]
    });
    
    // 查询用户已领取的优惠券
    const userCoupons = await UserCoupon.find({
      user: req.user.id
    }).select('coupon isUsed');
    
    // 用户已领取的优惠券ID集合
    const userCouponIds = userCoupons.map(uc => uc.coupon.toString());
    
    // 标记用户是否已领取
    const processedCoupons = coupons.map(coupon => {
      const couponObj = coupon.toObject();
      couponObj.claimed = userCouponIds.includes(coupon._id.toString());
      return couponObj;
    });
    
    res.status(200).json({
      success: true,
      data: processedCoupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取优惠券失败',
      error: error.message
    });
  }
};

// 用户领取优惠券
exports.claimCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    
    // 验证优惠券是否存在且有效
    const now = new Date();
    const coupon = await Coupon.findOne({
      _id: couponId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gt: now }
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: '优惠券不存在或已过期'
      });
    }
    
    // 检查优惠券使用限制
    if (coupon.limit !== null && coupon.usedCount >= coupon.limit) {
      return res.status(400).json({
        success: false,
        message: '优惠券已被领完'
      });
    }
    
    // 检查用户是否已领取此优惠券
    const existingUserCoupon = await UserCoupon.findOne({
      user: req.user.id,
      coupon: couponId
    });
    
    if (existingUserCoupon) {
      return res.status(400).json({
        success: false,
        message: '您已领取过此优惠券'
      });
    }
    
    // 创建用户优惠券关联
    const userCoupon = await UserCoupon.create({
      user: req.user.id,
      coupon: couponId
    });
    
    res.status(201).json({
      success: true,
      message: '优惠券领取成功',
      data: userCoupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '领取优惠券失败',
      error: error.message
    });
  }
};

// 获取用户的优惠券
exports.getUserCoupons = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    
    // 验证用户是否存在
    const User = require('../models/user');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 构建查询条件
    const query = { user: userId };
    
    if (status === 'unused') {
      query.isUsed = false;
    } else if (status === 'used') {
      query.isUsed = true;
    }
    
    // 查询总数
    const total = await UserCoupon.countDocuments(query);
    
    // 分页查询
    const userCoupons = await UserCoupon.find(query)
      .populate('coupon')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // 处理优惠券状态
    const now = new Date();
    const processedCoupons = userCoupons.map(userCoupon => {
      const result = userCoupon.toObject();
      const coupon = result.coupon;
      
      if (result.isUsed) {
        result.status = 'used';
      } else if (now > coupon.endDate) {
        result.status = 'expired';
      } else {
        result.status = 'valid';
      }
      
      return result;
    });
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        userCoupons: processedCoupons
      }
    });
  } catch (error) {
    console.error('获取用户优惠券失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户优惠券失败',
      error: error.message
    });
  }
};

// 验证并计算优惠券折扣
exports.verifyCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    // 获取用户购物车金额
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '购物车为空'
      });
    }
    
    // 计算购物车总金额
    const cartTotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    
    // 验证优惠券
    const userCoupon = await UserCoupon.findOne({
      user: req.user.id,
      coupon: couponId,
      isUsed: false
    }).populate('coupon');
    
    if (!userCoupon) {
      return res.status(404).json({
        success: false,
        message: '优惠券不存在或已使用'
      });
    }
    
    const coupon = userCoupon.coupon;
    const now = new Date();
    
    // 检查优惠券是否有效
    if (!coupon.isActive || now < coupon.startDate || now > coupon.endDate) {
      return res.status(400).json({
        success: false,
        message: '优惠券已过期或未激活'
      });
    }
    
    // 检查最低消费要求
    if (cartTotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `订单金额不满足优惠券最低消费要求: ¥${coupon.minPurchase.toFixed(2)}`
      });
    }
    
    // 计算折扣金额
    const discount = coupon.calculateDiscount(cartTotal);
    
    res.status(200).json({
      success: true,
      data: {
        coupon,
        cartTotal,
        discount,
        amountAfterDiscount: cartTotal - discount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '验证优惠券失败',
      error: error.message
    });
  }
};

// 管理员创建优惠券
exports.createCoupon = async (req, res) => {
  try {
    const {
      name,
      code,
      description = '',
      type,
      discountValue,
      minOrderAmount = 0,
      totalCount = null,
      startDate = new Date(),
      endDate,
      isActive = true
    } = req.body;
    
    // 检查必填字段
    if (!name || !code || !type || !discountValue || !endDate) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }
    
    // 检查优惠券代码是否已存在
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: '优惠券代码已存在'
      });
    }
    
    // 转换前端类型到后端类型
    let backendType;
    let frontendType = type;
    
    if (type === 'percentage') {
      backendType = 'percentage';
    } else if (type === 'discount' || type === 'free') {
      backendType = 'fixed';
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的优惠券类型'
      });
    }
    
    // 创建优惠券
    const coupon = await Coupon.create({
      name,
      code,
      type: backendType,
      frontendType: frontendType,
      amount: Number(discountValue),
      minPurchase: Number(minOrderAmount),
      maxDiscount: null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      limit: totalCount ? Number(totalCount) : null,
      description,
      isActive
    });
    
    res.status(201).json({
      success: true,
      message: '优惠券创建成功',
      data: coupon
    });
  } catch (error) {
    console.error('创建优惠券失败:', error);
    res.status(500).json({
      success: false,
      message: '创建优惠券失败',
      error: error.message
    });
  }
};

// 管理员获取所有优惠券
exports.getCoupons = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, type } = req.query;
    console.log('收到获取优惠券请求:', { page, pageSize, keyword, status, type });
    
    // 构建查询条件
    const query = {};
    const conditions = [];
    
    // 关键字搜索
    if (keyword) {
      conditions.push({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { code: { $regex: keyword, $options: 'i' } }
        ]
      });
      console.log('添加关键字搜索条件:', keyword);
    }
    
    // 状态筛选
    if (status) {
      const now = new Date();
      const statusCondition = {};
      
      switch (status) {
        case 'active':
          // 有效：启用状态 + 在有效期内
          statusCondition.isActive = true;
          statusCondition.startDate = { $lte: now };
          statusCondition.endDate = { $gt: now };
          break;
        case 'expired':
          // 过期：超过结束时间
          statusCondition.endDate = { $lte: now };
          break;
        case 'disabled':
          // 已禁用：isActive为false
          statusCondition.isActive = false;
          break;
        case 'used_up':
          // 已用完：有限制且使用数量达到限制
          statusCondition.limit = { $ne: null, $gt: 0 };
          statusCondition.$expr = { $gte: ['$usedCount', '$limit'] };
          break;
      }
      
      conditions.push(statusCondition);
      console.log('添加状态筛选条件:', status, statusCondition);
    }
    
    // 类型筛选
    if (type) {
      console.log('收到类型筛选参数:', type);
      const typeCondition = {};
      
      if (type === 'percentage') {
        typeCondition.frontendType = 'percentage';
      } else if (type === 'discount') {
        typeCondition.frontendType = 'discount';
      } else if (type === 'free') {
        typeCondition.frontendType = 'free';
      }
      
      conditions.push(typeCondition);
      console.log('添加类型筛选条件:', typeCondition);
    }
    
    // 组合所有查询条件
    if (conditions.length > 0) {
      query.$and = conditions;
    }
    
    console.log('最终MongoDB查询条件:', JSON.stringify(query, null, 2));
    
    // 查询总数
    const total = await Coupon.countDocuments(query);
    console.log('数据库中优惠券总数:', total);
    
    // 分页查询
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    console.log('查询到的优惠券数量:', coupons.length);
    
    // 转换为前端期望的格式
    const formattedCoupons = coupons.map(coupon => {
      const couponObj = coupon.toObject();
      
      // 转换字段名，优先使用frontendType
      return {
        _id: couponObj._id,
        name: couponObj.name,
        code: couponObj.code,
        description: couponObj.description,
        type: couponObj.frontendType || (couponObj.type === 'percentage' ? 'percentage' : 'discount'),
        discountValue: couponObj.amount,
        minOrderAmount: couponObj.minPurchase,
        totalCount: couponObj.limit,
        usedCount: couponObj.usedCount,
        startDate: couponObj.startDate,
        endDate: couponObj.endDate,
        isActive: couponObj.isActive,
        createdAt: couponObj.createdAt,
        updatedAt: couponObj.updatedAt
      };
    });
    
    console.log('格式化后的优惠券数据条数:', formattedCoupons.length);
    
    const responseData = {
      success: true,
      data: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        coupons: formattedCoupons
      }
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('获取优惠券列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取优惠券列表失败',
      error: error.message
    });
  }
};

// 管理员更新优惠券
exports.updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const {
      name,
      code,
      description,
      type,
      discountValue,
      minOrderAmount,
      totalCount,
      startDate,
      endDate,
      isActive
    } = req.body;
    
    const coupon = await Coupon.findById(couponId);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: '优惠券不存在'
      });
    }
    
    // 如果要修改code，检查是否与其他优惠券冲突
    if (code && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: code,
        _id: { $ne: couponId }
      });
      
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: '优惠券代码已被使用'
        });
      }
    }
    
    // 准备更新数据，映射前端字段到后端字段
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // 处理日期字段，确保正确解析ISO格式的日期字符串
    if (startDate !== undefined) {
      updateData.startDate = new Date(startDate);
    }
    if (endDate !== undefined) {
      updateData.endDate = new Date(endDate);
    }
    
    // 处理类型转换
    if (type !== undefined) {
      updateData.frontendType = type;
      if (type === 'percentage') {
        updateData.type = 'percentage';
      } else if (type === 'discount' || type === 'free') {
        updateData.type = 'fixed';
      }
    }
    
    // 处理数值字段
    if (discountValue !== undefined) updateData.amount = Number(discountValue);
    if (minOrderAmount !== undefined) updateData.minPurchase = Number(minOrderAmount);
    if (totalCount !== undefined) updateData.limit = totalCount ? Number(totalCount) : null;
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: '优惠券更新成功',
      data: updatedCoupon
    });
  } catch (error) {
    console.error('更新优惠券失败:', error);
    res.status(500).json({
      success: false,
      message: '更新优惠券失败',
      error: error.message
    });
  }
};

// 管理员删除优惠券
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: '优惠券不存在'
      });
    }
    
    await Coupon.findByIdAndDelete(req.params.id);
    
    // 同时删除关联的用户优惠券记录
    await UserCoupon.deleteMany({ coupon: req.params.id });
    
    res.status(200).json({
      success: true,
      message: '优惠券已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除优惠券失败',
      error: error.message
    });
  }
};

// 管理员分发优惠券
exports.distributeCoupons = async (req, res) => {
  try {
    const { type, coupons, userId, userIds, batchType, filters } = req.body;
    
    // 验证请求数据
    if (!type || !coupons || coupons.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择分发类型和优惠券'
      });
    }

    // 获取目标用户
    let targetUsers = [];
    
    if (type === 'single') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '请选择目标用户'
        });
      }
      
      const User = require('../models/user');
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      targetUsers = [user];
    } else if (type === 'batch') {
      if (!userIds || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择目标用户'
        });
      }
      
      const User = require('../models/user');
      targetUsers = await User.find({ _id: { $in: userIds } });
      
      if (targetUsers.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message: '部分用户不存在'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的分发类型'
      });
    }

    // 验证优惠券并检查库存
    const couponIds = coupons.map(c => c.couponId);
    const availableCoupons = await Coupon.find({ 
      _id: { $in: couponIds },
      isActive: true
    });
    
    if (availableCoupons.length !== couponIds.length) {
      return res.status(400).json({
        success: false,
        message: '部分优惠券不存在或已停用'
      });
    }

    // 检查优惠券库存
    for (const couponRequest of coupons) {
      const coupon = availableCoupons.find(c => c._id.toString() === couponRequest.couponId);
      if (!coupon) continue;
      
      const totalNeedCount = couponRequest.count * targetUsers.length;
      const remainingCount = coupon.limit ? (coupon.limit - coupon.usedCount) : Number.MAX_SAFE_INTEGER;
      
      if (totalNeedCount > remainingCount) {
        return res.status(400).json({
          success: false,
          message: `优惠券 "${coupon.name}" 库存不足，需要 ${totalNeedCount} 张，剩余 ${remainingCount} 张`
        });
      }
    }

    // 执行分发
    const distributionResults = [];
    const couponUsageUpdates = {}; // 记录每个优惠券的使用量增加
    
    for (const user of targetUsers) {
      for (const couponRequest of coupons) {
        const coupon = availableCoupons.find(c => c._id.toString() === couponRequest.couponId);
        
        // 为每个用户分发指定数量的优惠券
        for (let i = 0; i < couponRequest.count; i++) {
          try {
            // 检查用户是否已拥有此优惠券
            const existingUserCoupon = await UserCoupon.findOne({
              user: user._id,
              coupon: coupon._id
            });
            
            if (!existingUserCoupon) {
              // 创建用户优惠券关联
              const userCoupon = await UserCoupon.create({
                user: user._id,
                coupon: coupon._id
              });

              // 记录成功分发，累计优惠券使用数量
              if (!couponUsageUpdates[coupon._id.toString()]) {
                couponUsageUpdates[coupon._id.toString()] = 0;
              }
              couponUsageUpdates[coupon._id.toString()]++;
              
              distributionResults.push({
                userId: user._id,
                username: user.username,
                couponId: coupon._id,
                couponName: coupon.name,
                status: 'success'
              });
            } else {
              distributionResults.push({
                userId: user._id,
                username: user.username,
                couponId: coupon._id,
                couponName: coupon.name,
                status: 'skipped',
                message: '用户已拥有此优惠券'
              });
            }
          } catch (error) {
            console.error('分发优惠券失败:', error);
            distributionResults.push({
              userId: user._id,
              username: user.username,
              couponId: coupon._id,
              couponName: coupon.name,
              status: 'failed',
              message: error.message
            });
          }
        }
      }
    }

    // 批量更新优惠券的使用数量
    for (const [couponId, usageIncrease] of Object.entries(couponUsageUpdates)) {
      try {
        await Coupon.findByIdAndUpdate(
          couponId,
          { $inc: { usedCount: usageIncrease } },
          { new: true }
        );
        console.log(`更新优惠券 ${couponId} 使用数量，增加 ${usageIncrease} 张`);
      } catch (error) {
        console.error(`更新优惠券 ${couponId} 使用数量失败:`, error);
      }
    }

    // 统计分发结果
    const successCount = distributionResults.filter(r => r.status === 'success').length;
    const skippedCount = distributionResults.filter(r => r.status === 'skipped').length;
    const failedCount = distributionResults.filter(r => r.status === 'failed').length;

    res.status(200).json({
      success: true,
      message: `分发完成：成功 ${successCount} 张，跳过 ${skippedCount} 张，失败 ${failedCount} 张`,
      data: {
        total: distributionResults.length,
        success: successCount,
        skipped: skippedCount,
        failed: failedCount,
        details: distributionResults
      }
    });
  } catch (error) {
    console.error('分发优惠券失败:', error);
    res.status(500).json({
      success: false,
      message: '分发优惠券失败',
      error: error.message
    });
  }
}; 