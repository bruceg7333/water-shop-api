const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '商品名称不能为空'],
    trim: true
  },
  description: {
    type: String,
    required: [true, '商品描述不能为空']
  },
  price: {
    type: Number,
    required: [true, '商品价格不能为空'],
    min: 0
  },
  imageUrl: {
    type: String,
    required: [true, '商品图片不能为空']
  },
  sales: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    required: [true, '库存不能为空'],
    min: 0
  },
  tag: {
    type: String,
    enum: ['热销', '新品', '优惠', '限量', '']
  },
  category: {
    type: String,
    required: [true, '商品分类不能为空']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['正常', '下架', '缺货', '预售'],
    default: '正常'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  allowReviews: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 