const axios = require('axios');

// 测试管理员订单搜索API
async function testOrderSearchAPI() {
  try {
    console.log('开始测试订单搜索API...');
    
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
    
    // 2. 测试不带参数的订单列表
    console.log('\n2. 测试获取所有订单...');
    const allOrdersResponse = await axios.get('http://localhost:5001/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 5
      }
    });
    
    if (allOrdersResponse.data.success) {
      console.log('✅ 获取所有订单成功');
      console.log('总订单数:', allOrdersResponse.data.data.total);
      console.log('返回订单数:', allOrdersResponse.data.data.orders?.length || 0);
      
      if (allOrdersResponse.data.data.orders?.length > 0) {
        const firstOrder = allOrdersResponse.data.data.orders[0];
        console.log('第一个订单信息:', {
          orderNumber: firstOrder.orderNumber,
          status: firstOrder.status,
          customerName: firstOrder.shippingAddress?.name
        });
      }
    }
    
    // 3. 测试按状态筛选
    console.log('\n3. 测试按状态筛选 (pending_payment)...');
    const statusFilterResponse = await axios.get('http://localhost:5001/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 5,
        status: 'pending_payment'
      }
    });
    
    if (statusFilterResponse.data.success) {
      console.log('✅ 状态筛选成功');
      console.log('待付款订单数:', statusFilterResponse.data.data.orders?.length || 0);
      statusFilterResponse.data.data.orders?.forEach(order => {
        console.log('- 订单:', order.orderNumber, '状态:', order.status);
      });
    } else {
      console.log('❌ 状态筛选失败:', statusFilterResponse.data.message);
    }
    
    // 4. 测试关键词搜索
    console.log('\n4. 测试关键词搜索 (订单号)...');
    const keywordSearchResponse = await axios.get('http://localhost:5001/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 5,
        keyword: '20250523574859'  // 搜索具体的订单号
      }
    });
    
    if (keywordSearchResponse.data.success) {
      console.log('✅ 订单号搜索成功');
      console.log('搜索结果数:', keywordSearchResponse.data.data.orders?.length || 0);
      keywordSearchResponse.data.data.orders?.forEach(order => {
        console.log('- 订单:', order.orderNumber, '客户:', order.shippingAddress?.name);
      });
    } else {
      console.log('❌ 订单号搜索失败:', keywordSearchResponse.data.message);
    }
    
    // 5. 测试客户名搜索
    console.log('\n5. 测试客户名搜索...');
    const customerSearchResponse = await axios.get('http://localhost:5001/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 5,
        keyword: '王五'  // 搜索客户名
      }
    });
    
    if (customerSearchResponse.data.success) {
      console.log('✅ 客户名搜索成功');
      console.log('搜索结果数:', customerSearchResponse.data.data.orders?.length || 0);
      customerSearchResponse.data.data.orders?.forEach(order => {
        console.log('- 订单:', order.orderNumber, '客户:', order.shippingAddress?.name);
      });
    } else {
      console.log('❌ 客户名搜索失败:', customerSearchResponse.data.message);
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error.response?.data || error.message);
  }
}

testOrderSearchAPI(); 