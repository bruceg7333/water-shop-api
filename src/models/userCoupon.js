const mongoose = require('mongoose');

const userCouponSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

// 一个用户不能拥有多个相同的优惠券
userCouponSchema.index({ user: 1, coupon: 1 }, { unique: true });

const UserCoupon = mongoose.model('UserCoupon', userCouponSchema);

module.exports = UserCoupon; 