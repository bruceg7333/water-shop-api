const mongoose = require('mongoose');
const User = require('./src/models/user');
const Product = require('./src/models/product');
const Order = require('./src/models/order');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 生成随机地址
const generateRandomAddress = () => {
  const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省'];
  const cities = ['朝阳区', '徐汇区', '天河区', '西湖区', '玄武区'];
  const streets = ['建国路88号', '淮海中路123号', '体育西路456号', '文三路789号', '中山路321号'];
  const names = ['张三', '李四', '王五', '赵六', '钱七'];
  const phones = ['13800138000', '13900139000', '13700137000', '13600136000', '13500135000'];
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    phone: phones[Math.floor(Math.random() * phones.length)],
    province: provinces[Math.floor(Math.random() * provinces.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    district: '市辖区',
    address: streets[Math.floor(Math.random() * streets.length)]
  };
};

// 生成随机日期（过去90天内）
const randomDate = (daysAgo = 90) => {
  const now = new Date();
  const pastDays = Math.floor(Math.random() * daysAgo);
  now.setDate(now.getDate() - pastDays);
  return now;
};

// 为指定用户生成订单
const generateOrdersForUser = async (userId, products) => {
  const orderStatuses = [
    { status: 'pending_payment', count: 2 },
    { status: 'pending_shipment', count: 3 },
    { status: 'pending_receipt', count: 1 },
    { status: 'completed', count: 8 },
    { status: 'canceled', count: 1 }
  ];
  
  const orders = [];
  let orderIndex = 1; // 添加订单索引以确保订单号唯一
  
  for (const statusConfig of orderStatuses) {
    for (let i = 0; i < statusConfig.count; i++) {
      // 随机选择1-4个商品
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [];
      const usedProductIds = new Set();
      
      // 随机选择不重复的商品
      while (selectedProducts.length < itemCount && selectedProducts.length < products.length) {
        const randomIndex = Math.floor(Math.random() * products.length);
        const product = products[randomIndex];
        
        if (!usedProductIds.has(product._id.toString())) {
          usedProductIds.add(product._id.toString());
          const quantity = Math.floor(Math.random() * 5) + 1; // 1-5个
          
          selectedProducts.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.imageUrl || '/assets/images/products/water1.jpg',
            spec: '默认规格'
          });
        }
      }
      
      // 计算价格
      const itemsPrice = selectedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingPrice = Math.random() < 0.3 ? 0 : 5; // 30%概率免运费
      const totalPrice = itemsPrice + shippingPrice;
      
      // 创建订单
      const orderDate = randomDate();
      
      // 生成唯一的订单号
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const orderNumber = `${year}${month}${day}${String(orderIndex).padStart(6, '0')}`;
      
      const order = {
        user: userId,
        orderNumber: orderNumber, // 手动设置订单号
        orderItems: selectedProducts,
        shippingAddress: generateRandomAddress(),
        paymentMethod: '微信支付',
        itemsPrice: itemsPrice,
        shippingPrice: shippingPrice,
        totalPrice: totalPrice,
        status: statusConfig.status,
        isPaid: statusConfig.status !== 'pending_payment',
        isDelivered: ['pending_receipt', 'completed'].includes(statusConfig.status),
        remark: Math.random() < 0.3 ? '请尽快发货，谢谢！' : '',
        createdAt: orderDate,
        updatedAt: orderDate
      };
      
      // 根据状态设置相应的时间戳
      if (order.isPaid) {
        order.paidAt = new Date(orderDate.getTime() + 30 * 60 * 1000); // 30分钟后支付
      }
      
      if (order.isDelivered) {
        order.deliveredAt = new Date(order.paidAt.getTime() + 2 * 24 * 60 * 60 * 1000); // 2天后发货
      }
      
      if (statusConfig.status === 'canceled') {
        order.canceledAt = new Date(orderDate.getTime() + 60 * 60 * 1000); // 1小时后取消
      }
      
      orders.push(order);
      orderIndex++; // 递增订单索引
    }
  }
  
  return orders;
};

// 主函数
const main = async () => {
  try {
    console.log('正在连接数据库...');
    
    // 获取微信用户
    const wxUser = await User.findOne({ username: 'wx_user_820198' });
    if (!wxUser) {
      console.error('未找到微信用户');
      return;
    }
    
    console.log(`找到用户: ${wxUser.nickName} (${wxUser.username})`);
    
    // 获取所有商品
    const products = await Product.find();
    if (products.length === 0) {
      console.error('未找到商品数据');
      return;
    }
    
    console.log(`找到 ${products.length} 个商品`);
    
    // 清空该用户的现有订单
    const deletedCount = await Order.deleteMany({ user: wxUser._id });
    console.log(`删除了 ${deletedCount.deletedCount} 个旧订单`);
    
    // 生成新订单
    const newOrders = await generateOrdersForUser(wxUser._id, products);
    console.log(`准备创建 ${newOrders.length} 个新订单`);
    
    // 批量插入订单
    const createdOrders = await Order.insertMany(newOrders);
    console.log(`成功创建了 ${createdOrders.length} 个订单！`);
    
    // 显示订单统计
    const statusCounts = await Order.aggregate([
      { $match: { user: wxUser._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\n订单状态统计:');
    statusCounts.forEach(stat => {
      const statusNames = {
        'pending_payment': '待付款',
        'pending_shipment': '待发货', 
        'pending_receipt': '待收货',
        'completed': '已完成',
        'canceled': '已取消'
      };
      console.log(`${statusNames[stat._id] || stat._id}: ${stat.count} 个`);
    });
    
  } catch (error) {
    console.error('生成订单失败:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
};

// 运行脚本
main(); 