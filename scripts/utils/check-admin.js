const mongoose = require('mongoose');
const Administrator = require('./src/models/administrator');
const config = require('./src/config/config');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 检查并重新创建超级管理员
async function checkAndRecreateAdmin() {
  try {
    // 删除现有的超级管理员
    const deleteResult = await Administrator.deleteMany({ 
      $or: [
        { username: 'superadmin' },
        { role: 'super_admin' }
      ]
    });
    console.log(`🗑️  删除了 ${deleteResult.deletedCount} 个现有管理员账号`);

    // 创建新的超级管理员
    const superAdmin = await Administrator.create({
      username: 'superadmin',
      password: 'admin123456',
      realName: '超级管理员',
      email: 'admin@waterstation.com',
      role: 'super_admin',
      isActive: true
    });

    console.log('🎉 超级管理员重新创建成功！');
    console.log('==================================');
    console.log('用户名: superadmin');
    console.log('密码: admin123456');
    console.log('真实姓名: 超级管理员');
    console.log('角色: super_admin');
    console.log('数据库ID:', superAdmin._id);
    console.log('==================================');

    // 验证密码
    const testPassword = await superAdmin.matchPassword('admin123456');
    console.log('🔐 密码验证结果:', testPassword ? '✅ 通过' : '❌ 失败');

  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始检查和重新创建超级管理员账户...');
  
  await connectDB();
  await checkAndRecreateAdmin();
  
  console.log('✅ 操作完成');
  process.exit(0);
}

// 执行脚本
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
}); 