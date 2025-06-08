const Administrator = require('../models/administrator');
const { generateToken } = require('../utils/jwt');
const mongoose = require('mongoose');

// 操作员登录（后台专用）
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔍 登录请求:', { username, password: password ? '***' : undefined });
    
    // 检查用户名和密码是否提供
    if (!username || !password) {
      console.log('❌ 缺少用户名或密码');
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      });
    }
    
    // 查找操作员并选择包含密码字段
    const admin = await Administrator.findOne({ username }).select('+password');
    console.log('🔍 查找用户结果:', admin ? `找到用户: ${admin.username}` : '用户不存在');
    
    // 检查操作员是否存在
    if (!admin) {
      console.log('❌ 用户不存在');
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 检查账户是否激活
    if (!admin.isActive) {
      console.log('❌ 账户未激活');
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系系统管理员'
      });
    }
    
    console.log('🔍 账户状态正常，开始验证密码...');
    console.log('🔍 存储的密码哈希:', admin.password);
    
    // 验证密码是否匹配
    const isMatch = await admin.matchPassword(password);
    console.log('🔍 密码验证结果:', isMatch);
    
    if (!isMatch) {
      console.log('❌ 密码验证失败');
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    console.log('✅ 登录成功');
    
    // 更新最后登录时间
    admin.lastLogin = Date.now();
    await admin.save();
    
    // 生成JWT令牌（标记为管理员令牌）
    const token = generateToken({ 
      id: admin._id, 
      type: 'administrator',
      role: admin.role 
    });
    
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        administrator: {
          id: admin._id,
          username: admin.username,
          realName: admin.realName,
          email: admin.email,
          phone: admin.phone,
          avatar: admin.avatar,
          role: admin.role,
          permissions: admin.getRolePermissions()
        }
      }
    });
  } catch (error) {
    console.error('操作员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

// 获取当前操作员信息
exports.getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Administrator.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '操作员不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        administrator: {
          id: admin._id,
          username: admin.username,
          realName: admin.realName,
          email: admin.email,
          phone: admin.phone,
          avatar: admin.avatar,
          role: admin.role,
          permissions: admin.getRolePermissions(),
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt
        }
      }
    });
  } catch (error) {
    console.error('获取操作员信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取操作员信息失败',
      error: error.message
    });
  }
};

// 获取所有操作员（需要admin_manage权限）
exports.getAllAdministrators = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      isActive = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    // 构建查询条件
    const query = {};
    
    // 根据用户角色限制查询范围
    if (req.user.role === 'super_admin') {
      // 超级管理员可以看到所有账号
      // 不添加额外限制
    } else if (req.user.role === 'admin') {
      // 管理员只能看到自己创建的操作员账号
      query.$or = [
        { createdBy: req.user.id }, // 自己创建的账号
        { _id: req.user.id } // 自己的账号
      ];
      query.role = { $in: ['admin', 'operator'] }; // 管理员不能看到超级管理员
    } else {
      // 其他角色无权查看
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问此资源'
      });
    }
    
    // 模糊搜索（用户名、真实姓名、邮箱）
    if (search) {
      const searchCondition = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { realName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      
      // 如果已有查询条件，需要合并
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          searchCondition
        ];
        delete query.$or;
      } else {
        Object.assign(query, searchCondition);
      }
    }
    
    // 角色筛选
    if (role && role !== '') {
      if (query.role && query.role.$in) {
        // 如果已有角色限制，取交集
        query.role = role;
      } else {
        query.role = role;
      }
    }
    
    // 状态筛选
    if (isActive && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    // 构建排序条件
    const sortCondition = {};
    sortCondition[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    console.log('🔍 查询条件:', JSON.stringify(query, null, 2));
    console.log('🔍 当前用户:', req.user.role, req.user.id);
    
    // 查询总数
    const total = await Administrator.countDocuments(query);
    
    // 分页查询
    const administrators = await Administrator.find(query)
      .select('-password')
      .populate('createdBy', 'username realName')
      .sort(sortCondition)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // 添加权限信息
    const adminsWithPermissions = administrators.map(admin => ({
      ...admin.toObject(),
      permissions: admin.getRolePermissions()
    }));
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        administrators: adminsWithPermissions
      }
    });
  } catch (error) {
    console.error('获取操作员列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取操作员列表失败',
      error: error.message
    });
  }
};

// 创建操作员（需要admin_manage权限）
exports.createAdministrator = async (req, res) => {
  try {
    const { username, password, realName, email, phone, role, permissions, remark } = req.body;
    
    // 检查必要字段
    if (!username || !password || !realName) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和真实姓名为必填项'
      });
    }
    
    // 检查权限：
    // 1. 只有超级管理员可以创建超级管理员（但现在不允许创建新的超级管理员）
    // 2. 超级管理员可以创建管理员和操作员
    // 3. 管理员只能创建操作员
    if (role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '不允许创建新的超级管理员'
      });
    }
    
    if (role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有超级管理员可以创建管理员账号'
      });
    }
    
    // 检查用户名是否已存在
    const existingAdmin = await Administrator.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
    }
    
    // 创建操作员
    const adminData = {
      username,
      password,
      realName,
      email,
      phone,
      role: role || 'operator',
      permissions: permissions || [],
      remark,
      createdBy: req.user.id
    };
    
    const administrator = await Administrator.create(adminData);
    
    res.status(201).json({
      success: true,
      message: '操作员创建成功',
      data: {
        administrator: {
          id: administrator._id,
          username: administrator.username,
          realName: administrator.realName,
          email: administrator.email,
          phone: administrator.phone,
          role: administrator.role,
          permissions: administrator.getRolePermissions(),
          isActive: administrator.isActive,
          createdAt: administrator.createdAt
        }
      }
    });
  } catch (error) {
    console.error('创建操作员失败:', error);
    res.status(500).json({
      success: false,
      message: '创建操作员失败',
      error: error.message
    });
  }
};

// 更新操作员（需要admin_manage权限）
exports.updateAdministrator = async (req, res) => {
  try {
    const { id } = req.params;
    const { realName, email, phone, role, permissions, isActive, remark } = req.body;
    
    const administrator = await Administrator.findById(id);
    if (!administrator) {
      return res.status(404).json({
        success: false,
        message: '操作员不存在'
      });
    }
    
    // 权限检查
    if (req.user.role === 'super_admin') {
      // 超级管理员不能修改其他超级管理员的角色
      if (administrator.role === 'super_admin' && role && role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: '不能修改超级管理员的角色'
        });
      }
      // 不允许提升为超级管理员
      if (role === 'super_admin' && administrator.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: '不允许提升为超级管理员'
        });
      }
    } else if (req.user.role === 'admin') {
      // 管理员只能修改自己创建的操作员，且不能修改自己的账号（除了自己的个人信息）
      if (administrator._id.toString() !== req.user.id) {
        if (administrator.role !== 'operator' || administrator.createdBy?.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: '只能修改自己创建的操作员账号'
          });
        }
      }
      // 管理员不能修改角色
      if (role && role !== administrator.role) {
        return res.status(403).json({
          success: false,
          message: '管理员不能修改用户角色'
        });
      }
    } else {
      // 其他角色无权修改
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    // 不能禁用自己
    if (administrator._id.toString() === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: '不能禁用自己的账户'
      });
    }

    // 不能禁用超级管理员
    if (administrator.role === 'super_admin' && isActive === false) {
      return res.status(400).json({
        success: false,
        message: '超级管理员不能被禁用'
      });
    }
    
    // 更新字段
    if (realName) administrator.realName = realName;
    if (email) administrator.email = email;
    if (phone) administrator.phone = phone;
    if (role) administrator.role = role;
    if (permissions) administrator.permissions = permissions;
    if (typeof isActive === 'boolean') administrator.isActive = isActive;
    if (remark !== undefined) administrator.remark = remark;
    
    await administrator.save();
    
    res.status(200).json({
      success: true,
      message: '操作员更新成功',
      data: {
        administrator: {
          id: administrator._id,
          username: administrator.username,
          realName: administrator.realName,
          email: administrator.email,
          phone: administrator.phone,
          role: administrator.role,
          permissions: administrator.getRolePermissions(),
          isActive: administrator.isActive,
          remark: administrator.remark
        }
      }
    });
  } catch (error) {
    console.error('更新操作员失败:', error);
    res.status(500).json({
      success: false,
      message: '更新操作员失败',
      error: error.message
    });
  }
};

// 删除操作员（需要admin_manage权限）
exports.deleteAdministrator = async (req, res) => {
  try {
    const { id } = req.params;
    
    const administrator = await Administrator.findById(id);
    if (!administrator) {
      return res.status(404).json({
        success: false,
        message: '操作员不存在'
      });
    }
    
    // 不能删除自己
    if (administrator._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }
    
    // 权限检查
    if (req.user.role === 'super_admin') {
      // 超级管理员不能删除其他超级管理员
      if (administrator.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: '不能删除其他超级管理员'
        });
      }
    } else if (req.user.role === 'admin') {
      // 管理员只能删除自己创建的操作员
      if (administrator.role !== 'operator' || administrator.createdBy?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '只能删除自己创建的操作员账号'
        });
      }
    } else {
      // 其他角色无权删除
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    await Administrator.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: '操作员删除成功'
    });
  } catch (error) {
    console.error('删除操作员失败:', error);
    res.status(500).json({
      success: false,
      message: '删除操作员失败',
      error: error.message
    });
  }
};

// 修改操作员密码
exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 验证新密码格式
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '新密码不能少于8位'
      });
    }
    
    // 验证密码必须包含字母和数字
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: '密码必须由字母和数字组成'
      });
    }
    
    // 获取操作员信息（包含密码）
    const admin = await Administrator.findById(req.user.id).select('+password');
    
    // 验证当前密码
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '当前密码不正确'
      });
    }
    
    // 更新密码
    admin.password = newPassword;
    await admin.save();
    
    res.status(200).json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    });
  }
};

// 重置操作员密码（只有超级管理员可以重置密码）
exports.resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // 只有超级管理员可以重置密码
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有超级管理员可以重置密码'
      });
    }
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供新密码'
      });
    }
    
    const administrator = await Administrator.findById(id);
    if (!administrator) {
      return res.status(404).json({
        success: false,
        message: '操作员不存在'
      });
    }
    
    // 不能重置自己的密码（应该使用修改密码功能）
    if (administrator._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能重置自己的密码，请使用修改密码功能'
      });
    }
    
    // 不能重置其他超级管理员的密码
    if (administrator.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '不能重置其他超级管理员的密码'
      });
    }
    
    // 重置密码
    administrator.password = newPassword;
    await administrator.save();
    
    res.status(200).json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
      error: error.message
    });
  }
}; 