const axios = require('axios');

// 测试管理员订单API
async function testAdminOrdersAPI() {
  try {
    console.log('开始测试管理员订单API...');
    
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
    
    // 2. 测试获取订单列表
    const ordersResponse = await axios.get('http://localhost:5001/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('订单列表API响应:', ordersResponse.data);
    
    if (ordersResponse.data.success) {
      console.log('✅ 管理员订单API测试成功');
      console.log('订单数量:', ordersResponse.data.data.orders?.length || 0);
    } else {
      console.error('❌ 管理员订单API测试失败:', ordersResponse.data.message);
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error.response?.data || error.message);
  }
}

testAdminOrdersAPI(); 