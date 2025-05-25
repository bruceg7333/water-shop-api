const mongoose = require('mongoose');
const Product = require('../models/product');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/water-shop')
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败', err));

// 更新商品数据
const updateProducts = async () => {
  try {
    // 获取所有商品
    const products = await Product.find({});
    
    // 如果没有商品，提示用户
    if (products.length === 0) {
      console.log('没有找到任何商品数据');
      process.exit(0);
    }
    
    console.log(`找到 ${products.length} 个商品，开始更新...`);
    
    // 更新第一个商品
    const product1 = products[0];
    product1.name = '【新】SPRINKLE 高山冰川纯净水';
    product1.description = '来自高山冰川，纯净甘甜，现已升级配方';
    product1.price = 2.5;  // 提高价格
    product1.sales = 1200; // 增加销量
    await product1.save();
    console.log(`已更新商品: ${product1.name}`);
    
    // 更新第二个商品
    if (products.length > 1) {
      const product2 = products[1];
      product2.name = '【特惠】SPRINKLE 矿物质水';
      product2.description = '富含多种天然矿物质，更健康的饮用水选择';
      product2.tag = '优惠';  // 修改标签为有效的枚举值
      product2.price = 1.8;  // 降低价格
      await product2.save();
      console.log(`已更新商品: ${product2.name}`);
    }
    
    // 更新第三个商品
    if (products.length > 2) {
      const product3 = products[2];
      product3.name = 'SPRINKLE 5L家庭装';
      product3.stock = 50;  // 减少库存
      await product3.save();
      console.log(`已更新商品: ${product3.name}`);
    }
    
    // 更新第四个商品
    if (products.length > 3) {
      const product4 = products[3];
      product4.name = 'SPRINKLE 儿童专用矿物质水';
      product4.description = '专为儿童设计，低钠配方，添加适量矿物质';
      product4.tag = '新品';  // 添加标签
      await product4.save();
      console.log(`已更新商品: ${product4.name}`);
    }
    
    console.log('所有商品更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('更新商品数据失败:', error);
    process.exit(1);
  }
};

// 执行更新
updateProducts(); 