const mongoose = require('mongoose');
const Product = require('../src/models/product');

// 直接使用MongoDB URI，避免依赖配置文件
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/water-shop';

// 连接到MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB连接成功:', MONGO_URI);
  updateProductStatus();
})
.catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

async function updateProductStatus() {
  try {
    // 获取所有商品
    const products = await Product.find({});
    
    console.log(`找到${products.length}个商品，开始更新状态...`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // 更新每个商品的状态
    for (const product of products) {
      // 如果已经有状态字段，则跳过
      if (product.status) {
        skippedCount++;
        continue;
      }
      
      // 根据isActive设置状态
      product.status = product.isActive ? '正常' : '下架';
      
      // 保存更新
      await product.save();
      updatedCount++;
    }
    
    console.log(`更新完成！已更新${updatedCount}个商品，跳过${skippedCount}个已有状态的商品。`);
    
    // 检查库存为0的商品
    const zeroStockProducts = await Product.find({ stock: 0, status: '正常' });
    if (zeroStockProducts.length > 0) {
      console.log(`发现${zeroStockProducts.length}个库存为0的商品，将其状态更新为"缺货"...`);
      
      for (const product of zeroStockProducts) {
        product.status = '缺货';
        await product.save();
      }
      
      console.log(`已将${zeroStockProducts.length}个库存为0的商品状态更新为"缺货"`);
    }
    
    // 关闭连接
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('更新商品状态失败:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 