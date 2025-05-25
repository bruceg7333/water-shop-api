const Order = require('../models/order');
const Product = require('../models/product');
const Cart = require('../models/cart');
const User = require('../models/user');
const mongoose = require('mongoose');

// 创建新订单
exports.createOrder = async (req, res) => {
  try {
    const { 
      orderItems, 
      shippingAddress, 
      paymentMethod, 
      itemsPrice, 
      shippingPrice, 
      totalPrice,
      remark,
      isTestData  // 新增，用于标识是否为测试数据
    } = req.body;

    // 验证订单项是否存在
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '订单中没有商品'
      });
    }

    // 准备处理后的订单项
    const processedOrderItems = [];
    
    // 处理订单项
    for (const item of orderItems) {
      // 检查是使用product还是productId字段
      const productId = item.product || item.productId;
      
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: '订单项缺少商品ID'
        });
      }
      
      let product;
      
      // 如果是测试数据或数字ID，使用模拟数据
      if (isTestData || typeof productId === 'number' || !mongoose.Types.ObjectId.isValid(productId)) {
        // 创建一个模拟商品对象
        product = {
          _id: new mongoose.Types.ObjectId(), // 生成一个新的ObjectId
          name: item.name,
          price: item.price,
          // 其他必要字段
        };
      } else {
        // 正常情况：查询数据库中的商品
        product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `商品ID ${productId} 不存在`
          });
        }
      }
      
      // 构建处理后的订单项
      processedOrderItems.push({
        product: isTestData ? product._id : productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        spec: item.spec || ''
      });
    }

    // 创建新订单
    const order = new Order({
      user: req.user.id,
      orderItems: processedOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      remark
    });

    // 保存订单
    const createdOrder = await order.save();

    // 如果订单创建成功，可以清空购物车
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [] } }
    );

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        orderId: createdOrder._id
      }
    });
  } catch (error) {
    console.error('订单创建失败:', error);
    res.status(500).json({
      success: false,
      message: '订单创建失败',
      error: error.message
    });
  }
};

// 获取当前用户的所有订单
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderItems.product',
        select: 'name imageUrl'
      });

    // 处理订单数据，统一格式
    const processedOrders = orders.map(order => {
      // 确保每个订单都有必要的字段
      const orderObj = order.toObject();
      
      // 统一字段命名
      return {
        id: orderObj._id.toString(),
        orderNumber: orderObj.orderNumber,
        status: orderObj.status,
        createTime: new Date(orderObj.createdAt).toISOString().replace('T', ' ').substring(0, 19),
        totalAmount: orderObj.totalPrice,
        shippingFee: orderObj.shippingPrice || 0,
        totalCount: orderObj.orderItems ? orderObj.orderItems.reduce((sum, item) => sum + item.quantity, 0) : 0,
        goods: orderObj.orderItems ? orderObj.orderItems.map(item => ({
          id: item.product ? (typeof item.product === 'object' ? item.product._id.toString() : item.product.toString()) : '',
          name: item.name || (item.product && typeof item.product === 'object' ? item.product.name : '未知商品'),
          spec: item.spec || '',
          price: item.price,
          count: item.quantity,
          imageUrl: item.image || (item.product && typeof item.product === 'object' ? item.product.imageUrl : '/static/images/placeholder.jpg')
        })) : []
      };
    });

    res.status(200).json({
      success: true,
      data: processedOrders
    });
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败',
      error: error.message
    });
  }
};

// 根据订单状态获取订单
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    // 验证状态是否有效
    const validStatuses = ['pending_payment', 'pending_shipment', 'pending_receipt', 'completed', 'canceled', 'all'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单状态'
      });
    }

    // 构建查询条件
    const query = { user: req.user.id };
    if (status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderItems.product',
        select: 'name imageUrl'
      });

    // 处理订单数据，统一格式（与getMyOrders相同的处理逻辑）
    const processedOrders = orders.map(order => {
      // 确保每个订单都有必要的字段
      const orderObj = order.toObject();
      
      // 统一字段命名
      return {
        id: orderObj._id.toString(),
        orderNumber: orderObj.orderNumber,
        status: orderObj.status,
        createTime: new Date(orderObj.createdAt).toISOString().replace('T', ' ').substring(0, 19),
        totalAmount: orderObj.totalPrice,
        shippingFee: orderObj.shippingPrice || 0,
        totalCount: orderObj.orderItems ? orderObj.orderItems.reduce((sum, item) => sum + item.quantity, 0) : 0,
        goods: orderObj.orderItems ? orderObj.orderItems.map(item => ({
          id: item.product ? (typeof item.product === 'object' ? item.product._id.toString() : item.product.toString()) : '',
          name: item.name || (item.product && typeof item.product === 'object' ? item.product.name : '未知商品'),
          spec: item.spec || '',
          price: item.price,
          count: item.quantity,
          imageUrl: item.image || (item.product && typeof item.product === 'object' ? item.product.imageUrl : '/static/images/placeholder.jpg')
        })) : []
      };
    });

    res.status(200).json({
      success: true,
      data: processedOrders
    });
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败',
      error: error.message
    });
  }
};

// 获取订单详情
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // 如果ID是有效的ObjectId，则使用findById查询
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else {
      // 如果不是有效的ObjectId（可能是数字ID），尝试使用自定义ID查询
      // 这主要用于演示环境
      try {
        const numericId = parseInt(orderId);
        if (!isNaN(numericId)) {
          // 模拟查询演示数据
          // 这里返回一个模拟的订单对象
          return res.status(200).json({
            success: true,
            data: { 
              order: {
                id: numericId,
                orderNumber: `2024050${numericId}0001`,
                status: 'completed',
                createTime: '2024-05-01 10:30',
                user: req.user.id, // 确保当前用户是订单所有者
                totalAmount: 22.00,
                shippingFee: 5.00,
                totalCount: 2,
                goods: [
                  {
                    id: 1,
                    name: 'SPRINKLE 纯净水',
                    spec: '550ml',
                    price: 8.50,
                    count: 2,
                    imageUrl: '/static/images/products/water1.jpg'
                  }
                ]
              }
            }
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID格式'
        });
      }
    }

    // 检查订单是否存在
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 检查订单是否属于当前用户或管理员
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限访问该订单'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
};

// 更新订单状态为已支付
exports.updateOrderToPaid = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // 检查ID格式是否有效
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单ID格式'
      });
    }
    
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证用户权限
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改该订单'
      });
    }

    // 更新订单状态
    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'pending_shipment';
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      updateTime: req.body.updateTime,
      email: req.body.email
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: '订单已标记为已支付',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('更新订单支付状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新订单支付状态失败',
      error: error.message
    });
  }
};

// 更新订单状态为已发货
exports.updateOrderToDelivered = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // 检查ID格式是否有效
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单ID格式'
      });
    }
    
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证用户权限(仅管理员可以标记为已发货)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改该订单'
      });
    }

    // 验证订单是否已支付
    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        message: '订单尚未支付，无法发货'
      });
    }

    // 更新订单状态
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'pending_receipt';

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: '订单已标记为已发货',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('更新订单发货状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新订单发货状态失败',
      error: error.message
    });
  }
};

// 更新订单状态为已收货
exports.confirmReceipt = async (req, res) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // 如果ID是有效的ObjectId，则使用findById查询
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else {
      // 如果不是有效的ObjectId（可能是数字ID），尝试使用自定义ID查询
      // 这主要用于演示环境
      try {
        const numericId = parseInt(orderId);
        if (!isNaN(numericId)) {
          // 演示环境直接返回成功
          return res.status(200).json({
            success: true,
            message: '订单已确认收货（演示环境）',
            data: { demo: true }
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID格式'
        });
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证用户权限
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限修改该订单'
      });
    }

    // 验证订单是否已发货
    if (!order.isDelivered) {
      return res.status(400).json({
        success: false,
        message: '订单尚未发货，无法确认收货'
      });
    }

    // 更新订单状态
    order.status = 'completed';

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: '订单已确认收货',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('确认收货失败:', error);
    res.status(500).json({
      success: false,
      message: '确认收货失败',
      error: error.message
    });
  }
};

// 取消订单
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // 如果ID是有效的ObjectId，则使用findById查询
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else {
      // 如果不是有效的ObjectId（可能是数字ID），尝试使用自定义ID查询
      // 这主要用于演示环境
      try {
        const numericId = parseInt(orderId);
        if (!isNaN(numericId)) {
          // 演示环境直接返回成功
          return res.status(200).json({
            success: true,
            message: '订单已取消（演示环境）',
            data: { demo: true }
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID格式'
        });
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证用户权限
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限取消该订单'
      });
    }

    // 验证订单是否可以取消（未支付或未发货的订单才能取消）
    if (order.isDelivered) {
      return res.status(400).json({
        success: false,
        message: '订单已发货，无法取消'
      });
    }

    // 更新订单状态
    order.status = 'canceled';
    order.canceledAt = Date.now();

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: '订单已取消',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({
      success: false,
      message: '取消订单失败',
      error: error.message
    });
  }
};

// 管理员获取所有订单
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, keyword, startDate, endDate } = req.query;
    
    // 构建查询条件
    const query = {};
    
    // 状态筛选
    if (status && status !== '') {
      query.status = status;
    }
    
    // 关键词搜索 (订单号、下单账号、客户姓名、手机号、配送地址)
    if (keyword && keyword.trim() !== '') {
      const searchRegex = new RegExp(keyword.trim(), 'i');
      
      // 先查找用户名匹配的用户ID
      const matchingUsers = await User.find({
        $or: [
          { username: searchRegex },
          { nickName: searchRegex }
        ]
      }, '_id');
      const matchingUserIds = matchingUsers.map(user => user._id);
      
      query.$or = [
        { orderNumber: searchRegex },
        { 'shippingAddress.name': searchRegex },
        { 'shippingAddress.phone': searchRegex },
        { 'shippingAddress.address': searchRegex },
        { 'shippingAddress.province': searchRegex },
        { 'shippingAddress.city': searchRegex },
        { 'shippingAddress.district': searchRegex }
      ];
      
      // 如果找到匹配的用户，添加用户ID搜索条件
      if (matchingUserIds.length > 0) {
        query.$or.push({ user: { $in: matchingUserIds } });
      }
    }
    
    // 日期范围筛选
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // 设置为当天的23:59:59
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }
    
    console.log('订单查询条件:', query);
    
    // 查询总数
    const total = await Order.countDocuments(query);
    
    // 分页查询
    const orders = await Order.find(query)
      .populate('user', 'id username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        orders
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
};

// 管理员获取订单详情
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'id username')
      .populate('orderItems.product');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
};

// 管理员更新订单状态
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '缺少状态参数'
      });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 更新订单状态
    order.status = status;
    
    // 如果状态是已支付，设置支付相关字段
    if (status === 'pending_shipment' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }
    
    // 如果状态是已发货，设置发货相关字段
    if (status === 'pending_receipt' && !order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    
    // 如果状态是已取消，设置取消时间
    if (status === 'canceled' && !order.canceledAt) {
      order.canceledAt = Date.now();
    }
    
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      message: '订单状态已更新',
      data: updatedOrder
    });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败',
      error: error.message
    });
  }
};

// 再次购买订单中的商品（添加到购物车）
exports.buyAgain = async (req, res) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // 如果ID是有效的ObjectId，则使用findById查询
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate('orderItems.product');
    } else {
      // 如果不是有效的ObjectId（可能是数字ID），尝试使用自定义ID查询
      // 这主要用于演示环境
      try {
        const numericId = parseInt(orderId);
        if (!isNaN(numericId)) {
          // 如果是有效的数字，则使用模拟数据
          // 这里返回一个成功响应，因为这是演示环境
          return res.status(200).json({
            success: true,
            message: '商品已添加到购物车（演示环境）',
            data: { demo: true }
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID格式'
        });
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证用户权限
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作该订单'
      });
    }

    // 获取用户购物车
    const Cart = require('../models/cart');
    let cart = await Cart.findOne({ user: req.user.id });

    // 如果购物车不存在，创建一个新的
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
    }

    // 将订单中的商品添加到购物车
    for (const orderItem of order.orderItems) {
      // 检查商品是否存在
      if (!orderItem.product) {
        continue;
      }

      // 检查购物车中是否已有该商品
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === orderItem.product._id.toString()
      );

      if (existingItemIndex >= 0) {
        // 如果已存在，则更新数量
        cart.items[existingItemIndex].quantity += orderItem.quantity;
      } else {
        // 否则添加新商品
        cart.items.push({
          product: orderItem.product._id,
          quantity: orderItem.quantity,
          name: orderItem.name,
          price: orderItem.price,
          image: orderItem.image
        });
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: '商品已添加到购物车',
      data: { cart }
    });
  } catch (error) {
    console.error('再次购买失败:', error);
    res.status(500).json({
      success: false,
      message: '再次购买失败',
      error: error.message
    });
  }
};

// 删除订单
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // 如果ID是有效的ObjectId，则使用findById查询
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else {
      // 如果不是有效的ObjectId（可能是数字ID），尝试使用自定义ID查询
      // 这主要用于演示环境
      try {
        const numericId = parseInt(orderId);
        if (!isNaN(numericId)) {
          // 演示环境直接返回成功
          return res.status(200).json({
            success: true,
            message: '订单已删除（演示环境）',
            data: { demo: true }
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID格式'
        });
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证用户权限
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除该订单'
      });
    }

    // 验证订单是否可以删除（只有已完成或已取消的订单可以删除）
    if (order.status !== 'completed' && order.status !== 'canceled') {
      return res.status(400).json({
        success: false,
        message: '只有已完成或已取消的订单可以删除'
      });
    }

    // 删除订单
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({
      success: true,
      message: '订单已删除',
      data: {}
    });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(500).json({
      success: false,
      message: '删除订单失败',
      error: error.message
    });
  }
};

// 获取商品销售数据（基于实际订单计算）
exports.getProductSalesData = async (req, res) => {
  try {
    // 聚合查询，按商品分组统计销售量和销售额
    const salesData = await Order.aggregate([
      // 只统计已支付的订单
      { $match: { isPaid: true } },
      // 展开订单项
      { $unwind: '$orderItems' },
      // 按商品ID分组
      { $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          totalSales: { $sum: '$orderItems.quantity' },
          totalAmount: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      // 按销量降序排序
      { $sort: { totalSales: -1 } },
      // 限制返回数量
      { $limit: 10 }
    ]);

    // 计算总销量和总销售额
    const totalStats = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      { $group: {
          _id: null,
          totalQuantity: { $sum: '$orderItems.quantity' },
          totalAmount: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      }
    ]);

    const totalQuantity = totalStats.length > 0 ? totalStats[0].totalQuantity : 0;
    const totalAmount = totalStats.length > 0 ? totalStats[0].totalAmount : 0;

    // 计算每个商品的销售占比
    const formattedSalesData = salesData.map(item => ({
      id: item._id,
      name: item.name,
      sales: item.totalSales,
      amount: parseFloat(item.totalAmount.toFixed(2)),
      percent: totalQuantity > 0 ? Math.round((item.totalSales / totalQuantity) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      data: formattedSalesData,
      totals: {
        totalQuantity,
        totalAmount: parseFloat(totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('获取商品销售数据出错:', error);
    res.status(500).json({
      success: false,
      message: '获取商品销售数据出错',
      error: error.message
    });
  }
};

// 获取销售趋势数据
exports.getSalesTrends = async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    let dateFormat, groupBy, startDate;
    const now = new Date();

    // 设置日期格式和分组键
    switch (timeRange) {
      case 'week':
        // 获取本周一的日期
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startDate.setHours(0, 0, 0, 0);
        dateFormat = '%Y-%m-%d'; // 按天分组
        groupBy = { $dateToString: { format: dateFormat, date: '$createdAt' } };
        break;
      case 'month':
        // 获取本月1号的日期
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFormat = '%Y-%m-%d'; // 按天分组
        groupBy = { $dateToString: { format: dateFormat, date: '$createdAt' } };
        break;
      case 'year':
        // 获取今年1月1日的日期
        startDate = new Date(now.getFullYear(), 0, 1);
        dateFormat = '%Y-%m'; // 按月分组
        groupBy = { $dateToString: { format: dateFormat, date: '$createdAt' } };
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // 默认过去7天
        dateFormat = '%Y-%m-%d';
        groupBy = { $dateToString: { format: dateFormat, date: '$createdAt' } };
    }

    // 聚合查询销售趋势
    const salesTrend = await Order.aggregate([
      { $match: { 
          isPaid: true,
          createdAt: { $gte: startDate } 
        } 
      },
      { $group: {
          _id: groupBy,
          orderCount: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 格式化响应数据
    const xAxis = [];
    const salesData = [];
    const orderData = [];

    // 生成完整日期序列，处理无数据的日期
    if (timeRange === 'week') {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const dayMap = {};
      
      salesTrend.forEach(item => {
        const date = new Date(item._id);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // 转为周一到周日的索引
        dayMap[dayIndex] = item;
      });
      
      for (let i = 0; i < 7; i++) {
        xAxis.push(days[i]);
        const dayData = dayMap[i] || { orderCount: 0, totalSales: 0 };
        salesData.push(parseFloat(dayData.totalSales.toFixed(2)));
        orderData.push(dayData.orderCount);
      }
    } else if (timeRange === 'month') {
      // 当月每一天
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dayMap = {};
      
      salesTrend.forEach(item => {
        const dateParts = item._id.split('-');
        const day = parseInt(dateParts[2]);
        dayMap[day] = item;
      });
      
      for (let day = 1; day <= daysInMonth; day++) {
        xAxis.push(`${day}日`);
        const dayData = dayMap[day] || { orderCount: 0, totalSales: 0 };
        salesData.push(parseFloat(dayData.totalSales.toFixed(2)));
        orderData.push(dayData.orderCount);
      }
    } else if (timeRange === 'year') {
      // 全年每个月
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const monthMap = {};
      
      salesTrend.forEach(item => {
        const dateParts = item._id.split('-');
        const month = parseInt(dateParts[1]) - 1;
        monthMap[month] = item;
      });
      
      for (let i = 0; i < 12; i++) {
        xAxis.push(months[i]);
        const monthData = monthMap[i] || { orderCount: 0, totalSales: 0 };
        salesData.push(parseFloat(monthData.totalSales.toFixed(2)));
        orderData.push(monthData.orderCount);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        salesTrends: {
          [timeRange]: {
            xAxis,
            salesData,
            orderData
          }
        }
      }
    });
  } catch (error) {
    console.error('获取销售趋势数据出错:', error);
    res.status(500).json({
      success: false,
      message: '获取销售趋势数据出错',
      error: error.message
    });
  }
};

// 获取最新订单列表（限制数量）
exports.getLatestOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // 从数据库中获取最新订单
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("orderNumber user totalPrice status createdAt")
      .populate("user", "username");
    
    // 格式化返回的订单数据
    const formattedOrders = orders.map(order => ({
      orderNo: order.orderNumber,
      customer: order.user ? order.user.username : "未知用户",
      amount: order.totalPrice,
      status: getOrderStatusText(order.status),
      createTime: new Date(order.createdAt).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    }));
    
    res.status(200).json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error("获取最新订单失败:", error);
    res.status(500).json({
      success: false,
      message: "获取最新订单失败",
      error: error.message
    });
  }
};

// 辅助函数：根据订单状态获取显示文本
function getOrderStatusText(status) {
  const statusMap = {
    'pending_payment': '待付款',
    'pending_shipment': '待配送',
    'pending_receipt': '配送中',
    'completed': '已完成',
    'canceled': '已取消'
  };
  
  return statusMap[status] || '处理中';
}

// 获取统计概览数据
exports.getStatisticsOverview = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const yesterday = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = todayStart;

    // 获取今日订单数量
    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });

    // 获取昨日订单数量
    const yesterdayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: yesterday, $lt: yesterdayEnd }
    });

    // 计算订单趋势
    const orderTrend = yesterdayOrdersCount === 0 ? 
      (todayOrdersCount > 0 ? 100 : 0) : 
      ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount * 100);

    // 获取今日销售额
    const todaySalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lt: todayEnd },
          isPaid: true
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalPrice' }
        }
      }
    ]);
    const todaySales = todaySalesResult.length > 0 ? todaySalesResult[0].totalSales : 0;

    // 获取昨日销售额
    const yesterdaySalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday, $lt: yesterdayEnd },
          isPaid: true
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalPrice' }
        }
      }
    ]);
    const yesterdaySales = yesterdaySalesResult.length > 0 ? yesterdaySalesResult[0].totalSales : 0;

    // 计算销售额趋势
    const saleTrend = yesterdaySales === 0 ? 
      (todaySales > 0 ? 100 : 0) : 
      ((todaySales - yesterdaySales) / yesterdaySales * 100);

    // 获取今日新增用户数
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });

    // 获取昨日新增用户数
    const yesterdayNewUsers = await User.countDocuments({
      createdAt: { $gte: yesterday, $lt: yesterdayEnd }
    });

    // 计算用户增长趋势
    const userTrend = yesterdayNewUsers === 0 ? 
      (todayNewUsers > 0 ? 100 : 0) : 
      ((todayNewUsers - yesterdayNewUsers) / yesterdayNewUsers * 100);

    // 获取商品总数
    const Product = require('../models/product');
    const totalProducts = await Product.countDocuments();

    // 获取库存紧张商品数量（假设库存小于10为紧张）
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 10 }
    });

    const stats = {
      todayOrders: todayOrdersCount,
      orderTrend: Math.round(orderTrend * 100) / 100,
      todaySales: Math.round(todaySales * 100) / 100,
      saleTrend: Math.round(saleTrend * 100) / 100,
      newUsers: todayNewUsers,
      userTrend: Math.round(userTrend * 100) / 100,
      totalProducts: totalProducts,
      lowStockProducts: lowStockProducts
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计概览数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计概览数据失败',
      error: error.message
    });
  }
};
