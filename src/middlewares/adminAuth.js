const jwt = require('jsonwebtoken');
const Administrator = require('../models/administrator');
const config = require('../config/config');

// 管理员身份验证中间件
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 检查请求头中的token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '请提供访问令牌'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 检查是否为管理员令牌
    if (decoded.type !== 'administrator') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }

    // 获取管理员信息
    const admin = await Administrator.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '令牌对应的管理员不存在'
      });
    }

    // 检查管理员是否被禁用
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    // 将管理员信息添加到请求对象
    req.user = {
      id: admin._id,
      username: admin.username,
      realName: admin.realName,
      role: admin.role,
      permissions: admin.getRolePermissions()
    };

    next();
  } catch (error) {
    console.error('管理员认证错误:', error);
    return res.status(401).json({
      success: false,
      message: '令牌验证失败'
    });
  }
};

// 权限检查中间件
exports.authorize = (...permissions) => {
  return (req, res, next) => {
    // 超级管理员拥有所有权限
    if (req.user.role === 'super_admin') {
      return next();
    }

    // 检查是否有任一所需权限
    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问此资源'
      });
    }

    next();
  };
};

// 角色检查中间件
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '角色权限不足'
      });
    }
    next();
  };
}; 