const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');

/**
 * 用户认证中间件
 * 验证请求头中的Authorization令牌
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // 从请求头或cookie中获取令牌
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // 从Bearer令牌中提取
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // 从cookie中提取
      token = req.cookies.token;
    }
    
    // 如果没有token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        needLogin: true
      });
    }
    
    // 验证令牌
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录',
        needLogin: true
      });
    }
    
    // 检查用户是否存在
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '此用户不存在',
        needLogin: true
      });
    }
    
    // 如果用户被禁用
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '您的账号已被禁用',
        needLogin: true
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '认证失败，请重新登录',
      needLogin: true,
      error: error.message
    });
  }
};

/**
 * 角色授权中间件
 * @param {...string} roles - 允许的角色列表
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // 确保先经过认证中间件保护
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: '认证中间件配置错误'
      });
    }
    
    // 检查用户角色
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '您没有权限执行此操作'
      });
    }
    
    next();
  };
}; 