const Order = require('../models/order');
const config = require('../config/config');

// 生成支付参数（模拟微信支付）
exports.createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // 验证订单是否存在
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证订单是否属于当前用户
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作该订单'
      });
    }

    // 验证订单是否已支付
    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: '订单已支付'
      });
    }

    // 生成模拟的支付参数
    // 实际情况下，这里会调用微信支付API获取预支付参数
    // 这里我们返回一些模拟数据
    const paymentParams = {
      appId: 'mock_app_id',
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: Math.random().toString(36).substr(2, 15),
      package: `prepay_id=wx${Date.now()}`,
      signType: 'MD5',
      paySign: 'mock_signature',
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalPrice
    };

    res.status(200).json({
      success: true,
      message: '生成支付参数成功',
      data: {
        paymentParams
      }
    });
  } catch (error) {
    console.error('生成支付参数失败:', error);
    res.status(500).json({
      success: false,
      message: '生成支付参数失败',
      error: error.message
    });
  }
};

// 支付回调接口（微信支付回调）
exports.paymentCallback = async (req, res) => {
  try {
    // 在实际应用中，这里会验证微信支付回调的签名
    // 并解析回调数据来获取支付结果
    const { orderId, transactionId } = req.body;

    // 验证订单是否存在
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 更新订单状态为已支付
    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'pending_shipment';
    order.paymentResult = {
      id: transactionId,
      status: 'success',
      updateTime: new Date()
    };

    await order.save();

    // 返回成功，让微信停止回调
    res.status(200).send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
  } catch (error) {
    console.error('处理支付回调失败:', error);
    // 向微信返回失败，让微信继续回调
    res.status(500).send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>');
  }
};

// 查询支付状态
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 验证订单是否存在
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证订单是否属于当前用户
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作该订单'
      });
    }

    // 返回订单支付状态
    res.status(200).json({
      success: true,
      data: {
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        status: order.status
      }
    });
  } catch (error) {
    console.error('查询支付状态失败:', error);
    res.status(500).json({
      success: false,
      message: '查询支付状态失败',
      error: error.message
    });
  }
};

// 前端确认支付接口（由前端调用，确认支付完成）
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      });
    }

    // 验证订单是否存在
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证订单是否属于当前用户
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权限操作该订单'
      });
    }

    // 如果订单已经支付，直接返回成功
    if (order.isPaid) {
      return res.status(200).json({
        success: true,
        message: '订单已支付',
        data: { orderId }
      });
    }

    // 更新订单状态为已支付
    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'pending_shipment';
    order.paymentResult = {
      id: transactionId || `mock_${Date.now()}`,
      status: 'success',
      updateTime: new Date()
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: '支付确认成功',
      data: { 
        orderId,
        isPaid: true,
        status: order.status 
      }
    });
  } catch (error) {
    console.error('确认支付失败:', error);
    res.status(500).json({
      success: false,
      message: '确认支付失败',
      error: error.message
    });
  }
}; 