/**
 * 特定订单状态测试数据生成脚本
 * 运行方法：node scripts/generate-specific-orders.js
 * 
 * 生成按照特定数量和状态分布的订单测试数据：
 * - 2个待付款
 * - 3个待发货
 * - 1个待收货
 * - 10个已完成
 */

// 导入依赖模块
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Product = require('../../src/models/product');
const Order = require('../../src/models/order');

// MongoDB连接
mongoose.connect('mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

// 订单状态配置
const ORDER_STATUS = {
  'pending_payment': {
    name: '待付款',
    count: 2  // 需要生成的数量
  },
  'pending_shipment': {
    name: '待发货',
    count: 3
  },
  'pending_receipt': {
    name: '待收货',
    count: 1
  },
  'completed': {
    name: '已完成',
    count: 10
  }
};

// 随机生成一个日期，在过去的90天内
const randomDate = () => {
  const now = new Date();
  const pastDays = Math.floor(Math.random() * 90);
  now.setDate(now.getDate() - pastDays);
  return now;
};

// 随机生成一个地址
const generateRandomAddress = () => {
  const provinces = ['广东省', '北京市', '上海市', '浙江省', '江苏省'];
  const cities = ['深圳市', '广州市', '杭州市', '南京市', '北京市', '上海市'];
  const districts = ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '西湖区', '余杭区'];
  const streets = [
    '科技园南区', '华强北路', '中心区', '高新园', '创业路', 
    '人民路', '解放路', '建设大道', '益田路', '滨江大道'
  ];
  
  return {
    name: '收货人_' + Math.floor(Math.random() * 1000),
    phone: '1' + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 100000000).toString().padStart(9, '0'),
    province: provinces[Math.floor(Math.random() * provinces.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    district: districts[Math.floor(Math.random() * districts.length)],
    address: streets[Math.floor(Math.random() * streets.length)] + Math.floor(Math.random() * 100) + '号'
  };
};

// 生成一个特定状态的订单
const generateOrderWithStatus = async (user, products, status) => {
  // 随机选择1-5个商品
  const itemCount = Math.floor(Math.random() * 5) + 1;
  const orderItems = [];
  let itemsPrice = 0;
  
  // 随机选择不重复的商品
  const selectedProductIndices = new Set();
  while (selectedProductIndices.size < itemCount && selectedProductIndices.size < products.length) {
    const randomIndex = Math.floor(Math.random() * products.length);
    selectedProductIndices.add(randomIndex);
  }
  
  // 为每个选中的商品创建订单项
  for (const index of selectedProductIndices) {
    const product = products[index];
    const quantity = Math.floor(Math.random() * 5) + 1; // 随机数量1-5
    const price = product.price;
    
    orderItems.push({
      product: product._id,
      name: product.name,
      price: price,
      quantity: quantity,
      image: product.imageUrl || product.image || '/static/images/products/default.jpg',
      spec: product.specifications ? product.specifications[0] : '默认规格'
    });
    
    itemsPrice += price * quantity;
  }
  
  // 随机运费 (0或10元)
  const shippingPrice = Math.random() < 0.3 ? 0 : 10;
  
  // 总价 = 商品价格 + 运费
  const totalPrice = itemsPrice + shippingPrice;
  
  // 设置订单基本信息
  const order = {
    user: user._id,
    orderItems: orderItems,
    shippingAddress: generateRandomAddress(),
    paymentMethod: '微信支付',
    itemsPrice: itemsPrice,
    shippingPrice: shippingPrice,
    totalPrice: totalPrice,
    status: status,
    isPaid: status !== 'pending_payment',
    isDelivered: ['pending_receipt', 'completed'].includes(status),
    remark: Math.random() < 0.3 ? '请尽快发货，谢谢！' : ''
  };
  
  // 根据状态设置相应的日期
  const orderDate = randomDate();
  order.createdAt = orderDate;
  
  if (order.isPaid) {
    order.paidAt = new Date(orderDate.getTime() + 1000 * 60 * 30); // 下单30分钟后支付
  }
  
  if (order.isDelivered) {
    order.deliveredAt = new Date(order.paidAt.getTime() + 1000 * 60 * 60 * 24 * 2); // 支付2天后发货
  }
  
  if (status === 'completed') {
    order.completedAt = new Date(order.deliveredAt.getTime() + 1000 * 60 * 60 * 24 * 3); // 发货3天后完成
  }
  
  return order;
};

// 主函数：添加特定状态的测试订单
const addSpecificStatusOrders = async () => {
  try {
    // 找到当前登录用户，如果没有则创建一个默认用户
    let user = await User.findOne();
    if (!user) {
      console.log('没有找到用户，创建默认测试用户');
      
      // 创建一个默认用户用于测试
      const defaultUser = new User({
        username: 'testuser',
        password: 'password123',
        nickName: '测试用户',
        phone: '13800138000'
      });
      
      await defaultUser.save();
      user = defaultUser;
      console.log('已创建默认测试用户');
    } else {
      console.log(`使用现有用户: ${user.nickName || user.username}`);
    }
    
    // 获取所有商品
    const products = await Product.find();
    if (products.length === 0) {
      console.error('没有找到商品，请先添加商品数据');
      return;
    }
    
    // 清空该用户的所有现有订单
    await Order.deleteMany({ user: user._id });
    console.log(`已清空用户 ${user.nickName || user.username} 的所有订单数据`);
    
    // 生成特定状态的订单
    let totalCreated = 0;
    
    for (const [status, config] of Object.entries(ORDER_STATUS)) {
      console.log(`开始生成 ${config.count} 个${config.name}订单...`);
      
      for (let i = 0; i < config.count; i++) {
        const orderData = await generateOrderWithStatus(user, products, status);
        const order = new Order(orderData);
        await order.save();
        totalCreated++;
      }
    }
    
    console.log(`成功为用户 ${user.nickName || user.username} 生成了 ${totalCreated} 条测试订单数据`);
    console.log('现在可以在小程序中查看这些订单了');
    
  } catch (error) {
    console.error('生成测试订单时出错:', error);
  } finally {
    // 关闭数据库连接
    mongoose.disconnect();
  }
};

// 执行主函数
addSpecificStatusOrders(); 