const mongoose = require('mongoose');
const Product = require('../models/product');
const dotenv = require('dotenv');
const connectDB = require('../config/database');

// 加载环境变量
dotenv.config();

// 初始商品数据
const products = [
  {
    name: 'SPRINKLE 纯净水',
    description: '来自高山冰川，纯净甘甜',
    price: 2.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 1000,
    stock: 100,
    tag: '热销',
    category: '纯净水'
  },
  {
    name: 'SPRINKLE 矿泉水',
    description: '富含矿物质，健康饮用水选择',
    price: 2.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 800,
    stock: 100,
    tag: '优惠',
    category: '矿泉水'
  },
  {
    name: 'SPRINKLE 家庭装',
    description: '大容量家庭装，经济实惠',
    price: 1.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 600,
    stock: 100,
    tag: '新品',
    category: '家庭装'
  },
  {
    name: 'SPRINKLE 天然矿物质水',
    description: '天然矿物质，口感清爽',
    price: 1.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 500,
    stock: 100,
    category: '矿泉水'
  }
];

// 数据初始化函数
const importData = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    console.log('正在清空现有数据...');
    // 先清空原有数据
    await Product.deleteMany({});
    
    console.log('正在插入测试数据...');
    // 插入新数据
    await Product.insertMany(products);
    
    console.log('数据初始化成功');
    process.exit(0);
  } catch (error) {
    console.error('数据初始化失败:', error);
    process.exit(1);
  }
};

// 执行导入
importData(); 