 
const mongoose = require('mongoose');
const Administrator = require('../src/models/Administrator');
const connectDB = require('../src/config/database');

// 恢复超级管理员状态
const restoreSuperAdmin = async () => {
  try {
    console.log('开始恢复超级管理员状态...');
    
    // 查找所有超级管理员
    const superAdmins = await Administrator.find({ role: 'super_admin' });
    console.log(`找到 ${superAdmins.length} 个超级管理员账号`);
    
    if (superAdmins.length === 0) {
      console.log('未找到超级管理员账号！');
      return;
    }
    
    // 恢复所有超级管理员的状态
    const result = await Administrator.updateMany(
      { role: 'super_admin' },
      { 
        $set: { 
          isActive: true 
        } 
      }
    );
    
    console.log(`成功恢复 ${result.modifiedCount} 个超级管理员账号的状态`);
    
    // 显示恢复后的超级管理员信息
    const restoredAdmins = await Administrator.find({ role: 'super_admin' });
    console.log('\n恢复后的超级管理员信息：');
    restoredAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. 用户名: ${admin.username}, 真实姓名: ${admin.realName}, 状态: ${admin.isActive ? '启用' : '禁用'}`);
    });
    
  } catch (error) {
    console.error('恢复超级管理员状态失败:', error);
  }
};

// 主函数
const main = async () => {
  await connectDB();
  await restoreSuperAdmin();
  
  console.log('\n脚本执行完成，正在关闭数据库连接...');
  await mongoose.connection.close();
  process.exit(0);
};

// 执行脚本
main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});