const mongoose = require('mongoose');
const User = require('./src/models/user');
const Product = require('./src/models/product');
const Cart = require('./src/models/cart');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/water-shop');

// 主函数
const main = async () => {
  try {
    console.log('正在连接数据库...');
    
    // 清空所有购物车数据
    const deletedCount = await Cart.deleteMany({});
    console.log(`删除了 ${deletedCount.deletedCount} 个购物车记录`);
    
    // 获取微信用户
    const wxUser = await User.findOne({ username: 'wx_user_820198' });
    if (!wxUser) {
      console.error('未找到微信用户');
      return;
    }
    
    console.log(`找到用户: ${wxUser.nickName} (${wxUser.username})`);
    
    // 获取所有商品
    const products = await Product.find();
    if (products.length === 0) {
      console.error('未找到商品数据');
      return;
    }
    
    console.log(`找到 ${products.length} 个商品`);
    
    // 随机选择2个不同的商品
    const selectedProducts = [];
    const usedIndices = new Set();
    
    while (selectedProducts.length < 2 && selectedProducts.length < products.length) {
      const randomIndex = Math.floor(Math.random() * products.length);
      
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        const product = products[randomIndex];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5个
        
        selectedProducts.push({
          product: product._id,
          quantity: quantity,
          price: product.price
        });
        
        console.log(`选择商品: ${product.name} x${quantity} (¥${product.price})`);
      }
    }
    
    // 创建购物车
    if (selectedProducts.length > 0) {
      const newCart = new Cart({
        user: wxUser._id,
        items: selectedProducts
      });
      
      await newCart.save();
      console.log(`成功为用户 ${wxUser.nickName} 创建购物车，包含 ${selectedProducts.length} 个商品`);
      
      // 计算总数量和总价
      const totalQuantity = selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = selectedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      console.log(`购物车总计：${totalQuantity} 件商品，总价 ¥${totalPrice.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('生成购物车数据失败:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
};

// 运行脚本
main(); 