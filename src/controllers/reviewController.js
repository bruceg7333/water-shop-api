const Review = require('../models/review');
const Product = require('../models/product');
const Order = require('../models/order');
const mongoose = require('mongoose');

// 获取商品评论列表
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 5, sort = 'newest' } = req.query;
    
    // 验证商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 构建排序条件
    let sortOption = {};
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { rating: -1 };
    } else if (sort === 'lowest') {
      sortOption = { rating: 1 };
    } else if (sort === 'likes') {
      sortOption = { likes: -1 };
    }
    
    // 获取评论总数
    const total = await Review.countDocuments({ product: productId });
    
    // 获取评论列表
    const reviews = await Review.find({ product: productId })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: 'user',
        select: 'nickName avatar'
      });
    
    // 处理匿名评论
    const processedReviews = reviews.map(review => {
      const reviewObj = review.toObject();
      if (reviewObj.isAnonymous) {
        reviewObj.user = {
          nickName: '匿名用户',
          avatar: '/assets/images/avatar/anonymous.png'
        };
      }
      return reviewObj;
    });
    
    // 获取评分统计
    let ratingStats = [];
    try {
      ratingStats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        { 
          $group: { 
            _id: '$rating', 
            count: { $sum: 1 } 
          }
        },
        { $sort: { _id: -1 } }
      ]);
    } catch (error) {
      console.error('获取评分统计失败:', error);
      // 出错时使用空数组，但不中断主流程
    }
    
    // 格式化评分统计
    const ratings = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
    if (ratingStats && ratingStats.length) {
      ratingStats.forEach(stat => {
        if (stat && stat._id) {
          ratings[stat._id] = stat.count;
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        ratings,
        average: product.rating || 0,
        ratingsCount: product.ratingsCount || 0,
        reviews: processedReviews
      }
    });
  } catch (error) {
    console.error('获取商品评论失败:', error);
    res.status(500).json({
      success: false,
      message: '获取商品评论失败',
      error: error.message
    });
  }
};

// 创建商品评论
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment, isAnonymous = false, images = [] } = req.body;
    
    // 验证商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 验证订单是否存在并且属于当前用户
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      status: 'completed' // 只允许对已完成的订单评价
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在或未完成'
      });
    }
    
    // 验证用户是否已经评价过该订单中的该商品
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId,
      order: orderId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '您已经评价过该商品'
      });
    }
    
    // 创建评论
    const review = await Review.create({
      user: req.user.id,
      product: productId,
      order: orderId,
      rating,
      comment,
      isAnonymous,
      images
    });
    
    res.status(201).json({
      success: true,
      message: '评价提交成功',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交评价失败',
      error: error.message
    });
  }
};

// 获取我的评论列表
exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 获取用户评论总数
    const total = await Review.countDocuments({ user: req.user.id });
    
    // 获取评论列表
    const reviews = await Review.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: 'product',
        select: 'name price imageUrl'
      });
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取我的评论失败',
      error: error.message
    });
  }
};

// 更新评论
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, isAnonymous, images } = req.body;
    
    // 查找评论
    const review = await Review.findOne({
      _id: reviewId,
      user: req.user.id
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评论不存在或无权限修改'
      });
    }
    
    // 只允许修改创建后24小时内的评论
    const now = new Date();
    const createdAt = new Date(review.createdAt);
    const timeDiff = now - createdAt;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(400).json({
        success: false,
        message: '只能修改24小时内发表的评论'
      });
    }
    
    // 更新评论
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        rating,
        comment,
        isAnonymous,
        images
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: '评论更新成功',
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新评论失败',
      error: error.message
    });
  }
};

// 删除评论
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // 查找并删除评论
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: req.user.id
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评论不存在或无权限删除'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '评论已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除评论失败',
      error: error.message
    });
  }
};

// 点赞评论
exports.likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 增加点赞数
    review.likes += 1;
    await review.save();
    
    res.status(200).json({
      success: true,
      message: '点赞成功',
      data: {
        likes: review.likes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '点赞失败',
      error: error.message
    });
  }
}; 