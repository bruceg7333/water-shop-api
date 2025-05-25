const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: String,
  imageUrl: String,
  spec: String,
  selected: {
    type: Boolean,
    default: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 自动计算购物车总价和总数量
cartSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalPrice = this.items.reduce((sum, item) => 
      sum + (item.selected ? (item.price * item.quantity) : 0), 0);
    this.totalItems = this.items.reduce((sum, item) => 
      sum + (item.selected ? item.quantity : 0), 0);
  } else {
    this.totalPrice = 0;
    this.totalItems = 0;
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 