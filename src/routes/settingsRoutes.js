const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, requireRole } = require('../middlewares/adminAuth');

// 获取系统设置 - 只有超级管理员可以访问
router.get('/admin/settings', protect, requireRole('super_admin'), async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    
    res.json({
      success: true,
      data: {
        settings: {
          systemName: settings.systemName,
          systemVersion: settings.systemVersion,
          systemDescription: settings.systemDescription,
          recordNumber: settings.recordNumber,
          updatedAt: settings.updatedAt,
          updatedBy: settings.updatedBy
        }
      }
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败'
    });
  }
});

// 更新系统设置 - 只有超级管理员可以访问
router.put('/admin/settings', protect, requireRole('super_admin'), async (req, res) => {
  try {
    const { systemName, systemVersion, systemDescription, recordNumber } = req.body;
    
    // 验证必填字段
    if (!systemName || !systemVersion) {
      return res.status(400).json({
        success: false,
        message: '系统名称和版本为必填项'
      });
    }
    
    // 验证版本格式
    if (!/^\d+\.\d+\.\d+$/.test(systemVersion)) {
      return res.status(400).json({
        success: false,
        message: '版本格式应为 x.x.x'
      });
    }
    
    // 验证字段长度
    if (systemName.length > 50) {
      return res.status(400).json({
        success: false,
        message: '系统名称不能超过50个字符'
      });
    }
    
    if (systemVersion.length > 20) {
      return res.status(400).json({
        success: false,
        message: '系统版本不能超过20个字符'
      });
    }
    
    if (systemDescription && systemDescription.length > 200) {
      return res.status(400).json({
        success: false,
        message: '系统描述不能超过200个字符'
      });
    }
    
    if (recordNumber && recordNumber.length > 50) {
      return res.status(400).json({
        success: false,
        message: '备案信息不能超过50个字符'
      });
    }
    
    // 更新设置
    const updateData = {
      systemName: systemName.trim(),
      systemVersion: systemVersion.trim(),
      systemDescription: systemDescription ? systemDescription.trim() : '',
      recordNumber: recordNumber ? recordNumber.trim() : ''
    };
    
    const settings = await Settings.updateSingleton(updateData, req.user.username);
    
    res.json({
      success: true,
      message: '系统设置更新成功',
      data: {
        settings: {
          systemName: settings.systemName,
          systemVersion: settings.systemVersion,
          systemDescription: settings.systemDescription,
          recordNumber: settings.recordNumber,
          updatedAt: settings.updatedAt,
          updatedBy: settings.updatedBy
        }
      }
    });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新系统设置失败'
    });
  }
});

module.exports = router; 