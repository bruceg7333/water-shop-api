const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, '请提供评分'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, '请填写评价内容'],
    trim: true
  },
  images: [String], // 评价图片，可选
  likes: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isReplied: {
    type: Boolean,
    default: false
  },
  reply: {
    content: String,
    replyAt: Date
  }
}, {
  timestamps: true
});

// 一个用户只能对同一订单中的同一产品评价一次
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// 添加产品评分信息到产品模型
reviewSchema.statics.calcProductRatings = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    { 
      $group: { 
        _id: '$product', 
        avgRating: { $avg: '$rating' },
        ratingsCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: stats[0].avgRating.toFixed(1),
      ratingsCount: stats[0].ratingsCount
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: 0,
      ratingsCount: 0
    });
  }
};

// 保存后计算产品评分
reviewSchema.post('save', function() {
  this.constructor.calcProductRatings(this.product);
});

// 更新后计算产品评分
reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await doc.constructor.calcProductRatings(doc.product);
  }
});

// 删除后计算产品评分
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.calcProductRatings(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 