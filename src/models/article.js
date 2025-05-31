const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '内容标题不能为空'],
    trim: true
  },
  summary: {
    type: String,
    required: [true, '内容摘要不能为空']
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'article';
    }
  },
  imageUrl: {
    type: String,
    required: [true, '封面图片不能为空']
  },
  videoUrl: {
    type: String,
    required: function() {
      return this.type === 'video';
    }
  },
  type: {
    type: String,
    enum: ['article', 'video'],
    default: 'article',
    required: [true, '内容类型不能为空']
  },
  category: {
    type: String,
    enum: ['health', 'science', 'tips', 'news'],
    required: [true, '内容分类不能为空']
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