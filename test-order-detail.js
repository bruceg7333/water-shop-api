const axios = require('axios');

// 测试订单详情API
async function testOrderDetailAPI() {
  try {
    console.log('开始测试订单详情API...');
    
    // 1. 先登录获取token
    const loginResponse = await axios.post('http://localhost:5001/api/admin/auth/login', {
      username: 'superadmin',
      password: 'admin123456'
    });
    
    if (!loginResponse.data.success) {
      console.error('登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到token');
    
    // 2. 先获取订单列表，拿到一个订单ID
    const ordersResponse = await axios.get('http://localhost:5001/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 1
      }
    });
    
    if (!ordersResponse.data.success || !ordersResponse.data.data.orders.length) {
      console.error('没有找到订单');
      return;
    }
    
    const firstOrder = ordersResponse.data.data.orders[0];
    console.log('获取到第一个订单:', {
      id: firstOrder._id,
      orderNumber: firstOrder.orderNumber,
      status: firstOrder.status
    });
    
    // 3. 测试获取订单详情
    const detailResponse = await axios.get(`http://localhost:5001/api/admin/orders/${firstOrder._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('订单详情API响应:', detailResponse.data);
    
    if (detailResponse.data.success) {
      console.log('✅ 订单详情API测试成功');
      console.log('订单号:', detailResponse.data.data.orderNumber);
      console.log('客户信息:', detailResponse.data.data.shippingAddress?.name);
      console.log('详细地址结构:', detailResponse.data.data.shippingAddress);
      console.log('订单商品数量:', detailResponse.data.data.orderItems?.length || 0);
    } else {
      console.error('❌ 订单详情API测试失败:', detailResponse.data.message);
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error.response?.data || error.message);
  }
}

testOrderDetailAPI(); 