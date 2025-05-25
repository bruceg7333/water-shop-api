const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// 管理员登录获取token
async function loginAdmin() {
  try {
    // 尝试不同的管理员账户
    const adminAccounts = [
      { username: 'superadmin', password: 'admin123456' },
      { username: 'admin', password: 'admin123' },
      { username: 'admin', password: 'admin123456' }
    ];
    
    for (const account of adminAccounts) {
      try {
        console.log(`尝试登录: ${account.username}`);
        const response = await axios.post(`${BASE_URL}/admin/auth/login`, account);
        
        if (response.data.success) {
          console.log(`✅ 管理员登录成功: ${account.username}`);
          return response.data.data.token;
        }
      } catch (error) {
        console.log(`❌ ${account.username} 登录失败:`, error.response?.data?.message || error.message);
      }
    }
    
    console.error('所有管理员账户登录失败');
    return null;
  } catch (error) {
    console.error('管理员登录错误:', error.response?.data || error.message);
    return null;
  }
}

// 测试用户筛选功能
async function testUserFilters(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n=== 开始测试用户筛选功能 ===\n');

  // 测试1: 基础搜索
  console.log('测试1: 基础搜索');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        search: 'test',
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 基础搜索成功，找到 ${response.data.data.total} 个用户`);
      console.log(`返回用户数量: ${response.data.data.users.length}`);
    } else {
      console.log('❌ 基础搜索失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 基础搜索错误:', error.response?.data || error.message);
  }

  // 测试2: 性别筛选
  console.log('\n测试2: 性别筛选');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        gender: '男',
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 性别筛选成功，找到 ${response.data.data.total} 个男性用户`);
      const users = response.data.data.users;
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.gender || '未知'})`);
      });
    } else {
      console.log('❌ 性别筛选失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 性别筛选错误:', error.response?.data || error.message);
  }

  // 测试3: 状态筛选
  console.log('\n测试3: 状态筛选');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        isActive: 'true',
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 状态筛选成功，找到 ${response.data.data.total} 个激活用户`);
      const users = response.data.data.users;
      users.forEach(user => {
        console.log(`  - ${user.username} (激活: ${user.isActive})`);
      });
    } else {
      console.log('❌ 状态筛选失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 状态筛选错误:', error.response?.data || error.message);
  }

  // 测试4: 注册时间范围筛选
  console.log('\n测试4: 注册时间范围筛选');
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        createdAtStart: yesterday,
        createdAtEnd: today,
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 注册时间筛选成功，找到 ${response.data.data.total} 个用户 (${yesterday} 至 ${today})`);
      const users = response.data.data.users;
      users.forEach(user => {
        const createdAt = new Date(user.createdAt).toLocaleDateString();
        console.log(`  - ${user.username} (注册: ${createdAt})`);
      });
    } else {
      console.log('❌ 注册时间筛选失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 注册时间筛选错误:', error.response?.data || error.message);
  }

  // 测试5: 会员等级筛选
  console.log('\n测试5: 会员等级筛选');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        memberLevel: '普通会员',
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 会员等级筛选成功，找到 ${response.data.data.total} 个普通会员`);
      const users = response.data.data.users;
      users.forEach(user => {
        console.log(`  - ${user.username} (积分: ${user.points || 0}, 等级: ${user.calculatedMemberLevel || '普通会员'})`);
      });
    } else {
      console.log('❌ 会员等级筛选失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 会员等级筛选错误:', error.response?.data || error.message);
  }

  // 测试6: 消费金额区间筛选
  console.log('\n测试6: 消费金额区间筛选');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        consumptionRange: '0-100',
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 消费金额筛选成功，找到 ${response.data.data.total} 个用户 (消费0-100元)`);
      const users = response.data.data.users;
      users.forEach(user => {
        console.log(`  - ${user.username} (总消费: ¥${(user.totalConsumption || 0).toFixed(2)})`);
      });
    } else {
      console.log('❌ 消费金额筛选失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 消费金额筛选错误:', error.response?.data || error.message);
  }

  // 测试7: 组合筛选
  console.log('\n测试7: 组合筛选（性别+状态）');
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers,
      params: {
        gender: '男',
        isActive: 'true',
        page: 1,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 组合筛选成功，找到 ${response.data.data.total} 个激活的男性用户`);
      const users = response.data.data.users;
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.gender || '未知'}, 激活: ${user.isActive})`);
      });
    } else {
      console.log('❌ 组合筛选失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 组合筛选错误:', error.response?.data || error.message);
  }

  console.log('\n=== 用户筛选功能测试完成 ===');
}

// 主函数
async function main() {
  const token = await loginAdmin();
  if (!token) {
    console.error('无法获取管理员token，测试终止');
    return;
  }

  await testUserFilters(token);
}

// 运行测试
main().catch(console.error); 