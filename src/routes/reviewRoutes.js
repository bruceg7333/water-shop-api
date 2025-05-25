const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/auth');
const Review = require('../models/review');
const router = express.Router();

// 公开路由 - 获取商品评论
router.get('/product/:productId', reviewController.getProductReviews);

// 需要登录的路由
router.use(protect);

// 创建评论
router.post('/', reviewController.createReview);

// 获取我的评论
router.get('/me', reviewController.getMyReviews);

// 更新、删除我的评论
router.route('/:reviewId')
  .put(reviewController.updateReview)
  .delete(reviewController.deleteReview);

// 点赞评论
router.post('/:reviewId/like', reviewController.likeReview);

// 管理员回复评论
router.put('/:reviewId/reply', authorize('admin'), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replyContent } = req.body;
    
    if (!replyContent) {
      return res.status(400).json({
        success: false,
        message: '回复内容不能为空'
      });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 更新评论回复
    review.reply = {
      content: replyContent,
      replyAt: Date.now()
    };
    review.isReplied = true;
    
    await review.save();
    
    res.status(200).json({
      success: true,
      message: '回复成功',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '回复评论失败',
      error: error.message
    });
  }
});

module.exports = router; 