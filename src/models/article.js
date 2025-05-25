const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '文章标题不能为空'],
    trim: true
  },
  summary: {
    type: String,
    required: [true, '文章摘要不能为空']
  },
  content: {
    type: String,
    required: [true, '文章内容不能为空']
  },
  imageUrl: {
    type: String,
    required: [true, '文章图片不能为空']
  },
  category: {
    type: String,
    enum: ['health', 'science', 'tips'],
    required: [true, '文章分类不能为空']
  },
  author: {
    type: String,
    default: '水商城编辑部'
  },
  tags: {
    type: [String],
    default: []
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  isPublished: {
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

const Article = mongoose.model('Article', articleSchema);

module.exports = Article; 