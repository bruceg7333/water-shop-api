const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: 6,
    select: false // 查询时默认不返回密码
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^1[3-9]\d{9}$/.test(v);
      },
      message: '请输入有效的手机号'
    }
  },
  avatar: {
    type: String,
    default: '/assets/images/avatar/default.png'
  },
  nickName: {
    type: String,
    default: '水商城用户'
  },
  gender: {
    type: String,
    enum: ['男', '女', '未知'],
    default: '未知'
  },
  birthday: {
    type: Date
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // 如果email为空或未定义，跳过验证
        if (!v) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: '请输入有效的邮箱地址'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  openid: String, // 微信小程序openid
  points: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// 保存前加密密码
userSchema.pre('save', async function(next) {
  // 只有密码被修改时才重新加密
  if (!this.isModified('password')) return next();
  
  try {
    // 生成盐和加密密码
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 