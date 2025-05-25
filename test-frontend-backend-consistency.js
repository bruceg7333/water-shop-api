const Product = require('./src/models/product');
const mongoose = require('mongoose');

async function testDataConsistency() {
  try {
    await mongoose.connect('mongodb://localhost:27017/water-shop');
    
    console.log('=== 前后端数据一致性测试 ===');
    
    // 获取数据库中的商品数据
    const products = await Product.find().limit(3);
    
    console.log('数据库原始数据:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   分类: ${product.category}`);
      console.log(`   价格: ${product.price}`);
      console.log(`   状态: ${product.isActive}`);
      console.log(`   库存: ${product.stock}`);
      console.log('---');
    });
    
    console.log('\n前端期望的数据格式:');
    products.forEach((product, index) => {
      const frontendFormat = {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.imageUrl || '/assets/images/products/default.png',
        category: product.category,
        stock: product.stock,
        sales: product.sales,
        tag: product.tag,
        status: product.isActive ? 'on' : 'off',
        createdAt: new Date(product.createdAt).toLocaleString('zh-CN'),
        isActive: product.isActive,
        rating: product.rating || 0,
        ratingsCount: product.ratingsCount || 0
      };
      
      console.log(`${index + 1}. ${frontendFormat.name}`);
      console.log(`   ID: ${frontendFormat.id}`);
      console.log(`   分类: ${frontendFormat.category}`);
      console.log(`   价格: ${frontendFormat.price}`);
      console.log(`   状态: ${frontendFormat.status}`);
      console.log(`   库存: ${frontendFormat.stock}`);
      console.log('---');
    });
    
    console.log('\n分类映射测试:');
    const categoryMap = {
      'pure': '纯净水',
      'mineral': '矿泉水',
      'soda': '气泡水',
      'family': '家庭装'
    };
    
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    uniqueCategories.forEach(category => {
      console.log(`${category} -> ${categoryMap[category] || category || '未知'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDataConsistency(); 