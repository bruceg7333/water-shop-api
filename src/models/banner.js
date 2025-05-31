const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
  // 基本信息
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  image: {
    type: String,
    required: true
  },
  
  // 内容类型和目标
  type: {
    type: String,
    required: true,
    enum: ['product', 'category', 'article', 'external'],
    default: 'product'
  },
  
  // 目标配置 - 根据类型不同存储不同内容
  targetProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  targetCategory: {
    type: String, // 产品类别名称
    default: null
  },
  targetArticle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    default: null
  },
  targetUrl: {
    type: String, // 外部链接
    default: null
  },
  
  // 显示控制
  isActive: {
    type: Boolean,
    default: true
  },
  sort: {
    type: Number,
    default: 0
  },
  
  // 时间控制(用于活动类型)
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  
  // 统计信息
  clickCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  
  // 创建信息
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Administrator'
  }
}, {
  timestamps: true
})

// 索引
bannerSchema.index({ isActive: 1, sort: -1 })
bannerSchema.index({ type: 1 })
bannerSchema.index({ startTime: 1, endTime: 1 })

// 虚拟字段：是否在有效期内
bannerSchema.virtual('isInValidPeriod').get(function() {
  if (!this.startTime && !this.endTime) return true
  
  const now = new Date()
  const start = this.startTime || new Date(0)
  const end = this.endTime || new Date('2099-12-31')
  
  return now >= start && now <= end
})

// 虚拟字段：获取目标信息
bannerSchema.virtual('targetInfo').get(function() {
  switch(this.type) {
    case 'product':
      return { id: this.targetProduct, type: 'product' }
    case 'category':
      return { name: this.targetCategory, type: 'category' }
    case 'article':
      return { id: this.targetArticle, type: 'article' }
    case 'external':
      return { url: this.targetUrl, type: 'external' }
    default:
      return null
  }
})

// 静态方法：获取有效的轮播图
bannerSchema.statics.getActiveBanners = function() {
  const now = new Date()
  return this.find({
    isActive: true,
    $or: [
      { startTime: null, endTime: null },
      { startTime: { $lte: now }, endTime: { $gte: now } },
      { startTime: { $lte: now }, endTime: null },
      { startTime: null, endTime: { $gte: now } }
    ]
  })
  .populate('targetProduct', 'name price imageUrl')
  .populate('targetArticle', 'title summary imageUrl')
  .sort({ sort: -1, createdAt: -1 })
}

// 实例方法：增加点击次数
bannerSchema.methods.incrementClick = function() {
  this.clickCount += 1
  return this.save()
}

// 实例方法：增加浏览次数
bannerSchema.methods.incrementView = function() {
  this.viewCount += 1
  return this.save()
}

// 验证方法：确保根据类型设置了正确的目标
bannerSchema.pre('save', function(next) {
  switch(this.type) {
    case 'product':
      if (!this.targetProduct) {
        return next(new Error('产品类型的轮播图必须选择一个产品'))
      }
      this.targetCategory = null
      this.targetArticle = null
      this.targetUrl = null
      break
    case 'category':
      if (!this.targetCategory) {
        return next(new Error('产品类别类型的轮播图必须选择一个产品类别'))
      }
      this.targetProduct = null
      this.targetArticle = null
      this.targetUrl = null
      break
    case 'article':
      if (!this.targetArticle) {
        return next(new Error('文章类型的轮播图必须选择一篇文章'))
      }
      this.targetProduct = null
      this.targetCategory = null
      this.targetUrl = null
      break
    case 'external':
      if (!this.targetUrl) {
        return next(new Error('外部链接类型的轮播图必须输入链接地址'))
      }
      this.targetProduct = null
      this.targetCategory = null
      this.targetArticle = null
      break
  }
  next()
})

module.exports = mongoose.model('Banner', bannerSchema) 