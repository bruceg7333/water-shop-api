const mongoose = require('mongoose');
const Administrator = require('./src/models/administrator');
const config = require('./src/config/config');

async function createAdmin() {
  try {
    console.log('🔌 正在连接数据库:', config.mongoURI);
    await mongoose.connect(config.mongoURI);
    console.log('✅ 数据库连接成功');
    
    // 删除现有的管理员
    await Administrator.deleteMany({ username: 'superadmin' });
    console.log('🗑️  清理现有管理员');
    
    // 创建新的超级管理员
    const admin = await Administrator.create({
      username: 'superadmin',
      password: 'admin123456', // 明文密码，会被自动加密
      realName: '超级管理员',
      email: 'admin@waterstation.com',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('✅ 超级管理员创建成功:');
    console.log('   ID:', admin._id);
    console.log('   用户名:', admin.username);
    console.log('   密码哈希长度:', admin.password.length);
    
    // 验证密码
    const isMatch = await admin.matchPassword('admin123456');
    console.log('   密码验证:', isMatch ? '✅ 通过' : '❌ 失败');
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

createAdmin(); 