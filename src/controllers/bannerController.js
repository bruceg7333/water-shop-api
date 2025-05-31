const Banner = require('../models/banner')
const Product = require('../models/product')
const Article = require('../models/article')

// 获取轮播图列表(管理端)
exports.getBanners = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword = '',
      type = '',
      status = '',
      sortBy = 'sort',
      sortOrder = 'desc'
    } = req.query

    // 构建查询条件
    const query = {}
    
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }
    
    if (type) {
      query.type = type
    }
    
    if (status !== '') {
      query.isActive = status === 'active'
    }

    // 构建排序
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    // 分页查询
    const skip = (page - 1) * pageSize
    const banners = await Banner.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(pageSize))
      .populate('targetProduct', 'name price imageUrl')
      .populate('targetArticle', 'title summary imageUrl')
      .populate('createdBy', 'username')

    const total = await Banner.countDocuments(query)

    res.json({
      success: true,
      data: {
        banners,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('获取轮播图列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取轮播图列表失败'
    })
  }
}

// 获取有效轮播图(小程序端)
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.getActiveBanners()
    
    // 增加浏览次数
    const updatePromises = banners.map(banner => banner.incrementView())
    await Promise.all(updatePromises)

    res.json({
      success: true,
      data: banners
    })
  } catch (error) {
    console.error('获取有效轮播图失败:', error)
    res.status(500).json({
      success: false,
      message: '获取轮播图失败'
    })
  }
}

// 创建轮播图
exports.createBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      type,
      targetProduct,
      targetCategory,
      targetArticle,
      targetUrl,
      sort = 0
    } = req.body

    // 验证必填字段
    if (!title || !image || !type) {
      return res.status(400).json({
        success: false,
        message: '标题、图片和类型为必填项'
      })
    }

    // 根据类型验证目标配置
    const bannerData = {
      title,
      description,
      image,
      type,
      sort,
      createdBy: req.user.id
    }

    switch (type) {
      case 'product':
        if (!targetProduct) {
          return res.status(400).json({
            success: false,
            message: '产品类型必须选择一个产品'
          })
        }
        // 验证产品是否存在
        const product = await Product.findById(targetProduct)
        if (!product) {
          return res.status(400).json({
            success: false,
            message: '选择的产品不存在'
          })
        }
        bannerData.targetProduct = targetProduct
        break

      case 'category':
        if (!targetCategory) {
          return res.status(400).json({
            success: false,
            message: '产品类别类型必须选择一个产品类别'
          })
        }
        bannerData.targetCategory = targetCategory
        break

      case 'article':
        if (!targetArticle) {
          return res.status(400).json({
            success: false,
            message: '文章类型必须选择一篇文章'
          })
        }
        // 验证文章是否存在
        const article = await Article.findById(targetArticle)
        if (!article) {
          return res.status(400).json({
            success: false,
            message: '选择的文章不存在'
          })
        }
        bannerData.targetArticle = targetArticle
        break

      case 'external':
        if (!targetUrl) {
          return res.status(400).json({
            success: false,
            message: '外部链接类型必须输入链接地址'
          })
        }
        bannerData.targetUrl = targetUrl
        break

      default:
        return res.status(400).json({
          success: false,
          message: '无效的轮播图类型'
        })
    }

    const banner = new Banner(bannerData)
    await banner.save()

    // 返回时填充关联数据
    await banner.populate('targetProduct', 'name price imageUrl')
    await banner.populate('targetArticle', 'title summary imageUrl')

    res.status(201).json({
      success: true,
      data: banner,
      message: '轮播图创建成功'
    })
  } catch (error) {
    console.error('创建轮播图失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '创建轮播图失败'
    })
  }
}

// 更新轮播图
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      image,
      type,
      targetProduct,
      targetCategory,
      targetArticle,
      targetUrl,
      sort,
      isActive
    } = req.body

    const banner = await Banner.findById(id)
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '轮播图不存在'
      })
    }

    // 更新基本信息
    if (title !== undefined) banner.title = title
    if (description !== undefined) banner.description = description
    if (image !== undefined) banner.image = image
    if (sort !== undefined) banner.sort = sort
    if (isActive !== undefined) banner.isActive = isActive

    // 如果更新了类型，需要重新设置目标
    if (type !== undefined) {
      banner.type = type
      
      // 清空所有目标字段
      banner.targetProduct = null
      banner.targetCategory = null
      banner.targetArticle = null
      banner.targetUrl = null

      // 根据新类型设置目标
      switch (type) {
        case 'product':
          if (!targetProduct) {
            return res.status(400).json({
              success: false,
              message: '产品类型必须选择一个产品'
            })
          }
          const product = await Product.findById(targetProduct)
          if (!product) {
            return res.status(400).json({
              success: false,
              message: '选择的产品不存在'
            })
          }
          banner.targetProduct = targetProduct
          break

        case 'category':
          if (!targetCategory) {
            return res.status(400).json({
              success: false,
              message: '产品类别类型必须选择一个产品类别'
            })
          }
          banner.targetCategory = targetCategory
          break

        case 'article':
          if (!targetArticle) {
            return res.status(400).json({
              success: false,
              message: '文章类型必须选择一篇文章'
            })
          }
          const article = await Article.findById(targetArticle)
          if (!article) {
            return res.status(400).json({
              success: false,
              message: '选择的文章不存在'
            })
          }
          banner.targetArticle = targetArticle
          break

        case 'external':
          if (!targetUrl) {
            return res.status(400).json({
              success: false,
              message: '外部链接类型必须输入链接地址'
            })
          }
          banner.targetUrl = targetUrl
          break
      }
    } else {
      // 如果没有更新类型，只更新对应的目标字段
      switch (banner.type) {
        case 'product':
          if (targetProduct !== undefined) {
            if (targetProduct) {
              const product = await Product.findById(targetProduct)
              if (!product) {
                return res.status(400).json({
                  success: false,
                  message: '选择的产品不存在'
                })
              }
            }
            banner.targetProduct = targetProduct
          }
          break

        case 'category':
          if (targetCategory !== undefined) {
            banner.targetCategory = targetCategory
          }
          break

        case 'article':
          if (targetArticle !== undefined) {
            if (targetArticle) {
              const article = await Article.findById(targetArticle)
              if (!article) {
                return res.status(400).json({
                  success: false,
                  message: '选择的文章不存在'
                })
              }
            }
            banner.targetArticle = targetArticle
          }
          break

        case 'external':
          if (targetUrl !== undefined) {
            banner.targetUrl = targetUrl
          }
          break
      }
    }

    await banner.save()

    // 返回时填充关联数据
    await banner.populate('targetProduct', 'name price imageUrl')
    await banner.populate('targetArticle', 'title summary imageUrl')

    res.json({
      success: true,
      data: banner,
      message: '轮播图更新成功'
    })
  } catch (error) {
    console.error('更新轮播图失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '更新轮播图失败'
    })
  }
}

// 删除轮播图
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params

    const banner = await Banner.findByIdAndDelete(id)
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '轮播图不存在'
      })
    }

    res.json({
      success: true,
      message: '轮播图删除成功'
    })
  } catch (error) {
    console.error('删除轮播图失败:', error)
    res.status(500).json({
      success: false,
      message: '删除轮播图失败'
    })
  }
}

// 切换轮播图状态
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    const banner = await Banner.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    )

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '轮播图不存在'
      })
    }

    res.json({
      success: true,
      data: banner,
      message: `轮播图已${isActive ? '启用' : '禁用'}`
    })
  } catch (error) {
    console.error('切换轮播图状态失败:', error)
    res.status(500).json({
      success: false,
      message: '切换轮播图状态失败'
    })
  }
}

// 批量更新轮播图排序
exports.updateBannerSort = async (req, res) => {
  try {
    const { banners } = req.body

    if (!Array.isArray(banners)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误'
      })
    }

    const updatePromises = banners.map(({ id, sort }) =>
      Banner.findByIdAndUpdate(id, { sort })
    )

    await Promise.all(updatePromises)

    res.json({
      success: true,
      message: '排序更新成功'
    })
  } catch (error) {
    console.error('更新轮播图排序失败:', error)
    res.status(500).json({
      success: false,
      message: '更新轮播图排序失败'
    })
  }
}

// 搜索产品(用于轮播图选择产品)
exports.searchProducts = async (req, res) => {
  try {
    const { keyword = '', page = 1, pageSize = 10 } = req.query

    const query = {
      isActive: true,
      status: '正常'
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * pageSize
    const products = await Product.find(query)
      .select('name price imageUrl category')
      .skip(skip)
      .limit(parseInt(pageSize))
      .sort({ createdAt: -1 })

    const total = await Product.countDocuments(query)

    res.json({
      success: true,
      data: {
        products,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('搜索产品失败:', error)
    res.status(500).json({
      success: false,
      message: '搜索产品失败'
    })
  }
}

// 搜索文章(用于轮播图选择文章)
exports.searchArticles = async (req, res) => {
  try {
    const { keyword = '', page = 1, pageSize = 10 } = req.query

    const query = {
      isPublished: true
    }

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { summary: { $regex: keyword, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * pageSize
    const articles = await Article.find(query)
      .select('title summary imageUrl category type')
      .skip(skip)
      .limit(parseInt(pageSize))
      .sort({ createdAt: -1 })

    const total = await Article.countDocuments(query)

    res.json({
      success: true,
      data: {
        articles,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('搜索文章失败:', error)
    res.status(500).json({
      success: false,
      message: '搜索文章失败'
    })
  }
}

// 获取产品类别列表(用于轮播图选择产品类别)
exports.getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true })
    
    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('获取产品类别失败:', error)
    res.status(500).json({
      success: false,
      message: '获取产品类别失败'
    })
  }
}

// 轮播图点击统计
exports.clickBanner = async (req, res) => {
  try {
    const { id } = req.params

    const banner = await Banner.findById(id)
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '轮播图不存在'
      })
    }

    await banner.incrementClick()

    res.json({
      success: true,
      message: '点击统计成功'
    })
  } catch (error) {
    console.error('轮播图点击统计失败:', error)
    res.status(500).json({
      success: false,
      message: '点击统计失败'
    })
  }
} 