const mongoose = require('mongoose');

// 订单项模式（订单中的每个商品）
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: String,
  spec: String
});

// 订单模式
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['微信支付', '货到付款'],
    default: '微信支付'
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: Date,
    email: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  // 优惠券相关字段
  usedCoupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCoupon',
    default: null
  },
  // 优惠券信息 - 存储为JSON字符串
  couponInfo: {
    type: String,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: Date,
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: Date,
  canceledAt: Date,
  status: {
    type: String,
    enum: ['pending_payment', 'pending_shipment', 'pending_receipt', 'completed', 'canceled'],
    default: 'pending_payment'
  },
  orderNumber: {
    type: String,
    unique: true
  },
  remark: String
}, {
  timestamps: true
});

// 生成订单号
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // 生成格式为 年月日 + 6位随机数 的订单号
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 900000) + 100000; // 6位随机数
    this.orderNumber = `${year}${month}${day}${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 