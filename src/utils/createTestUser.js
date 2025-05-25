const mongoose = require('mongoose');
const User = require('../models/user');
const dotenv = require('dotenv');
const connectDB = require('../config/database');

// 加载环境变量
dotenv.config();

// 测试用户数据
const testUsers = [
  {
    username: 'testuser',
    password: 'password123',
    phone: '13800138000',
    nickName: '测试用户',
    gender: '男',
    role: 'user',
    points: 100
  },
  {
    username: 'admin',
    password: 'admin123',
    phone: '13900139000',
    nickName: '管理员',
    gender: '男',
    role: 'admin',
    points: 500
  }
];

// 创建测试用户函数
const createTestUsers = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    console.log('检查是否已存在测试用户...');
    // 检查是否已存在同名用户
    const existingUsers = await User.find({ 
      username: { $in: testUsers.map(user => user.username) } 
    });
    
    if (existingUsers.length > 0) {
      console.log('发现已存在的用户:');
      existingUsers.forEach(user => {
        console.log(`- ${user.username} (${user.role})`);
      });
      
      // 询问是否要删除并重新创建
      console.log('这些用户已存在。如果要重新创建，请先手动删除这些用户。');
      console.log('登录信息:');
      testUsers.forEach(user => {
        console.log(`- 用户名: ${user.username}, 密码: ${user.password}, 角色: ${user.role}`);
      });
    } else {
      console.log('正在创建测试用户...');
      // 创建测试用户
      const promises = testUsers.map(userData => User.create(userData));
      await Promise.all(promises);
      
      console.log('测试用户创建成功！可以使用以下账号登录:');
      testUsers.forEach(user => {
        console.log(`- 用户名: ${user.username}, 密码: ${user.password}, 角色: ${user.role}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('创建测试用户失败:', error);
    process.exit(1);
  }
};

// 执行创建
createTestUsers(); 