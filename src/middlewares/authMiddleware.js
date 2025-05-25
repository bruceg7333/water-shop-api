const jwt = require('jsonwebtoken');
const User = require('../models/user');

// 保护路由，验证用户是否登录
exports.protect = async (req, res, next) => {
  try {
    // 1) 获取token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '您未登录，请先登录'
      });
    }

    // 2) 验证token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'water-shop-secret-key');
      
      // 3) 检查用户是否存在
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: '此用户不存在'
        });
      }

      // 4) 将用户信息附加到请求对象
      req.user = currentUser;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '令牌无效或已过期，请重新登录'
      });
    }
  } catch (error) {
    console.error('验证用户登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 限制路由访问权限
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // 假设用户对象有一个role属性
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '您没有权限执行此操作'
      });
    }
    next();
  };
}; 