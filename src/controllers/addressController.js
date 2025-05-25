const Address = require('../models/address');

// 获取用户所有地址
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取地址列表失败',
      error: error.message
    });
  }
};

// 获取单个地址
exports.getAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取地址失败',
      error: error.message
    });
  }
};

// 添加新地址
exports.addAddress = async (req, res) => {
  try {
    const { name, phone, province, city, district, detail, isDefault, tag } = req.body;
    
    // 添加用户ID到地址
    const address = await Address.create({
      user: req.user.id,
      name,
      phone,
      province,
      city,
      district,
      detail,
      isDefault: isDefault || false,
      tag: tag || '其他'
    });
    
    res.status(201).json({
      success: true,
      message: '地址添加成功',
      data: address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '添加地址失败',
      error: error.message
    });
  }
};

// 更新地址
exports.updateAddress = async (req, res) => {
  try {
    const { name, phone, province, city, district, detail, isDefault, tag } = req.body;
    
    // 查找并更新地址
    let address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }
    
    // 更新字段
    address.name = name || address.name;
    address.phone = phone || address.phone;
    address.province = province || address.province;
    address.city = city || address.city;
    address.district = district || address.district;
    address.detail = detail || address.detail;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;
    address.tag = tag || address.tag;
    
    // 保存更新
    await address.save();
    
    res.status(200).json({
      success: true,
      message: '地址更新成功',
      data: address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新地址失败',
      error: error.message
    });
  }
};

// 删除地址
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }
    
    // 使用findOneAndDelete替代address.remove()
    await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    res.status(200).json({
      success: true,
      message: '地址已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除地址失败',
      error: error.message
    });
  }
};

// 设置默认地址
exports.setDefaultAddress = async (req, res) => {
  try {
    // 查找指定地址
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }
    
    // 将其他地址设为非默认
    await Address.updateMany(
      { user: req.user.id, _id: { $ne: req.params.id } },
      { isDefault: false }
    );
    
    // 设置当前地址为默认
    address.isDefault = true;
    await address.save();
    
    res.status(200).json({
      success: true,
      message: '已设置为默认地址',
      data: address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '设置默认地址失败',
      error: error.message
    });
  }
}; 