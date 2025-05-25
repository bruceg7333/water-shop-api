const Product = require('./src/models/product');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('数据库连接成功');
  
  // 清空现有商品数据
  await Product.deleteMany({});
  console.log('已清空现有商品数据');
  
  // 创建测试商品数据
  const testProducts = [
    {
      name: 'SPRINKLE 纯净水',
      description: '来自高山冰川，纯净甘甜，适合全家饮用',
      price: 2.50,
      imageUrl: '/assets/images/products/sprinkle-pure.jpg',
      sales: 1200,
      stock: 150,
      tag: '热销',
      category: '纯净水',
      isActive: true,
      rating: 4.8,
      ratingsCount: 156
    },
    {
      name: 'SPRINKLE 矿泉水',
      description: '富含天然矿物质，口感清爽，健康之选',
      price: 3.00,
      imageUrl: '/assets/images/products/sprinkle-mineral.jpg',
      sales: 980,
      stock: 120,
      tag: '优惠',
      category: '矿泉水',
      isActive: true,
      rating: 4.6,
      ratingsCount: 89
    },
    {
      name: 'SPRINKLE 家庭装纯净水',
      description: '大容量家庭装，经济实惠，满足全家需求',
      price: 8.80,
      imageUrl: '/assets/images/products/sprinkle-family.jpg',
      sales: 650,
      stock: 80,
      tag: '新品',
      category: '家庭装',
      isActive: true,
      rating: 4.7,
      ratingsCount: 45
    },
    {
      name: 'SPRINKLE 天然矿物质水',
      description: '精选优质水源，保留天然矿物质，口感纯正',
      price: 2.80,
      imageUrl: '/assets/images/products/sprinkle-natural.jpg',
      sales: 420,
      stock: 200,
      tag: '',
      category: '矿泉水',
      isActive: true,
      rating: 4.5,
      ratingsCount: 32
    },
    {
      name: 'SPRINKLE 婴幼儿专用水',
      description: '专为婴幼儿设计，低钠配方，安全放心',
      price: 4.50,
      imageUrl: '/assets/images/products/sprinkle-baby.jpg',
      sales: 280,
      stock: 60,
      tag: '限量',
      category: '纯净水',
      isActive: true,
      rating: 4.9,
      ratingsCount: 78
    },
    {
      name: 'SPRINKLE 苏打水',
      description: '天然苏打水，弱碱性，有助于身体酸碱平衡',
      price: 3.50,
      imageUrl: '/assets/images/products/sprinkle-soda.jpg',
      sales: 320,
      stock: 90,
      tag: '',
      category: '矿泉水',
      isActive: true,
      rating: 4.4,
      ratingsCount: 25
    },
    {
      name: 'SPRINKLE 运动补水',
      description: '专为运动人群设计，快速补充水分和电解质',
      price: 4.00,
      imageUrl: '/assets/images/products/sprinkle-sport.jpg',
      sales: 180,
      stock: 70,
      tag: '新品',
      category: '矿泉水',
      isActive: true,
      rating: 4.3,
      ratingsCount: 18
    },
    {
      name: 'SPRINKLE 桶装水 18.9L',
      description: '大容量桶装水，适合办公室和家庭使用',
      price: 15.00,
      imageUrl: '/assets/images/products/sprinkle-bucket.jpg',
      sales: 450,
      stock: 40,
      tag: '热销',
      category: '家庭装',
      isActive: true,
      rating: 4.6,
      ratingsCount: 67
    }
  ];
  
  const createdProducts = await Product.insertMany(testProducts);
  console.log('成功创建', createdProducts.length, '个测试商品');
  
  // 显示创建的商品信息
  createdProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} - ¥${product.price} - 库存:${product.stock}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('数据库连接失败:', err);
  process.exit(1);
}); 