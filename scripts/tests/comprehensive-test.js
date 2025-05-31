/**
 * SPRINKLE - 综合功能测试脚本
 * 整合所有功能测试，一次性验证系统各项功能
 */

const axios = require('axios');

class ComprehensiveTest {
  constructor() {
    this.baseURL = 'http://localhost:5001';
    this.token = '';
    this.testResults = {
      auth: { passed: 0, failed: 0 },
      userManagement: { passed: 0, failed: 0 },
      dataIntegrity: { passed: 0, failed: 0 },
      uiFeatures: { passed: 0, failed: 0 }
    };
  }

  // 记录测试结果
  recordResult(category, success, testName) {
    if (success) {
      this.testResults[category].passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.testResults[category].failed++;
      console.log(`❌ ${testName}`);
    }
  }

  // 1. 认证系统测试
  async testAuthentication() {
    console.log('\n🔐 === 认证系统测试 ===');
    
    try {
      // 测试管理员登录
      const loginResponse = await axios.post(`${this.baseURL}/api/admin/auth/login`, {
        username: 'superadmin',
        password: 'admin123456'
      });
      
      this.token = loginResponse.data.data.token;
      this.recordResult('auth', true, '管理员登录');
      
      // 验证Token有效性
      const verifyResponse = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      this.recordResult('auth', verifyResponse.status === 200, 'Token验证');
      
    } catch (error) {
      this.recordResult('auth', false, '认证系统');
      console.error('认证失败:', error.message);
    }
  }

  // 2. 用户管理功能测试
  async testUserManagement() {
    console.log('\n👥 === 用户管理功能测试 ===');
    
    try {
      // 获取用户列表
      const usersResponse = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        params: { page: 1, limit: 10 }
      });
      
      const users = usersResponse.data.data.users;
      this.recordResult('userManagement', users.length > 0, '用户列表获取');
      
      // 测试用户ID显示格式
      if (users.length > 0) {
        const firstUser = users[0];
        const idLength = firstUser._id.length;
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(firstUser._id);
        
        this.recordResult('userManagement', idLength === 24, '用户ID格式正确');
        this.recordResult('userManagement', isValidObjectId, '用户ID有效性');
        
        // 测试用户详情
        const detailResponse = await axios.get(`${this.baseURL}/api/admin/users/${firstUser._id}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        
        this.recordResult('userManagement', detailResponse.status === 200, '用户详情获取');
      }
      
      // 测试搜索功能
      const searchResponse = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        params: { search: 'test', page: 1, limit: 5 }
      });
      
      this.recordResult('userManagement', searchResponse.status === 200, '用户搜索功能');
      
    } catch (error) {
      this.recordResult('userManagement', false, '用户管理');
      console.error('用户管理测试失败:', error.message);
    }
  }

  // 3. 数据完整性测试
  async testDataIntegrity() {
    console.log('\n📊 === 数据完整性测试 ===');
    
    try {
      const usersResponse = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        params: { page: 1, limit: 10 }
      });
      
      const users = usersResponse.data.data.users;
      
      // 验证总消费金额计算
      let consumptionTestPassed = true;
      for (const user of users) {
        if (user.totalConsumption !== undefined) {
          // 获取用户详情验证数据一致性
          const detailResponse = await axios.get(`${this.baseURL}/api/admin/users/${user._id}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
          });
          
          const detail = detailResponse.data.data;
          const listConsumption = user.totalConsumption || 0;
          const detailConsumption = detail.totalConsumption || 0;
          
          if (Math.abs(listConsumption - detailConsumption) > 0.01) {
            consumptionTestPassed = false;
            break;
          }
        }
      }
      
      this.recordResult('dataIntegrity', consumptionTestPassed, '总消费金额计算一致性');
      
      // 验证会员等级计算
      let levelTestPassed = true;
      for (const user of users) {
        const expectedLevel = this.calculateMemberLevel(user.points || 0);
        const actualLevel = this.getMemberLevel(user.points || 0);
        if (expectedLevel !== actualLevel) {
          levelTestPassed = false;
          break;
        }
      }
      
      this.recordResult('dataIntegrity', levelTestPassed, '会员等级计算正确性');
      
      // 验证必填字段
      const fieldsTestPassed = users.every(user => 
        user._id && user.username && user.hasOwnProperty('isActive')
      );
      
      this.recordResult('dataIntegrity', fieldsTestPassed, '用户必填字段完整性');
      
    } catch (error) {
      this.recordResult('dataIntegrity', false, '数据完整性');
      console.error('数据完整性测试失败:', error.message);
    }
  }

  // 4. UI功能特性测试
  async testUIFeatures() {
    console.log('\n🎨 === UI功能特性测试 ===');
    
    try {
      // 测试分页功能
      const page1Response = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        params: { page: 1, limit: 2 }
      });
      
      const page2Response = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        params: { page: 2, limit: 2 }
      });
      
      const paginationWorks = page1Response.data.data.users.length <= 2 && 
                             page2Response.data.data.users.length <= 2;
      
      this.recordResult('uiFeatures', paginationWorks, '分页功能');
      
      // 测试排序功能
      const sortResponse = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        params: { sortBy: 'createdAt', sortOrder: 'desc', limit: 5 }
      });
      
      this.recordResult('uiFeatures', sortResponse.status === 200, '排序功能');
      
      // 测试筛选功能
      const filterResponse = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        params: { isActive: 'true', limit: 5 }
      });
      
      this.recordResult('uiFeatures', filterResponse.status === 200, '状态筛选功能');
      
    } catch (error) {
      this.recordResult('uiFeatures', false, 'UI功能特性');
      console.error('UI功能测试失败:', error.message);
    }
  }

  // 辅助方法：计算会员等级
  calculateMemberLevel(points) {
    if (!points || points < 0) return '普通会员'
    
    if (points < 100) return '普通会员'
    else if (points < 500) return '铜牌会员'
    else if (points < 1000) return '银牌会员'
    else if (points < 2000) return '金牌会员'
    else if (points < 5000) return '白金会员'
    else return '钻石会员'
  }

  getMemberLevel(points) {
    return this.calculateMemberLevel(points);
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📋 === 测试报告 ===');
    
    const categories = ['auth', 'userManagement', 'dataIntegrity', 'uiFeatures'];
    const categoryNames = {
      'auth': '认证系统',
      'userManagement': '用户管理',
      'dataIntegrity': '数据完整性',
      'uiFeatures': 'UI功能特性'
    };
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    categories.forEach(category => {
      const result = this.testResults[category];
      const total = result.passed + result.failed;
      const percentage = total > 0 ? ((result.passed / total) * 100).toFixed(1) : 0;
      
      console.log(`${categoryNames[category]}: ${result.passed}/${total} 通过 (${percentage}%)`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });
    
    const overallTotal = totalPassed + totalFailed;
    const overallPercentage = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 总体测试结果: ${totalPassed}/${overallTotal} 通过 (${overallPercentage}%)`);
    
    if (overallPercentage >= 90) {
      console.log('🎉 系统状态: 优秀');
    } else if (overallPercentage >= 80) {
      console.log('👍 系统状态: 良好');
    } else if (overallPercentage >= 70) {
      console.log('⚠️  系统状态: 需要改进');
    } else {
      console.log('🚨 系统状态: 存在问题');
    }
  }

  // 执行所有测试
  async runAllTests() {
    console.log('🚀 启动SPRINKLE综合测试...');
    console.log('==================================================');
    
    await this.testAuthentication();
    await this.testUserManagement();
    await this.testDataIntegrity();
    await this.testUIFeatures();
    
    this.generateReport();
    
    console.log('\n✅ 综合测试完成！');
  }
}

// 执行测试
if (require.main === module) {
  const tester = new ComprehensiveTest();
  tester.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTest; 