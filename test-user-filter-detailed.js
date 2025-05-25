const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// 管理员登录获取token
async function loginAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/admin/auth/login`, {
      username: 'superadmin',
      password: 'admin123456'
    });
    
    if (response.data.success) {
      console.log('✅ 管理员登录成功');
      return response.data.data.token;
    } else {
      console.error('❌ 管理员登录失败:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 管理员登录错误:', error.response?.data || error.message);
    return null;
  }
}

// 详细测试用户筛选功能
async function testDetailedUserFilters(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n=== 详细测试用户筛选功能 ===\n');

  // 测试1: 获取所有用户，查看数据结构
  console.log('测试1: 获取所有用户数据');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        page: 1,
        limit: 10
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 获取用户成功，总数: ${response.data.data.total}`);
      const users = response.data.data.users;
      
      console.log('\n用户详细信息:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
        console.log(`   - 性别: ${user.gender || '未知'}`);
        console.log(`   - 积分: ${user.points || 0}`);
        console.log(`   - 总消费: ¥${(user.totalConsumption || 0).toFixed(2)}`);
        console.log(`   - 会员等级: ${user.calculatedMemberLevel || '普通会员'}`);
        console.log(`   - 状态: ${user.isActive ? '激活' : '禁用'}`);
        console.log(`   - 注册时间: ${new Date(user.createdAt).toLocaleDateString()}`);
        console.log(`   - 最后登录: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '从未登录'}`);
        console.log('');
      });
    } else {
      console.log('❌ 获取用户失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 获取用户错误:', error.response?.data || error.message);
  }

  // 测试2: 测试不同会员等级筛选
  console.log('\n测试2: 会员等级筛选');
  const memberLevels = ['普通会员', '铜牌会员', '银牌会员', '金牌会员', '白金会员', '钻石会员'];
  
  for (const level of memberLevels) {
    try {
      const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers,
        params: {
          memberLevel: level,
          page: 1,
          limit: 5
        }
      });
      
      if (response.data.success) {
        console.log(`✅ ${level}: ${response.data.data.total} 个用户`);
        if (response.data.data.users.length > 0) {
          response.data.data.users.forEach(user => {
            console.log(`   - ${user.username} (积分: ${user.points || 0})`);
          });
        }
      } else {
        console.log(`❌ ${level} 筛选失败:`, response.data.message);
      }
    } catch (error) {
      console.log(`❌ ${level} 筛选错误:`, error.response?.data || error.message);
    }
  }

  // 测试3: 测试不同消费金额区间
  console.log('\n测试3: 消费金额区间筛选');
  const consumptionRanges = ['0-50', '50-100', '100-500', '500-1000', '1000+'];
  
  for (const range of consumptionRanges) {
    try {
      const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers,
        params: {
          consumptionRange: range,
          page: 1,
          limit: 5
        }
      });
      
      if (response.data.success) {
        console.log(`✅ 消费${range}元: ${response.data.data.total} 个用户`);
        if (response.data.data.users.length > 0) {
          response.data.data.users.forEach(user => {
            console.log(`   - ${user.username} (消费: ¥${(user.totalConsumption || 0).toFixed(2)})`);
          });
        }
      } else {
        console.log(`❌ 消费${range}元 筛选失败:`, response.data.message);
      }
    } catch (error) {
      console.log(`❌ 消费${range}元 筛选错误:`, error.response?.data || error.message);
    }
  }

  // 测试4: 测试时间范围筛选
  console.log('\n测试4: 时间范围筛选');
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const timeRanges = [
      { name: '今天', start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      { name: '最近7天', start: lastWeek.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      { name: '最近30天', start: lastMonth.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
    ];
    
    for (const timeRange of timeRanges) {
      const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers,
        params: {
          createdAtStart: timeRange.start,
          createdAtEnd: timeRange.end,
          page: 1,
          limit: 5
        }
      });
      
      if (response.data.success) {
        console.log(`✅ ${timeRange.name}注册: ${response.data.data.total} 个用户`);
      } else {
        console.log(`❌ ${timeRange.name} 筛选失败:`, response.data.message);
      }
    }
  } catch (error) {
    console.log('❌ 时间范围筛选错误:', error.response?.data || error.message);
  }

  // 测试5: 复杂组合筛选
  console.log('\n测试5: 复杂组合筛选');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        isActive: 'true',
        memberLevel: '普通会员',
        consumptionRange: '0-100',
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 组合筛选成功: ${response.data.data.total} 个激活的普通会员(消费0-100元)`);
      const users = response.data.data.users;
      users.forEach(user => {
        console.log(`   - ${user.username} (状态: ${user.isActive ? '激活' : '禁用'}, 消费: ¥${(user.totalConsumption || 0).toFixed(2)})`);
      });
    } else {
      console.log('❌ 组合筛选失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 组合筛选错误:', error.response?.data || error.message);
  }

  console.log('\n=== 详细筛选功能测试完成 ===');
}

// 主函数
async function main() {
  const token = await loginAdmin();
  if (!token) {
    console.error('无法获取管理员token，测试终止');
    return;
  }

  await testDetailedUserFilters(token);
}

// 运行测试
main().catch(console.error); 