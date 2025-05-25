const mongoose = require('mongoose');
const Order = require('./src/models/order');
const config = require('./src/config/config');

// 连接数据库
mongoose.connect(config.mongoURI)
  .then(() => {
    console.log('✅ 数据库连接成功');
    createTestOrders();
  })
  .catch(error => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  });

async function createTestOrders() {
  try {
    // 清除现有订单
    console.log('清除现有订单数据...');
    await Order.deleteMany({});
    
    // 创建测试订单
    const testOrders = [
      {
        orderNumber: 'WS' + Date.now() + '001',
        user: new mongoose.Types.ObjectId(), // 假用户ID
        orderItems: [
          {
            name: 'SPRINKLE 纯净水 350ml',
            price: 2.00,
            quantity: 12,
            image: '/static/images/products/water1.jpg'
          },
          {
            name: 'SPRINKLE 矿泉水 500ml',
            price: 2.50,
            quantity: 6,
            image: '/static/images/products/water2.jpg'
          }
        ],
        shippingAddress: {
          province: '北京市',
          city: '朝阳区',
          district: '建国门',
          detail: '建国路88号现代城A座1001室',
          contactName: '张三',
          phone: '13800138000'
        },
        paymentMethod: 'wechat',
        itemsPrice: 39.00,
        shippingPrice: 5.00,
        totalPrice: 44.00,
        status: 'pending_payment',
        isPaid: false,
        isDelivered: false
      },
      {
        orderNumber: 'WS' + Date.now() + '002',
        user: new mongoose.Types.ObjectId(),
        orderItems: [
          {
            name: 'SPRINKLE 山泉水 1L',
            price: 3.00,
            quantity: 8,
            image: '/static/images/products/water3.jpg'
          }
        ],
        shippingAddress: {
          province: '北京市',
          city: '海淀区',
          district: '中关村',
          detail: '中关村大街1号科技大厦B座808',
          contactName: '李四',
          phone: '13900139000'
        },
        paymentMethod: 'alipay',
        itemsPrice: 24.00,
        shippingPrice: 5.00,
        totalPrice: 29.00,
        status: 'pending_shipment',
        isPaid: true,
        paidAt: new Date(),
        isDelivered: false
      },
      {
        orderNumber: 'WS' + Date.now() + '003',
        user: new mongoose.Types.ObjectId(),
        orderItems: [
          {
            name: 'SPRINKLE 苏打水 330ml',
            price: 3.50,
            quantity: 4,
            image: '/static/images/products/water4.jpg'
          },
          {
            name: 'SPRINKLE 饮用纯净水 1.5L',
            price: 4.00,
            quantity: 2,
            image: '/static/images/products/water5.jpg'
          }
        ],
        shippingAddress: {
          province: '北京市',
          city: '西城区',
          district: '西长安街',
          detail: '西长安街1号国贸中心C座1201',
          contactName: '王五',
          phone: '13700137000'
        },
        paymentMethod: 'cash',
        itemsPrice: 22.00,
        shippingPrice: 5.00,
        totalPrice: 27.00,
        status: 'pending_receipt',
        isPaid: true,
        paidAt: new Date(Date.now() - 86400000), // 1天前
        isDelivered: true,
        deliveredAt: new Date()
      },
      {
        orderNumber: 'WS' + Date.now() + '004',
        user: new mongoose.Types.ObjectId(),
        orderItems: [
          {
            name: 'SPRINKLE 天然矿泉水 2L',
            price: 4.50,
            quantity: 6,
            image: '/static/images/products/water6.jpg'
          }
        ],
        shippingAddress: {
          province: '北京市',
          city: '东城区',
          district: '东长安街',
          detail: '东长安街5号王府井大厦A座502',
          contactName: '赵六',
          phone: '13600136000'
        },
        paymentMethod: 'card',
        itemsPrice: 27.00,
        shippingPrice: 5.00,
        totalPrice: 32.00,
        status: 'completed',
        isPaid: true,
        paidAt: new Date(Date.now() - 172800000), // 2天前
        isDelivered: true,
        deliveredAt: new Date(Date.now() - 86400000) // 1天前
      },
      {
        orderNumber: 'WS' + Date.now() + '005',
        user: new mongoose.Types.ObjectId(),
        orderItems: [
          {
            name: 'SPRINKLE 气泡水 330ml',
            price: 5.50,
            quantity: 3,
            image: '/static/images/products/water7.jpg'
          }
        ],
        shippingAddress: {
          province: '北京市',
          city: '丰台区',
          district: '丰台路',
          detail: '丰台路20号科技园区创业大厦301',
          contactName: '钱七',
          phone: '13500135000'
        },
        paymentMethod: 'wechat',
        itemsPrice: 16.50,
        shippingPrice: 5.00,
        totalPrice: 21.50,
        status: 'canceled',
        isPaid: false,
        isDelivered: false
      }
    ];
    
    // 插入测试订单
    console.log('创建测试订单...');
    await Order.insertMany(testOrders);
    
    console.log('✅ 测试订单创建成功!');
    console.log(`创建了 ${testOrders.length} 个测试订单`);
    
    // 验证创建的订单
    const orderCount = await Order.countDocuments();
    console.log(`数据库中现有 ${orderCount} 个订单`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试订单失败:', error);
    process.exit(1);
  }
} 