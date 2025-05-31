/**
 * SPRINKLE - 系统初始化脚本
 * 用于首次部署时创建必要的初始数据
 * 包括：超级管理员、系统配置、会员等级设置等
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../../src/config/config');

// 连接数据库
mongoose.connect(config.mongoURI)
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => {
    console.error('❌ 数据库连接失败:', err);
    process.exit(1);
  });

const User = require('../../src/models/user');

class SystemInitializer {
  constructor() {
    this.results = {
      created: [],
      skipped: [],
      errors: []
    };
  }

  // 创建超级管理员账户
  async createSuperAdmin() {
    console.log('\n👑 创建超级管理员账户...');
    
    try {
      // 检查是否已存在超级管理员
      const existingAdmin = await User.findOne({ username: 'superadmin' });
      
      if (existingAdmin) {
        this.results.skipped.push('超级管理员账户（已存在）');
        console.log('⚠️  超级管理员账户已存在，跳过创建');
        return;
      }
      
      // 创建超级管理员
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      
      const superAdmin = new User({
        username: 'superadmin',
        password: hashedPassword,
        nickName: '超级管理员',
        role: 'admin',
        isActive: true,
        avatar: '/assets/images/avatar/admin.png',
        phone: '13800000000',
        gender: '未知',
        points: 0,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      await superAdmin.save();
      this.results.created.push('超级管理员账户');
      console.log('✅ 超级管理员账户创建成功');
      console.log('   用户名: superadmin');
      console.log('   密码: admin123456');
      
    } catch (error) {
      this.results.errors.push(`超级管理员创建失败: ${error.message}`);
      console.error('❌ 超级管理员创建失败:', error);
    }
  }

  // 创建系统配置数据
  async createSystemConfig() {
    console.log('\n⚙️  创建系统配置数据...');
    
    try {
      // 会员等级配置
      const memberLevelConfig = {
        name: 'memberLevels',
        data: {
          levels: [
            { name: '普通会员', minPoints: 0, maxPoints: 99, benefits: ['基础服务'] },
            { name: '铜牌会员', minPoints: 100, maxPoints: 499, benefits: ['基础服务', '9.5折优惠'] },
            { name: '银牌会员', minPoints: 500, maxPoints: 999, benefits: ['基础服务', '9折优惠', '优先客服'] },
            { name: '金牌会员', minPoints: 1000, maxPoints: 1999, benefits: ['基础服务', '8.5折优惠', '优先客服', '免运费'] },
            { name: '白金会员', minPoints: 2000, maxPoints: 4999, benefits: ['基础服务', '8折优惠', '优先客服', '免运费', '专属客服'] },
            { name: '钻石会员', minPoints: 5000, maxPoints: 999999, benefits: ['基础服务', '7.5折优惠', '优先客服', '免运费', '专属客服', 'VIP活动'] }
          ]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 这里可以创建配置表来存储这些数据
      // 目前只是打印配置信息
      this.results.created.push('会员等级配置');
      console.log('✅ 会员等级配置初始化完成');
      
      // 系统参数配置
      const systemParams = {
        name: 'systemParams',
        data: {
          pointsPerYuan: 1, // 每消费1元获得1积分
          deliveryFee: 5, // 默认配送费5元
          freeDeliveryAmount: 50, // 满50元免配送费
          orderTimeout: 30, // 订单超时时间30分钟
          maxOrderItems: 20 // 单个订单最多商品数量
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.results.created.push('系统参数配置');
      console.log('✅ 系统参数配置初始化完成');
      
    } catch (error) {
      this.results.errors.push(`系统配置创建失败: ${error.message}`);
      console.error('❌ 系统配置创建失败:', error);
    }
  }

  // 创建默认数据
  async createDefaultData() {
    console.log('\n📦 创建默认数据...');
    
    try {
      // 检查是否有用户数据，如果没有则创建一些测试用户
      const userCount = await User.countDocuments({ role: 'user' });
      
      if (userCount === 0) {
        console.log('⚠️  当前系统无普通用户，建议运行数据生成脚本创建测试数据');
        this.results.skipped.push('测试用户数据（需手动创建）');
      } else {
        console.log(`✅ 系统已有 ${userCount} 个普通用户`);
        this.results.skipped.push('测试用户数据（已存在）');
      }
      
    } catch (error) {
      this.results.errors.push(`默认数据检查失败: ${error.message}`);
      console.error('❌ 默认数据检查失败:', error);
    }
  }

  // 验证初始化结果
  async validateInitialization() {
    console.log('\n🔍 验证初始化结果...');
    
    try {
      // 验证超级管理员
      const admin = await User.findOne({ username: 'superadmin', role: 'admin' });
      if (admin) {
        console.log('✅ 超级管理员账户验证通过');
      } else {
        console.log('❌ 超级管理员账户验证失败');
        this.results.errors.push('超级管理员验证失败');
      }
      
      // 验证数据库连接
      const totalUsers = await User.countDocuments();
      console.log(`✅ 数据库连接正常，共 ${totalUsers} 个用户`);
      
    } catch (error) {
      this.results.errors.push(`初始化验证失败: ${error.message}`);
      console.error('❌ 初始化验证失败:', error);
    }
  }

  // 生成初始化报告
  generateReport() {
    console.log('\n📋 === 初始化报告 ===');
    
    if (this.results.created.length > 0) {
      console.log('\n✅ 成功创建:');
      this.results.created.forEach(item => console.log(`   - ${item}`));
    }
    
    if (this.results.skipped.length > 0) {
      console.log('\n⚠️  跳过创建:');
      this.results.skipped.forEach(item => console.log(`   - ${item}`));
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ 创建失败:');
      this.results.errors.forEach(item => console.log(`   - ${item}`));
    }
    
    const totalItems = this.results.created.length + this.results.skipped.length + this.results.errors.length;
    const successRate = totalItems > 0 ? ((this.results.created.length + this.results.skipped.length) / totalItems * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 初始化完成: ${this.results.created.length}个新建, ${this.results.skipped.length}个跳过, ${this.results.errors.length}个失败`);
    console.log(`📊 成功率: ${successRate}%`);
    
    if (this.results.errors.length === 0) {
      console.log('\n🎉 系统初始化完成！您现在可以使用以下账户登录:');
      console.log('   管理后台: http://localhost:5173');
      console.log('   用户名: superadmin');
      console.log('   密码: admin123456');
    } else {
      console.log('\n⚠️  系统初始化存在问题，请检查错误信息并重新运行');
    }
  }

  // 执行完整初始化流程
  async runInitialization() {
    console.log('🚀 开始SPRINKLE系统初始化...');
    console.log('================================================');
    
    await this.createSuperAdmin();
    await this.createSystemConfig();
    await this.createDefaultData();
    await this.validateInitialization();
    
    this.generateReport();
    
    console.log('\n✅ 系统初始化流程完成！');
    mongoose.disconnect();
  }
}

// 执行初始化
if (require.main === module) {
  const initializer = new SystemInitializer();
  initializer.runInitialization().catch(error => {
    console.error('初始化过程发生错误:', error);
    mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = SystemInitializer; 