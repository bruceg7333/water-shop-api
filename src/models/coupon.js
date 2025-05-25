const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '优惠券名称不能为空'],
    trim: true
  },
  code: {
    type: String,
    required: [true, '优惠码不能为空'],
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, '优惠券类型不能为空']
  },
  // 保存前端原始类型信息
  frontendType: {
    type: String,
    enum: ['percentage', 'discount', 'free'],
    default: function() {
      return this.type === 'percentage' ? 'percentage' : 'discount';
    }
  },
  amount: {
    type: Number,
    required: [true, '优惠金额不能为空'],
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, '优惠券结束日期不能为空']
  },
  limit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 计算优惠金额
couponSchema.methods.calculateDiscount = function(cartTotal) {
  // 检查最低消费要求
  if (cartTotal < this.minPurchase) {
    return 0;
  }
  
  let discount = 0;
  
  if (this.type === 'percentage') {
    // 百分比折扣
    discount = (cartTotal * this.amount) / 100;
    
    // 检查最大折扣限制
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.type === 'fixed') {
    // 固定金额折扣
    discount = this.amount;
    
    // 确保折扣不超过购物车总额
    if (discount > cartTotal) {
      discount = cartTotal;
    }
  }
  
  return discount;
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon; 