const express = require('express');
const addressController = require('../controllers/addressController');
const { protect } = require('../middlewares/auth');
const router = express.Router();

// 所有地址操作都需要登录
router.use(protect);

// 获取所有地址/添加新地址
router.route('/')
  .get(addressController.getAddresses)
  .post(addressController.addAddress);

// 获取、更新、删除单个地址
router.route('/:id')
  .get(addressController.getAddress)
  .put(addressController.updateAddress)
  .delete(addressController.deleteAddress);

// 设置默认地址
router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router; 