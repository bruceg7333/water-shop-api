const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, '收货人姓名不能为空'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, '联系电话不能为空'],
    validate: {
      validator: function(v) {
        return /^1[3-9]\d{9}$/.test(v);
      },
      message: '请输入有效的手机号'
    }
  },
  province: {
    type: String,
    required: [true, '省份不能为空']
  },
  city: {
    type: String,
    required: [true, '城市不能为空']
  },
  district: {
    type: String,
    required: [true, '区/县不能为空']
  },
  detail: {
    type: String,
    required: [true, '详细地址不能为空'],
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  tag: {
    type: String,
    enum: ['家', '公司', '学校', '其他'],
    default: '其他'
  }
}, {
  timestamps: true
});

// 确保每个用户只有一个默认地址
addressSchema.pre('save', async function(next) {
  // 如果正在设置为默认地址
  if (this.isDefault) {
    // 将用户的其他地址设置为非默认
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id }, 
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  next();
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address; 