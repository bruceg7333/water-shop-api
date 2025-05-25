const Product = require('./src/models/product');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/water-shop').then(async () => {
  console.log('=== 数据库商品数据 ===');
  const products = await Product.find().limit(2);
  console.log('商品数量:', await Product.countDocuments());
  console.log('样本数据:');
  products.forEach((p, i) => {
    console.log(`${i+1}. ID: ${p._id}`);
    console.log(`   名称: ${p.name}`);
    console.log(`   价格: ${p.price}`);
    console.log(`   分类: ${p.category}`);
    console.log(`   状态: ${p.isActive}`);
    console.log(`   库存: ${p.stock}`);
    console.log('   完整数据:', JSON.stringify(p, null, 2));
    console.log('---');
  });
  process.exit(0);
}).catch(err => console.error(err)); 