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

// 创建超级管理员
async function createSuperAdmin() {
  try {
    // 检查是否已存在超级管理员
    const existingSuperAdmin = await Administrator.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('⚠️  超级管理员已存在，无需重复创建');
      console.log('用户名:', existingSuperAdmin.username);
      return;
    }

    // 创建超级管理员
    const superAdmin = await Administrator.create({
      username: 'superadmin',
      password: 'admin123456', // 请在生产环境中修改为更安全的密码
      realName: '超级管理员',
      email: 'admin@waterstation.com',
      role: 'super_admin',
      isActive: true
    });

    console.log('🎉 超级管理员创建成功！');
    console.log('==================================');
    console.log('用户名: superadmin');
    console.log('密码: admin123456');
    console.log('真实姓名: 超级管理员');
    console.log('角色: super_admin');
    console.log('==================================');
    console.log('⚠️  请登录SPRINKLE后台后立即修改密码！');

  } catch (error) {
    console.error('❌ 创建超级管理员失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始创建超级管理员账户...');
  
  await connectDB();
  await createSuperAdmin();
  
  console.log('✅ 操作完成');
  process.exit(0);
}

// 执行脚本
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
}); 