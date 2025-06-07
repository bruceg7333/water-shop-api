const Cart = require('../models/cart');
const Product = require('../models/product');

// 获取用户购物车
exports.getCart = async (req, res) => {
  try {
    console.log('获取购物车请求，用户ID:', req.user.id);
    
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name price imageUrl stock'
    });

    // 如果购物车不存在，创建一个空购物车
    if (!cart) {
      console.log('用户购物车不存在，创建新购物车');
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }

    // 打印购物车数据以便调试
    console.log('购物车数据:', JSON.stringify(cart));

    // 转换数据格式，确保_id转为id
    // 安全地使用toObject
    const cartObj = cart.toObject ? cart.toObject() : JSON.parse(JSON.stringify(cart));
    
    const formattedCart = {
      ...cartObj,
      id: cartObj._id,
      items: (cartObj.items || []).map(item => {
        const itemObj = item.toObject ? item.toObject() : item;
        let productObj = null;
        
        if (itemObj.product) {
          productObj = itemObj.product.toObject ? 
            itemObj.product.toObject() : 
            itemObj.product;
            
          productObj.id = productObj._id;
        }
        
        return {
          ...itemObj,
          id: itemObj._id,
          product: productObj
        };
      })
    };

    console.log('格式化后的购物车数据:', JSON.stringify(formattedCart));

    res.status(200).json({
      success: true,
      data: formattedCart
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    res.status(500).json({
      success: false,
      message: '获取购物车失败',
      error: error.message
    });
  }
};

// 添加商品到购物车
exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1, spec } = req.body;

    // 验证商品
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    // 验证库存
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: '商品库存不足'
      });
    }

    // 获取用户购物车
    let cart = await Cart.findOne({ user: req.user.id });

    // 如果购物车不存在，创建一个新的
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }

    // 检查商品是否已在购物车中（考虑规格）
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && 
              (!spec || item.spec === spec)  // 如果有规格，也需要匹配规格
    );

    if (existingItemIndex > -1) {
      // 商品已存在，更新数量
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // 添加新商品到购物车
      const cartItem = {
        product: productId,
        quantity,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl || (product.images && product.images[0])
      };
      
      // 如果有规格，添加规格信息
      if (spec) {
        cartItem.spec = spec;
      }
      
      cart.items.push(cartItem);
    }

    // 保存购物车
    await cart.save();

    res.status(200).json({
      success: true,
      message: '商品已添加到购物车',
      data: cart
    });
  } catch (error) {
    console.error('添加购物车错误:', error);
    res.status(500).json({
      success: false,
      message: '添加商品到购物车失败',
      error: error.message
    });
  }
};

// 更新购物车商品数量
exports.updateItemQuantity = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    // 验证数量
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '商品数量必须大于0'
      });
    }

    // 获取用户购物车
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '购物车不存在'
      });
    }

    // 查找商品
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '购物车中没有此商品'
      });
    }

    // 检查库存
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: '商品库存不足'
      });
    }

    // 更新数量
    item.quantity = quantity;

    // 保存购物车
    await cart.save();

    res.status(200).json({
      success: true,
      message: '商品数量已更新',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新商品数量失败',
      error: error.message
    });
  }
};

// 从购物车删除商品
exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // 获取用户购物车
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '购物车不存在'
      });
    }

    // 查找并删除商品
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '购物车中没有此商品'
      });
    }

    // 删除商品
    cart.items.splice(itemIndex, 1);

    // 保存购物车
    await cart.save();

    res.status(200).json({
      success: true,
      message: '商品已从购物车删除',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '从购物车删除商品失败',
      error: error.message
    });
  }
};

// 清空购物车
exports.clearCart = async (req, res) => {
  try {
    // 获取用户购物车
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '购物车不存在'
      });
    }

    // 清空购物车
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: '购物车已清空',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清空购物车失败',
      error: error.message
    });
  }
};

// 获取临时购物车数据
exports.getTempCart = async (req, res) => {
  try {
    const { items } = req.query;
    
    // 如果没有传递商品ID，返回空数组
    if (!items) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          totalPrice: 0,
          totalItems: 0
        }
      });
    }
    
    // 解析本地购物车数据
    let cartItems = [];
    try {
      cartItems = JSON.parse(items);
      
      // 确保items是数组
      if (!Array.isArray(cartItems)) {
        cartItems = [];
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: '无效的购物车数据格式'
      });
    }
    
    // 获取商品详情
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({
      _id: { $in: productIds }
    }).select('_id name price imageUrl stock');
    
    // 将商品详情添加到本地购物车项目中
    const populatedCartItems = cartItems.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      
      if (!product) {
        return null; // 如果商品不存在，返回null
      }
      
      // 检查库存
      const inStock = item.quantity <= product.stock;
      
      return {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock
        },
        quantity: item.quantity,
        price: product.price,
        inStock
      };
    }).filter(Boolean); // 过滤掉null项
    
    // 计算总价和总数量，修复浮点数精度问题
    const rawTotalPrice = populatedCartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    const totalPrice = Math.round(rawTotalPrice * 100) / 100;
    
    const totalItems = populatedCartItems.reduce(
      (sum, item) => sum + item.quantity, 
      0
    );
    
    // 返回临时购物车数据
    res.status(200).json({
      success: true,
      data: {
        items: populatedCartItems,
        totalPrice,
        totalItems
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取临时购物车数据失败',
      error: error.message
    });
  }
};

// 同步临时购物车到用户账户
exports.syncCart = async (req, res) => {
  try {
    const { localCart } = req.body;
    
    // 验证本地购物车数据
    if (!localCart || !Array.isArray(localCart)) {
      return res.status(400).json({
        success: false,
        message: '无效的购物车数据'
      });
    }
    
    // 获取用户购物车
    let userCart = await Cart.findOne({ user: req.user.id });
    
    // 如果用户没有购物车，创建一个新的
    if (!userCart) {
      userCart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }
    
    // 从本地购物车中验证并提取商品
    const productIds = localCart.map(item => item.productId);
    const products = await Product.find({
      _id: { $in: productIds }
    });
    
    // 合并本地购物车和用户购物车
    for (const localItem of localCart) {
      // 查找商品
      const product = products.find(p => p._id.toString() === localItem.productId);
      
      // 如果商品不存在或数量无效，跳过
      if (!product || localItem.quantity < 1) {
        continue;
      }
      
      // 检查库存
      const quantity = Math.min(localItem.quantity, product.stock);
      
      // 查找购物车中是否已存在该商品
      const existingItemIndex = userCart.items.findIndex(
        item => item.product.toString() === localItem.productId
      );
      
      if (existingItemIndex > -1) {
        // 商品已存在，更新数量
        userCart.items[existingItemIndex].quantity += quantity;
        // 确保不超过库存
        userCart.items[existingItemIndex].quantity = Math.min(
          userCart.items[existingItemIndex].quantity,
          product.stock
        );
      } else {
        // 添加新商品到购物车
        userCart.items.push({
          product: localItem.productId,
          quantity,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl
        });
      }
    }
    
    // 保存更新后的购物车
    await userCart.save();
    
    // 返回更新后的购物车
    const populatedCart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name price imageUrl stock'
    });
    
    res.status(200).json({
      success: true,
      message: '购物车同步成功',
      data: populatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '同步购物车失败',
      error: error.message
    });
  }
};

// 获取购物车商品数量
exports.getCartCount = async (req, res) => {
  try {
    // 获取用户ID
    const userId = req.user ? req.user.id : null;
    
    // 如果用户未登录，返回0
    if (!userId) {
      return res.status(200).json({
        success: true,
        data: { count: 0 }
      });
    }
    
    // 查找用户购物车
    const cart = await Cart.findOne({ user: userId });
    
    // 如果购物车不存在，返回0
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { count: 0 }
      });
    }
    
    // 计算购物车中的商品总数量
    const count = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取购物车数量错误:', error);
    res.status(500).json({
      success: false,
      message: '获取购物车数量失败',
      error: error.message
    });
  }
}; 