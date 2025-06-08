const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  systemName: {
    type: String,
    required: true,
    default: 'SPRINKLE',
    maxlength: 50
  },
  systemVersion: {
    type: String,
    required: true,
    default: '1.0.0',
    maxlength: 20,
    validate: {
      validator: function(v) {
        return /^\d+\.\d+\.\d+$/.test(v);
      },
      message: '版本格式应为 x.x.x'
    }
  },
  systemDescription: {
    type: String,
    default: '水站管理系统',
    maxlength: 200
  },
  recordNumber: {
    type: String,
    default: '',
    maxlength: 50
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// 确保只有一个设置文档
settingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      systemName: 'SPRINKLE',
      systemVersion: '1.0.0',
      systemDescription: '水站管理系统',
      recordNumber: '',
      updatedBy: 'system'
    });
  }
  return settings;
};

settingsSchema.statics.updateSingleton = async function(updateData, updatedBy) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      ...updateData,
      updatedBy
    });
  } else {
    Object.assign(settings, updateData, { updatedBy });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema); 