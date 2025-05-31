const Article = require('../models/article');

// 获取文章列表
exports.getArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = {};
    
    // 如果指定了分类，则按分类筛选
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // 只获取已发布的文章
    query.isPublished = true;
    
    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 获取文章总数
    const total = await Article.countDocuments(query);
    
    // 获取文章列表，按发布日期降序排序
    const articles = await Article.find(query)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title summary imageUrl category publishDate views shares tags');
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        articles: articles.map(article => ({
          id: article._id,
          title: article.title,
          summary: article.summary,
          imageUrl: article.imageUrl,
          category: article.category,
          publishDate: article.publishDate,
          views: article.views,
          shares: article.shares,
          tags: article.tags
        }))
      }
    });
  } catch (error) {
    console.error('获取文章列表出错:', error);
    res.status(500).json({
      success: false,
      message: '获取文章列表出错',
      error: error.message
    });
  }
};

// 获取热门文章（用于首页展示）
exports.getHotArticles = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    // 获取浏览量最高的几篇文章
    const articles = await Article.find({ isPublished: true })
      .sort({ views: -1 })
      .limit(parseInt(limit))
      .select('title imageUrl views shares tags');
    
    res.status(200).json({
      success: true,
      data: {
        articles: articles.map(article => ({
          id: article._id,
          title: article.title,
          imageUrl: article.imageUrl,
          views: article.views,
          shares: article.shares,
          tag: article.tags.length > 0 ? article.tags[0] : ''
        }))
      }
    });
  } catch (error) {
    console.error('获取热门文章出错:', error);
    res.status(500).json({
      success: false,
      message: '获取热门文章出错',
      error: error.message
    });
  }
};

// 获取文章详情
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article || !article.isPublished) {
      return res.status(404).json({
        success: false,
        message: '文章不存在或已下架'
      });
    }
    
    // 更新浏览量
    article.views += 1;
    await article.save();
    
    // 获取相关文章（同一分类的其他文章）
    const relatedArticles = await Article.find({
      _id: { $ne: article._id },
      category: article.category,
      isPublished: true
    })
      .sort({ publishDate: -1 })
      .limit(2)
      .select('title imageUrl views publishDate');
    
    res.status(200).json({
      success: true,
      data: {
        article: {
          id: article._id,
          title: article.title,
          summary: article.summary,
          content: article.content,
          imageUrl: article.imageUrl,
          category: article.category,
          author: article.author,
          publishDate: article.publishDate,
          views: article.views,
          shares: article.shares,
          tags: article.tags
        },
        relatedArticles: relatedArticles.map(relArticle => ({
          id: relArticle._id,
          title: relArticle.title,
          imageUrl: relArticle.imageUrl,
          views: relArticle.views,
          publishDate: relArticle.publishDate
        }))
      }
    });
  } catch (error) {
    console.error('获取文章详情出错:', error);
    res.status(500).json({
      success: false,
      message: '获取文章详情出错',
      error: error.message
    });
  }
};

// 增加文章分享次数
exports.incrementShareCount = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article || !article.isPublished) {
      return res.status(404).json({
        success: false,
        message: '文章不存在或已下架'
      });
    }
    
    // 更新分享次数
    article.shares += 1;
    await article.save();
    
    res.status(200).json({
      success: true,
      data: {
        shares: article.shares
      }
    });
  } catch (error) {
    console.error('更新文章分享次数出错:', error);
    res.status(500).json({
      success: false,
      message: '更新文章分享次数出错',
      error: error.message
    });
  }
};

// 以下是后台管理接口

// 管理端获取内容列表（包含未发布的）
exports.getContentsForAdmin = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      type, 
      status, 
      keyword 
    } = req.query;
    
    const query = {};
    
    // 分类筛选
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // 类型筛选
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // 状态筛选
    if (status && status !== 'all') {
      query.isPublished = status === 'published';
    }
    
    // 关键词搜索
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { summary: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Article.countDocuments(query);
    
    const contents = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        contents
      }
    });
  } catch (error) {
    console.error('获取内容列表出错:', error);
    res.status(500).json({
      success: false,
      message: '获取内容列表出错',
      error: error.message
    });
  }
};

// 管理端获取内容详情
exports.getContentByIdForAdmin = async (req, res) => {
  try {
    const content = await Article.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('获取内容详情出错:', error);
    res.status(500).json({
      success: false,
      message: '获取内容详情出错',
      error: error.message
    });
  }
};

// 创建内容
exports.createContent = async (req, res) => {
  try {
    const newContent = await Article.create(req.body);
    
    res.status(201).json({
      success: true,
      data: { content: newContent }
    });
  } catch (error) {
    console.error('创建内容出错:', error);
    res.status(500).json({
      success: false,
      message: '创建内容出错',
      error: error.message
    });
  }
};

// 更新文章
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        article
      }
    });
  } catch (error) {
    console.error('更新文章出错:', error);
    res.status(500).json({
      success: false,
      message: '更新文章出错',
      error: error.message
    });
  }
};

// 删除文章
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('删除文章出错:', error);
    res.status(500).json({
      success: false,
      message: '删除文章出错',
      error: error.message
    });
  }
}; 