const Favorite = require('../models/favorite');
const Product = require('../models/product');

// 获取用户的收藏列表
exports.getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 获取用户收藏总数
    const total = await Favorite.countDocuments({ user: req.user.id });
    
    // 获取收藏列表并填充商品信息
    const favorites = await Favorite.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: 'product',
        select: 'name price imageUrl category tag stock isActive status description sales'
      });
    
    // 处理每个收藏项，标记不可用的商品（不存在或已下架）
    const processedFavorites = favorites.map(favorite => {
      // 检查商品是否存在
      const productExists = favorite.product !== null && favorite.product !== undefined;
      
      // 设置商品可用状态
      let productStatus = 'unavailable'; // 默认不可用
      
      if (productExists) {
        // 根据商品状态设置
        if (favorite.product.status === '正常' && favorite.product.isActive && favorite.product.stock > 0) {
          productStatus = 'normal'; // 正常
        } else if (favorite.product.status === '预售') {
          productStatus = 'presale'; // 预售
        } else if (favorite.product.status === '缺货' || favorite.product.stock === 0) {
          productStatus = 'out_of_stock'; // 缺货
        } else if (favorite.product.status === '下架' || !favorite.product.isActive) {
          productStatus = 'discontinued'; // 下架
        }
      }
      
      // 返回处理后的收藏项
      return {
        ...favorite.toObject(),
        productStatus
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        favorites: processedFavorites
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败',
      error: error.message
    });
  }
};

// 添加商品到收藏
exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    
    // 验证商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      user: req.user.id,
      product: productId
    });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: '已收藏该商品'
      });
    }
    
    // 创建收藏记录
    const favorite = await Favorite.create({
      user: req.user.id,
      product: productId
    });
    
    res.status(201).json({
      success: true,
      message: '商品已收藏',
      data: favorite
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '收藏商品失败',
      error: error.message
    });
  }
};

// 检查商品是否已被收藏
exports.checkFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const favorite = await Favorite.findOne({
      user: req.user.id,
      product: productId
    });
    
    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查收藏状态失败',
      error: error.message
    });
  }
};

// 移除收藏
exports.removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    console.log('尝试删除收藏 - 用户ID:', userId, '商品ID:', productId);
    
    // 检查productId是否有效
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '无效的商品ID'
      });
    }
    
    // 尝试查找收藏记录，允许一定的灵活性
    let result;
    
    try {
      // 首先尝试使用MongoDB ObjectId
      const mongoose = require('mongoose');
      const ObjectId = mongoose.Types.ObjectId;
      
      // 检查productId是否是有效的ObjectId格式
      let productObjectId;
      try {
        // 如果可以转换成ObjectId，则使用ObjectId查询
        if (ObjectId.isValid(productId)) {
          productObjectId = new ObjectId(productId);
          result = await Favorite.findOneAndDelete({
            user: userId,
            product: productObjectId
          });
        }
      } catch (e) {
        console.log('无法将productId转换为ObjectId:', e.message);
      }
      
      // 如果使用ObjectId未找到记录，尝试使用字符串形式
      if (!result) {
        console.log('尝试使用字符串形式的ID查找');
        result = await Favorite.findOneAndDelete({
          user: userId,
          product: productId.toString()
        });
      }
      
      // 记录查询结果
      console.log('查询结果:', result ? '找到记录' : '未找到记录');
    } catch (error) {
      console.error('删除收藏时出错:', error);
    }
    
    if (!result) {
      // 如果仍然找不到记录，尝试查询所有用户收藏记录并打印出来以进行调试
      const allFavorites = await Favorite.find({ user: userId }).select('product').lean();
      console.log('该用户所有收藏记录:', allFavorites);
      
      return res.status(404).json({
        success: false,
        message: '未找到收藏记录'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '已取消收藏'
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '取消收藏失败',
      error: error.message
    });
  }
}; 