const Product = require('./src/models/product');
const mongoose = require('mongoose');

// 模拟控制器函数
async function testGetProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/water-shop');
    
    const { limit = 10, page = 1, category, tag, sort } = { page: 1, pageSize: 2 };
    
    // 构建查询条件
    const query = { isActive: true };
    
    // 排序选项 - 默认按创建时间降序
    const sortOption = { createdAt: -1 };
    
    // 查询总数
    const total = await Product.countDocuments(query);
    
    // 分页查询
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const response = {
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        products
      }
    };
    
    console.log('=== 后端API返回格式测试 ===');
    console.log('Response structure:', JSON.stringify(response, null, 2));
    console.log('Products array length:', response.data.products.length);
    console.log('First product sample:', JSON.stringify(response.data.products[0], null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testGetProducts(); 