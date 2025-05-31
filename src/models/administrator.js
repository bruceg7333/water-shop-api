const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const administratorSchema = new mongoose.Schema({
  // 基本信息
  username: {
    type: String,
    required: [true, '用户名为必填项'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  
  password: {
    type: String,
    required: [true, '密码为必填项'],
    minlength: [6, '密码至少6个字符'],
    select: false // 默认不返回密码字段
  },
  
  realName: {
    type: String,
    required: [true, '真实姓名为必填项'],
    trim: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  avatar: {
    type: String,
    default: ''
  },
  
  // 权限和角色
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'operator', 'viewer'],
    default: 'operator',
    required: true
  },
  
  permissions: [{
    type: String,
    enum: [
      'user_view', 'user_edit', 'user_delete',
      'product_view', 'product_edit', 'product_delete', 'product_create',
      'order_view', 'order_edit', 'order_delete',
      'banner_read', 'banner_create', 'banner_update', 'banner_delete',
      'content_read', 'content_create', 'content_update', 'content_delete',
      'statistics_view',
      'system_settings',
      'admin_manage'
    ]
  }],
  
  // 状态
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 最后登录
  lastLogin: {
    type: Date
  },
  
  // 创建者（用于审计）
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Administrator'
  },
  
  // 备注
  remark: {
    type: String,
    maxlength: [200, '备注最多200个字符']
  }
}, {
  timestamps: true
});

// 密码加密中间件
administratorSchema.pre('save', async function(next) {
  // 如果密码没有修改，跳过加密
  if (!this.isModified('password')) return next();
  
  // 生成盐并加密密码
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码验证方法
administratorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 检查权限方法
administratorSchema.methods.hasPermission = function(permission) {
  // 超级管理员拥有所有权限
  if (this.role === 'super_admin') return true;
  
  // 检查特定权限
  return this.permissions.includes(permission);
};

// 获取角色权限
administratorSchema.methods.getRolePermissions = function() {
  const rolePermissions = {
    super_admin: [
      'user_view', 'user_edit', 'user_delete',
      'product_view', 'product_edit', 'product_delete', 'product_create',
      'order_view', 'order_edit', 'order_delete',
      'banner_read', 'banner_create', 'banner_update', 'banner_delete',
      'content_read', 'content_create', 'content_update', 'content_delete',
      'statistics_view',
      'system_settings',
      'admin_manage'
    ],
    admin: [
      'user_view', 'user_edit', 'user_delete',
      'product_view', 'product_edit', 'product_delete', 'product_create',
      'order_view', 'order_edit', 'order_delete',
      'banner_read', 'banner_create', 'banner_update', 'banner_delete',
      'content_read', 'content_create', 'content_update', 'content_delete',
      'statistics_view'
    ],
    operator: [
      'user_view',
      'product_view', 'product_edit',
      'order_view', 'order_edit',
      'banner_read', 'banner_create', 'banner_update',
      'content_read', 'content_create', 'content_update',
      'statistics_view'
    ],
    viewer: [
      'user_view',
      'product_view',
      'order_view',
      'banner_read',
      'statistics_view'
    ]
  };
  
  return rolePermissions[this.role] || [];
};

// 索引
// administratorSchema.index({ username: 1 }); // 移除：因为字段已设置unique: true
administratorSchema.index({ email: 1 });
administratorSchema.index({ role: 1 });
administratorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Administrator', administratorSchema); 