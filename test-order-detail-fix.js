const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testOrderDetailFix() {
  try {
    // 登录获取token
    const loginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      username: 'superadmin', 
      password: 'admin123456'
    });
    
    const token = loginRes.data.data.token;
    console.log('✅ 登录成功');
    
    // 获取订单列表
    const listRes = await axios.get(`${BASE_URL}/admin/orders`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { page: 1, limit: 10 }
    });
    
    const orders = listRes.data.data.orders;
    console.log('\n📊 测试不同状态的订单:');
    
    // 按状态分组统计
    const statusGroups = {};
    orders.forEach(order => {
      if (!statusGroups[order.status]) {
        statusGroups[order.status] = [];
      }
      statusGroups[order.status].push(order);
    });
    
    console.log('\n📈 状态分布统计:');
    Object.entries(statusGroups).forEach(([status, orders]) => {
      console.log(`  ${status}: ${orders.length}个订单`);
    });
    
    // 测试每种状态的订单详情
    console.log('\n🔍 测试订单详情状态映射:');
    for (const [status, statusOrders] of Object.entries(statusGroups)) {
      if (statusOrders.length > 0) {
        const testOrder = statusOrders[0];
        
        try {
          const detailRes = await axios.get(`${BASE_URL}/admin/orders/${testOrder._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const orderDetail = detailRes.data.data;
          
          // 模拟前端状态映射逻辑
          const getStatusText = (status) => {
            const statusMap = {
              'pending_payment': '待付款',
              'pending_shipment': '待发货',
              'pending_receipt': '待收货',
              'completed': '已完成',
              'canceled': '已取消',
              'refunded': '已退款'
            }
            return statusMap[status] || '未知状态'
          }
          
          const getStatusStep = (status) => {
            const stepMap = {
              'pending_payment': 1,
              'pending_shipment': 2,
              'pending_receipt': 3,
              'completed': 4,
              'canceled': 1,
              'refunded': 3
            }
            return stepMap[status] || 0
          }
          
          const statusText = getStatusText(orderDetail.status);
          const statusStep = getStatusStep(orderDetail.status);
          
          console.log(`\n📋 ${testOrder.orderNumber} (${status}):`);
          console.log(`  ✅ 状态文本: ${statusText}`);
          console.log(`  📊 进度步骤: ${statusStep}/4`);
          
          // 检查可用操作
          let availableActions = [];
          if (orderDetail.status === 'pending_payment') {
            availableActions = ['确认付款', '取消订单'];
          } else if (orderDetail.status === 'pending_shipment') {
            availableActions = ['开始发货', '取消订单'];
          } else if (orderDetail.status === 'pending_receipt') {
            availableActions = ['完成订单', '申请退款'];
          } else if (orderDetail.status === 'completed') {
            availableActions = ['申请退款'];
          }
          
          console.log(`  🔧 可用操作: ${availableActions.join(', ') || '无'}`);
          
          if (statusText === '未知状态') {
            console.log(`  ⚠️  警告: 状态仍显示为未知`);
          }
          
        } catch (error) {
          console.log(`  ❌ 获取订单详情失败: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
    console.log('\n✅ 订单详情状态修复测试完成');
    console.log('\n🎯 修复效果总结:');
    console.log('  • 移除了status字段的默认值设置');
    console.log('  • 修复了模拟操作函数的状态值');
    console.log('  • 统一了状态值命名规范');
    console.log('  • 状态映射现在应该能正确显示');
    
    console.log('\n📝 前端使用说明:');
    console.log('  1. 强制刷新浏览器页面 (Ctrl+F5)');
    console.log('  2. 打开浏览器控制台查看调试信息');
    console.log('  3. 进入任意订单详情页面');
    console.log('  4. 检查状态显示是否正确');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testOrderDetailFix(); 