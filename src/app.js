const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const config = require('./config/config');
const path = require('path');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

// 初始化Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 自定义请求日志中间件
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  console.log('Request Body:', req.body);
  next();
});

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 引入路由
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const articleRoutes = require('./routes/articleRoutes');
const pointRoutes = require('./routes/pointRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const bannerRoutes = require('./routes/banner');

// API路由
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/banners', bannerRoutes);

// 首页路由
app.get('/', (req, res) => {
  res.json({
    message: 'Water Shop API 服务运行中',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: [
      '/api/products',
      '/api/users',
      '/api/cart',
      '/api/addresses',
      '/api/orders',
      '/api/payments',
      '/api/favorites',
      '/api/reviews',
      '/api/coupons',
      '/api/articles',
      '/api/upload'
    ]
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 使用配置文件中的端口
const PORT = config.server.port;

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在: http://localhost:${PORT}`);
});

module.exports = app;