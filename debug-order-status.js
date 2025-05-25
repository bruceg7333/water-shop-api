const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function debugOrderStatus() {
  try {
    console.log('🔍 开始调试订单状态问题...\n');
    
    // 登录获取token
    const loginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      username: 'superadmin', 
      password: 'admin123456'
    });
    
    const token = loginRes.data.data.token;
    console.log('✅ 登录成功\n');
    
    // 获取订单列表
    const listRes = await axios.get(`${BASE_URL}/admin/orders`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { page: 1, limit: 20 }
    });
    
    const orders = listRes.data.data.orders;
    console.log(`📊 获取到 ${orders.length} 个订单\n`);
    
    // 检查前几个订单的状态
    console.log('🔍 检查订单状态分布:');
    const statusStats = {};
    orders.forEach(order => {
      const status = order.status;
      statusStats[status] = (statusStats[status] || 0) + 1;
    });
    
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}个订单`);
    });
    
    console.log('\n📋 详细测试订单详情API:');
    
    // 测试前5个订单的详情API
    for (let i = 0; i < Math.min(5, orders.length); i++) {
      const order = orders[i];
      console.log(`\n--- 订单 ${i + 1}: ${order.orderNumber} ---`);
      console.log(`列表API状态: "${order.status}" (类型: ${typeof order.status})`);
      
      try {
        // 调用详情API
        const detailRes = await axios.get(`${BASE_URL}/admin/orders/${order._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orderDetail = detailRes.data.data;
        console.log(`详情API状态: "${orderDetail.status}" (类型: ${typeof orderDetail.status})`);
        
        // 检查前端状态映射
        const statusMap = {
          'pending_payment': '待付款',
          'pending_shipment': '待发货', 
          'pending_receipt': '待收货',
          'completed': '已完成',
          'canceled': '已取消',
          'refunded': '已退款'
        };
        
        const mappedText = statusMap[orderDetail.status];
        console.log(`状态映射结果: "${mappedText || '未知状态'}"`);
        
        // 检查是否存在问题
        if (!mappedText) {
          console.log(`⚠️  问题发现: 状态 "${orderDetail.status}" 无法映射`);
        } else if (mappedText === '待付款') {
          console.log('⚠️  注意: 显示为"待付款"');
        }
        
        // 检查其他相关字段
        console.log(`isPaid: ${orderDetail.isPaid}`);
        console.log(`isDelivered: ${orderDetail.isDelivered}`);
        console.log(`paidAt: ${orderDetail.paidAt || 'null'}`);
        console.log(`deliveredAt: ${orderDetail.deliveredAt || 'null'}`);
        
      } catch (error) {
        console.log(`❌ 获取详情失败: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n🎯 问题分析:');
    console.log('1. 检查数据库中订单的实际状态值');
    console.log('2. 检查前端状态映射逻辑'); 
    console.log('3. 检查是否有默认值覆盖问题');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.response?.data || error.message);
  }
}

debugOrderStatus(); 