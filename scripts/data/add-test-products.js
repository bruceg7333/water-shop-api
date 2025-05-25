/**
 * 添加测试商品数据
 * 运行方式: node scripts/add-test-products.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/product');

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB 连接成功');
}).catch(err => {
  console.error('MongoDB 连接错误:', err);
  process.exit(1);
});

// 要添加的商品数据
const products = [
  {
    name: 'SPRINKLE 纯净水 350ml',
    description: '来自高山冰川，纯净甘甜，小容量随身携带方便',
    price: 2.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 1500,
    stock: 500,
    tag: '热销',
    category: 'pure'
  },
  {
    name: 'SPRINKLE 矿泉水 500ml',
    description: '富含矿物质，健康饮用水选择，适合日常饮用',
    price: 2.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 1200,
    stock: 400,
    tag: '优惠',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 山泉水 1L',
    description: '大容量家庭装，经济实惠，适合家庭日常饮用',
    price: 3.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 950,
    stock: 300,
    tag: '新品',
    category: 'pure'
  },
  {
    name: 'SPRINKLE 苏打水 330ml',
    description: '天然矿物质，口感清爽，无糖低卡',
    price: 3.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 800,
    stock: 250,
    tag: '',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 饮用纯净水 1.5L',
    description: '适合婴幼儿饮用，纯净无添加，大容量家庭装',
    price: 4.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 750,
    stock: 200,
    tag: '限量',
    category: 'pure'
  },
  {
    name: 'SPRINKLE 天然矿泉水 2L',
    description: '源自天然矿泉，富含矿物质，大容量实惠装',
    price: 4.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 700,
    stock: 180,
    tag: '',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 气泡水 330ml',
    description: '添加天然气泡，口感独特，适合聚会派对',
    price: 5.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 650,
    stock: 150,
    tag: '新品',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 柠檬味苏打水 330ml',
    description: '添加天然柠檬香味，清爽解渴，夏日必备',
    price: 6.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 600,
    stock: 120,
    tag: '优惠',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 高钙矿泉水 500ml',
    description: '富含天然钙质，适合成长中的儿童和老年人',
    price: 6.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 550,
    stock: 100,
    tag: '热销',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 进口矿泉水 750ml',
    description: '源自欧洲阿尔卑斯山脉，天然矿物质含量高',
    price: 15.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 300,
    stock: 50,
    tag: '限量',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 苹果味气泡水 330ml',
    description: '添加苹果天然香味，无糖低卡，口感清新',
    price: 6.80,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 280,
    stock: 80,
    tag: '新品',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 运动型纯净水 600ml',
    description: '专为运动人士设计，瓶身便于携带，补水更方便',
    price: 3.80,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 450,
    stock: 150,
    tag: '优惠',
    category: 'pure'
  }
];

// 添加商品到数据库
async function addProducts() {
  try {
    // 先删除所有商品
    await Product.deleteMany({});
    console.log('已清空商品数据');

    // 插入新商品
    const result = await Product.insertMany(products);
    console.log(`成功添加 ${result.length} 个商品`);
    
    // 打印按销量排序的前三名热销商品
    const topProducts = await Product.find().sort({ sales: -1 }).limit(3);
    console.log('热销商品Top3:');
    topProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - 销量: ${product.sales}`);
    });
    
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('添加商品失败:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// 执行添加商品函数
addProducts(); 
 * 添加测试商品数据
 * 运行方式: node scripts/add-test-products.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/product');

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB 连接成功');
}).catch(err => {
  console.error('MongoDB 连接错误:', err);
  process.exit(1);
});

// 要添加的商品数据
const products = [
  {
    name: 'SPRINKLE 纯净水 350ml',
    description: '来自高山冰川，纯净甘甜，小容量随身携带方便',
    price: 2.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 1500,
    stock: 500,
    tag: '热销',
    category: 'pure'
  },
  {
    name: 'SPRINKLE 矿泉水 500ml',
    description: '富含矿物质，健康饮用水选择，适合日常饮用',
    price: 2.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 1200,
    stock: 400,
    tag: '优惠',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 山泉水 1L',
    description: '大容量家庭装，经济实惠，适合家庭日常饮用',
    price: 3.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 950,
    stock: 300,
    tag: '新品',
    category: 'pure'
  },
  {
    name: 'SPRINKLE 苏打水 330ml',
    description: '天然矿物质，口感清爽，无糖低卡',
    price: 3.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 800,
    stock: 250,
    tag: '',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 饮用纯净水 1.5L',
    description: '适合婴幼儿饮用，纯净无添加，大容量家庭装',
    price: 4.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 750,
    stock: 200,
    tag: '限量',
    category: 'pure'
  },
  {
    name: 'SPRINKLE 天然矿泉水 2L',
    description: '源自天然矿泉，富含矿物质，大容量实惠装',
    price: 4.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 700,
    stock: 180,
    tag: '',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 气泡水 330ml',
    description: '添加天然气泡，口感独特，适合聚会派对',
    price: 5.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 650,
    stock: 150,
    tag: '新品',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 柠檬味苏打水 330ml',
    description: '添加天然柠檬香味，清爽解渴，夏日必备',
    price: 6.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 600,
    stock: 120,
    tag: '优惠',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 高钙矿泉水 500ml',
    description: '富含天然钙质，适合成长中的儿童和老年人',
    price: 6.50,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 550,
    stock: 100,
    tag: '热销',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 进口矿泉水 750ml',
    description: '源自欧洲阿尔卑斯山脉，天然矿物质含量高',
    price: 15.00,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 300,
    stock: 50,
    tag: '限量',
    category: 'mineral'
  },
  {
    name: 'SPRINKLE 苹果味气泡水 330ml',
    description: '添加苹果天然香味，无糖低卡，口感清新',
    price: 6.80,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 280,
    stock: 80,
    tag: '新品',
    category: 'soda'
  },
  {
    name: 'SPRINKLE 运动型纯净水 600ml',
    description: '专为运动人士设计，瓶身便于携带，补水更方便',
    price: 3.80,
    imageUrl: '/assets/images/products/sprinkle.png',
    sales: 450,
    stock: 150,
    tag: '优惠',
    category: 'pure'
  }
];

// 添加商品到数据库
async function addProducts() {
  try {
    // 先删除所有商品
    await Product.deleteMany({});
    console.log('已清空商品数据');

    // 插入新商品
    const result = await Product.insertMany(products);
    console.log(`成功添加 ${result.length} 个商品`);
    
    // 打印按销量排序的前三名热销商品
    const topProducts = await Product.find().sort({ sales: -1 }).limit(3);
    console.log('热销商品Top3:');
    topProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - 销量: ${product.sales}`);
    });
    
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('添加商品失败:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// 执行添加商品函数
addProducts(); 