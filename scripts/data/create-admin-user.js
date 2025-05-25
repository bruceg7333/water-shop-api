/**
 * 创建管理员用户脚本
 * 
 * 用途：为系统创建一个管理员账户，用于管理后台登录
 * 运行方式：node scripts/create-admin-user.js
 */

const mongoose = require('mongoose');
const User = require('../src/models/user');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-shop')
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => {
    console.error('MongoDB 连接失败', err);
    process.exit(1);
  });

// 管理员用户信息
const adminUser = {
  username: 'admin',
  password: 'admin123',
  nickName: '系统管理员',
  role: 'admin',
  phone: '13800138000',
  isActive: true
};

// 创建管理员用户
const createAdminUser = async () => {
  try {
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username: adminUser.username });
    if (existingUser) {
      console.log('管理员用户已存在，无需创建');
      if (existingUser.role !== 'admin') {
        // 如果用户存在但不是管理员，更新为管理员
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('已将用户升级为管理员权限');
      }
      return;
    }

    // 创建新管理员用户
    const user = await User.create(adminUser);
    console.log('管理员用户创建成功：', user.username);
  } catch (error) {
    console.error('创建管理员用户失败：', error);
  } finally {
    // 关闭数据库连接
    mongoose.disconnect();
  }
};

// 执行创建
createAdminUser(); 