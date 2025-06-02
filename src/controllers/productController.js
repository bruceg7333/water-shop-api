const Product = require('../models/product');
const Review = require('../models/review'); // 添加评论模型引用
const XLSX = require('xlsx'); // 添加Excel处理库
const path = require('path');
const fs = require('fs');

// 获取商品列表
exports.getProducts = async (req, res) => {
  try {
    const { limit = 10, page = 1, category, tag, sort } = req.query;
    
    // 构建查询条件
    const query = { isActive: true };
    
    // 如果有分类筛选
    if (category) {
      query.category = category;
    }
    
    // 如果有标签筛选
    if (tag) {
      query.tag = tag;
    }
    
    // 排序选项
    let sortOption = {};
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'sales') {
      sortOption = { sales: -1 };
    } else {
      // 默认按创建时间降序
      sortOption = { createdAt: -1 };
    }
    
    // 查询总数
    const total = await Product.countDocuments(query);
    
    // 分页查询
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        products
      }
    });
  } catch (error) {
    console.error('获取商品列表出错:', error);
    res.status(500).json({
      success: false,
      message: '获取商品列表出错',
      error: error.message
    });
  }
};

// 管理员获取商品列表（支持完整查询参数）
exports.getProductsForAdmin = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      keyword, 
      category, 
      status, 
      priceRange, 
      stockRange, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    // 构建查询条件（管理员可以查看所有商品）
    const query = {};
    
    // 关键词搜索
    if (keyword && keyword.trim()) {
      query.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } },
        { tag: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }
    
    // 分类筛选
    if (category && category !== '') {
      query.category = category;
    }
    
    // 状态筛选
    if (status && status !== '') {
      query.isActive = status === 'on';
    }
    
    // 价格区间筛选
    if (priceRange && priceRange.trim()) {
      const priceRangeArr = priceRange.split('-');
      if (priceRangeArr.length === 2) {
        const minPrice = parseFloat(priceRangeArr[0]);
        const maxPrice = parseFloat(priceRangeArr[1]);
        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
          query.price = { $gte: minPrice, $lte: maxPrice };
        }
      }
    }
    
    // 库存区间筛选
    if (stockRange && stockRange.trim()) {
      const stockRangeArr = stockRange.split('-');
      if (stockRangeArr.length === 2) {
        const minStock = parseInt(stockRangeArr[0]);
        const maxStock = parseInt(stockRangeArr[1]);
        if (!isNaN(minStock) && !isNaN(maxStock)) {
          query.stock = { $gte: minStock, $lte: maxStock };
        }
      }
    }
    
    // 排序选项
    let sortOption = {};
    const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
    
    // 支持的排序字段
    const allowedSortFields = ['name', 'price', 'stock', 'sales', 'createdAt'];
    if (allowedSortFields.includes(sortBy)) {
      sortOption[sortBy] = sortOrderValue;
    } else {
      // 默认按创建时间降序
      sortOption = { createdAt: -1 };
    }
    
    console.log('管理员商品查询条件:', query);
    console.log('排序选项:', sortOption);
    
    // 查询总数
    const total = await Product.countDocuments(query);
    
    // 分页查询
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        products
      }
    });
  } catch (error) {
    console.error('管理员获取商品列表出错:', error);
    res.status(500).json({
      success: false,
      message: '获取商品列表出错',
      error: error.message
    });
  }
};

// 获取单个商品详情
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    console.log('=== 获取商品详情 ===');
    console.log('商品ID:', req.params.id);
    console.log('原始商品数据:', product ? JSON.stringify(product.toObject(), null, 2) : 'null');
    console.log('imageGallery字段:', product ? product.imageGallery : 'null');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 获取商品评分信息
    const reviewStats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    // 格式化响应数据
    const formattedProduct = {
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.imageUrl,
      imageUrl: product.imageUrl, // 添加imageUrl字段供前端使用
      imageGallery: product.imageGallery || [], // 修复：使用正确的字段名
      images: product.imageGallery || [], // 保持兼容性
      specifications: product.specifications || [],
      stock: product.stock,
      sales: product.sales,
      category: product.category,
      tag: product.tag, // 保持原始格式
      tags: product.tag ? [product.tag] : [],
      detailContent: product.detailContent || `<div>${product.description}</div>`,
      rating: reviewStats.length > 0 ? reviewStats[0].avgRating.toFixed(1) : "0.0",
      reviewCount: reviewStats.length > 0 ? reviewStats[0].totalReviews : 0,
      isActive: product.isActive,
      createdAt: product.createdAt
    };
    
    res.status(200).json({
      success: true,
      data: {
        product: formattedProduct
      }
    });
  } catch (error) {
    console.error('获取商品详情出错:', error);
    res.status(500).json({
      success: false,
      message: '获取商品详情出错',
      error: error.message
    });
  }
};

// 创建商品
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('创建商品出错:', error);
    res.status(400).json({
      success: false,
      message: '创建商品出错',
      error: error.message
    });
  }
};

// 创建测试商品数据
exports.createTestProducts = async (req, res) => {
  try {
    // 测试商品数据
    const products = [
      {
        name: 'SPRINKLE 纯净水',
        description: '来自高山冰川，纯净甘甜',
        price: 2.00,
        originalPrice: 2.50,
        imageUrl: '/assets/images/products/sprinkle.png',
        images: [
          '/assets/images/products/sprinkle.png',
          '/assets/images/products/sprinkle_2.png',
          '/assets/images/products/sprinkle_3.png'
        ],
        specifications: ['550ml', '1L', '2L'],
        sales: 1000,
        stock: 100,
        tag: '热销',
        category: '纯净水',
        detailContent: `
          <div class="detail-content">
            <p>产品特点：</p>
            <p>1. 源自海拔3800米高山冰川</p>
            <p>2. 18层过滤工艺</p>
            <p>3. 0添加，天然矿物质</p>
            <p>4. 适合婴幼儿饮用</p>
          </div>
        `
      },
      {
        name: 'SPRINKLE 矿泉水',
        description: '富含矿物质，健康饮用水选择',
        price: 2.00,
        originalPrice: 2.20,
        imageUrl: '/assets/images/products/sprinkle.png',
        images: [
          '/assets/images/products/sprinkle.png',
          '/assets/images/products/sprinkle_2.png'
        ],
        specifications: ['500ml', '1.5L'],
        sales: 800,
        stock: 100,
        tag: '优惠',
        category: '矿泉水',
        detailContent: `
          <div class="detail-content">
            <p>产品特点：</p>
            <p>1. 富含多种矿物质元素</p>
            <p>2. 口感清爽，天然健康</p>
            <p>3. 弱碱性水质，更健康</p>
          </div>
        `
      },
      {
        name: 'SPRINKLE 家庭装',
        description: '大容量家庭装，经济实惠',
        price: 1.50,
        originalPrice: 1.80,
        imageUrl: '/assets/images/products/sprinkle.png',
        specifications: ['4L', '8L'],
        sales: 600,
        stock: 100,
        tag: '新品',
        category: '家庭装',
        detailContent: `
          <div class="detail-content">
            <p>产品特点：</p>
            <p>1. 大容量家庭装，经济实惠</p>
            <p>2. 适合多人家庭日常饮用</p>
            <p>3. 配送到家，方便快捷</p>
          </div>
        `
      },
      {
        name: 'SPRINKLE 天然矿物质水',
        description: '天然矿物质，口感清爽',
        price: 1.50,
        originalPrice: 1.80,
        imageUrl: '/assets/images/products/sprinkle.png',
        specifications: ['500ml'],
        sales: 500,
        stock: 100,
        category: '矿泉水',
        detailContent: `
          <div class="detail-content">
            <p>产品特点：</p>
            <p>1. 天然矿物质，富含钙、镁等元素</p>
            <p>2. 清爽口感，畅快解渴</p>
            <p>3. 优质水源，专业工艺</p>
          </div>
        `
      }
    ];
    
    // 清空现有数据
    await Product.deleteMany({});
    
    // 添加测试数据
    const createdProducts = await Product.insertMany(products);
    
    res.status(201).json({
      success: true,
      message: '测试商品数据创建成功',
      count: createdProducts.length,
      data: createdProducts
    });
  } catch (error) {
    console.error('创建测试商品数据出错:', error);
    res.status(500).json({
      success: false,
      message: '创建测试商品数据出错',
      error: error.message
    });
  }
};

// 搜索商品
exports.searchProducts = async (req, res) => {
  try {
    const { keyword, limit = 10, page = 1, category, minPrice, maxPrice, sort } = req.query;
    
    // 构建查询条件
    const query = { isActive: true };
    
    // 关键词搜索
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // 分类筛选
    if (category) {
      query.category = category;
    }
    
    // 价格范围筛选
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }
    
    // 排序选项
    let sortOption = {};
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'sales') {
      sortOption = { sales: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    } else {
      // 默认按相关性排序（对于搜索）
      sortOption = { createdAt: -1 };
    }
    
    // 查询总数
    const total = await Product.countDocuments(query);
    
    // 分页查询
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // 获取分类列表用于筛选
    const categories = await Product.distinct('category');
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        products,
        filters: {
          categories
        }
      }
    });
  } catch (error) {
    console.error('搜索商品出错:', error);
    res.status(500).json({
      success: false,
      message: '搜索商品出错',
      error: error.message
    });
  }
};

// 获取热销商品（销量前3）
exports.getHotProducts = async (req, res) => {
  try {
    // 查询销量最高的前3个商品
    const hotProducts = await Product.find({ isActive: true })
      .sort({ sales: -1 })
      .limit(3);
    
    res.status(200).json({
      success: true,
      data: hotProducts
    });
  } catch (error) {
    console.error('获取热销商品出错:', error);
    res.status(500).json({
      success: false,
      message: '获取热销商品出错',
      error: error.message
    });
  }
};

// 更新商品
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;
    
    console.log('=== 更新商品数据 ===');
    console.log('商品ID:', productId);
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    console.log('imageGallery字段:', updateData.imageGallery);
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    console.log('更新前的商品数据:', JSON.stringify(product.toObject(), null, 2));
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    console.log('更新后的商品数据:', JSON.stringify(updatedProduct.toObject(), null, 2));
    console.log('更新后的imageGallery:', updatedProduct.imageGallery);
    
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('更新商品出错:', error);
    res.status(400).json({
      success: false,
      message: '更新商品出错',
      error: error.message
    });
  }
};

// 删除商品
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: '商品已成功删除'
    });
  } catch (error) {
    console.error('删除商品出错:', error);
    res.status(500).json({
      success: false,
      message: '删除商品出错',
      error: error.message
    });
  }
};

// 下载批量导入模板
exports.downloadImportTemplate = async (req, res) => {
  try {
    // 创建模板数据
    const templateData = [
      {
        '商品名称*': 'SPRINKLE 纯净水',
        '商品描述*': '来自高山冰川，纯净甘甜，适合全家饮用',
        '价格*': 2.50,
        '库存*': 100,
        '分类*': '纯净水',
        '标签': '热销',
        '商品图片URL': '/assets/images/products/default.png',
        '是否上架': '是',
        '评分': 4.5,
        '评分数量': 100
      },
      {
        '商品名称*': 'SPRINKLE 矿泉水',
        '商品描述*': '富含天然矿物质，口感清爽，健康之选',
        '价格*': 3.00,
        '库存*': 80,
        '分类*': '矿泉水',
        '标签': '优惠',
        '商品图片URL': '/assets/images/products/default.png',
        '是否上架': '是',
        '评分': 4.2,
        '评分数量': 50
      }
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建数据工作表
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // 设置列宽
    const colWidths = [
      { wch: 20 }, // 商品名称
      { wch: 40 }, // 商品描述
      { wch: 10 }, // 价格
      { wch: 10 }, // 库存
      { wch: 15 }, // 分类
      { wch: 10 }, // 标签
      { wch: 30 }, // 商品图片URL
      { wch: 10 }, // 是否上架
      { wch: 10 }, // 评分
      { wch: 10 }  // 评分数量
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, '商品数据');

    // 创建说明工作表
    const instructions = [
      { '字段名称': '商品名称*', '说明': '必填，商品的名称，长度2-50字符', '示例': 'SPRINKLE 纯净水' },
      { '字段名称': '商品描述*', '说明': '必填，商品的详细描述', '示例': '来自高山冰川，纯净甘甜' },
      { '字段名称': '价格*', '说明': '必填，商品价格，必须大于0', '示例': '2.50' },
      { '字段名称': '库存*', '说明': '必填，商品库存数量，必须大于等于0', '示例': '100' },
      { '字段名称': '分类*', '说明': '必填，商品分类', '示例': '纯净水、矿泉水、气泡水等' },
      { '字段名称': '标签', '说明': '可选，商品标签', '示例': '热销、新品、优惠、限量' },
      { '字段名称': '商品图片URL', '说明': '可选，商品主图URL，留空将使用默认图片', '示例': '/assets/images/products/default.png' },
      { '字段名称': '是否上架', '说明': '可选，是否上架销售', '示例': '是/否，默认为是' },
      { '字段名称': '评分', '说明': '可选，商品评分0-5分', '示例': '4.5' },
      { '字段名称': '评分数量', '说明': '可选，评分数量', '示例': '100' }
    ];

    const instructionWs = XLSX.utils.json_to_sheet(instructions);
    instructionWs['!cols'] = [
      { wch: 15 },
      { wch: 40 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, instructionWs, '填写说明');

    // 生成Excel文件
    const fileName = `商品批量导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filePath = path.join(__dirname, '../../temp', fileName);
    
    // 确保temp目录存在
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 写入文件
    XLSX.writeFile(wb, filePath);

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // 发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('发送文件失败:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '模板下载失败'
          });
        }
      }
      
      // 删除临时文件
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteErr) {
          console.error('删除临时文件失败:', deleteErr);
        }
      }, 5000); // 5秒后删除
    });

  } catch (error) {
    console.error('生成模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成模板失败',
      error: error.message
    });
  }
};

// 批量导入商品
exports.importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Excel文件'
      });
    }

    // 读取Excel文件
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // 读取第一个工作表
    const worksheet = workbook.Sheets[sheetName];
    
    // 将工作表转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel文件中没有数据'
      });
    }

    console.log('导入的原始数据:', jsonData);

    // 验证和处理数据
    const validProducts = [];
    const errors = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // Excel行号（从第2行开始，第1行是标题）

      try {
        // 验证必填字段
        const requiredFields = {
          '商品名称*': 'name',
          '商品描述*': 'description', 
          '价格*': 'price',
          '库存*': 'stock',
          '分类*': 'category'
        };

        const product = {};

        // 检查必填字段
        for (const [excelField, dbField] of Object.entries(requiredFields)) {
          const value = row[excelField];
          if (!value && value !== 0) {
            errors.push(`第${rowNum}行：${excelField}不能为空`);
            continue;
          }
          product[dbField] = value;
        }

        // 如果有必填字段错误，跳过此行
        if (errors.some(err => err.includes(`第${rowNum}行`))) {
          continue;
        }

        // 验证数据类型和范围
        if (isNaN(product.price) || product.price <= 0) {
          errors.push(`第${rowNum}行：价格必须是大于0的数字`);
          continue;
        }

        if (isNaN(product.stock) || product.stock < 0) {
          errors.push(`第${rowNum}行：库存必须是大于等于0的整数`);
          continue;
        }

        // 验证商品名称长度
        if (product.name.length < 2 || product.name.length > 50) {
          errors.push(`第${rowNum}行：商品名称长度必须在2-50个字符之间`);
          continue;
        }

        // 处理可选字段
        product.tag = row['标签'] || '';
        product.imageUrl = row['商品图片URL'] || '/assets/images/products/default.png';
        product.isActive = row['是否上架'] === '否' ? false : true;
        product.rating = parseFloat(row['评分']) || 0;
        product.ratingsCount = parseInt(row['评分数量']) || 0;
        
        // 验证评分范围
        if (product.rating < 0 || product.rating > 5) {
          product.rating = 0;
        }

        // 验证标签
        const validTags = ['热销', '新品', '优惠', '限量', ''];
        if (product.tag && !validTags.includes(product.tag)) {
          errors.push(`第${rowNum}行：标签必须是：${validTags.filter(t => t).join('、')} 或留空`);
          continue;
        }

        // 设置默认值
        product.sales = 0;
        product.allowReviews = true;
        product.status = '正常';

        validProducts.push(product);

      } catch (error) {
        errors.push(`第${rowNum}行：数据处理错误 - ${error.message}`);
      }
    }

    // 如果有错误，返回错误信息
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: errors.slice(0, 10), // 最多返回10个错误
        totalErrors: errors.length
      });
    }

    if (validProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有有效的商品数据可以导入'
      });
    }

    // 批量插入商品
    const insertedProducts = await Product.insertMany(validProducts);

    // 删除临时文件
    try {
      fs.unlinkSync(req.file.path);
    } catch (deleteErr) {
      console.error('删除临时文件失败:', deleteErr);
    }

    res.status(201).json({
      success: true,
      message: `成功导入 ${insertedProducts.length} 个商品`,
      data: {
        imported: insertedProducts.length,
        products: insertedProducts
      }
    });

  } catch (error) {
    console.error('批量导入商品失败:', error);
    
    // 删除临时文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteErr) {
        console.error('删除临时文件失败:', deleteErr);
      }
    }

    res.status(500).json({
      success: false,
      message: '批量导入失败',
      error: error.message
    });
  }
}; 