# SPRINKLE 水商城后端 API

## 项目简介

SPRINKLE 水商城后端 API 是一个基于 Node.js + Express + MongoDB 的 RESTful API 服务，为水商城小程序和管理后台提供完整的业务数据接口，包括用户管理、商品管理、订单处理、支付集成等核心功能。

## 技术栈

### 后端框架
- **Node.js** - JavaScript 运行时环境
- **Express.js** - 轻量级 Web 应用框架
- **MongoDB** - NoSQL 文档数据库
- **Mongoose** - MongoDB 对象建模工具

### 安全认证
- **JWT (jsonwebtoken)** - 用户身份验证和授权
- **bcryptjs** - 密码加密和验证
- **CORS** - 跨域资源共享配置

### 文件处理
- **Multer** - 文件上传中间件
- **Sharp** - 图像处理和优化
- **XLSX** - Excel 文件处理

### 开发工具
- **Nodemon** - 开发环境自动重启
- **Morgan** - HTTP 请求日志记录
- **Dotenv** - 环境变量管理

### 测试工具
- **MongoDB Memory Server** - 内存数据库测试
- **Axios** - HTTP 客户端测试
- **Form-data** - 表单数据处理

## 软件架构

### 目录结构
```
src/
├── config/           # 配置文件
│   ├── database.js   # 数据库连接配置
│   └── config.js     # 应用配置
├── controllers/      # 业务逻辑控制器
│   ├── userController.js         # 用户管理
│   ├── productController.js      # 商品管理
│   ├── orderController.js        # 订单管理
│   ├── cartController.js         # 购物车管理
│   ├── couponController.js       # 优惠券管理
│   ├── paymentController.js      # 支付处理
│   ├── addressController.js      # 地址管理
│   ├── favoriteController.js     # 收藏管理
│   ├── reviewController.js       # 评论管理
│   ├── pointController.js        # 积分管理
│   ├── bannerController.js       # 轮播图管理
│   ├── articleController.js      # 文章管理
│   ├── administratorController.js # 管理员管理
│   └── uploadController.js       # 文件上传
├── models/           # 数据模型
│   ├── user.js       # 用户模型
│   ├── product.js    # 商品模型
│   ├── order.js      # 订单模型
│   ├── cart.js       # 购物车模型
│   ├── coupon.js     # 优惠券模型
│   ├── userCoupon.js # 用户优惠券关联
│   ├── address.js    # 地址模型
│   ├── favorite.js   # 收藏模型
│   ├── review.js     # 评论模型
│   ├── pointRecord.js # 积分记录
│   ├── banner.js     # 轮播图模型
│   ├── article.js    # 文章模型
│   └── administrator.js # 管理员模型
├── routes/           # 路由定义
├── middlewares/      # 中间件
├── utils/            # 工具函数
├── app.js            # 应用入口
└── public/           # 静态文件
    └── uploads/      # 上传文件存储
```

### 架构特点
- **RESTful API 设计**: 遵循 REST 架构风格，提供清晰的接口规范
- **MVC 架构模式**: 模型-视图-控制器分离，代码结构清晰
- **中间件机制**: 灵活的请求处理流程，支持认证、日志、错误处理
- **数据库抽象**: 使用 Mongoose ODM，提供类型安全和数据验证

## 功能清单

### 🔐 用户认证 (Authentication)
- **用户注册**: 手机号/用户名注册，密码加密存储
- **用户登录**: JWT Token 认证，支持小程序 openid 登录
- **密码管理**: 密码修改、找回功能
- **会话管理**: Token 刷新、登出处理

### 👤 用户管理 (User Management)
- **个人信息**: 用户资料查看、编辑
- **头像上传**: 支持图片上传和处理
- **积分系统**: 积分获取、消费、记录查询
- **会员等级**: 基于消费的会员体系

### 📦 商品管理 (Product Management)
- **商品 CRUD**: 商品的增删改查操作
- **分类管理**: 商品分类体系
- **库存管理**: 库存数量、状态控制
- **图片管理**: 商品主图、详情图上传
- **规格管理**: 商品规格参数设置
- **评分系统**: 商品评分统计

### 🛒 购物车管理 (Cart Management)
- **购物车操作**: 添加、删除、修改商品
- **数量控制**: 商品数量增减
- **规格选择**: 商品规格变更
- **批量操作**: 批量删除、清空购物车

### 📋 订单管理 (Order Management)
- **订单创建**: 从购物车生成订单
- **订单状态**: 待付款、待发货、待收货、已完成、已取消
- **订单查询**: 按状态、时间范围查询
- **订单详情**: 完整订单信息展示
- **订单统计**: 销售数据统计分析

### 💳 支付管理 (Payment Management)
- **支付方式**: 微信支付、货到付款
- **支付状态**: 支付成功、失败处理
- **退款处理**: 订单退款功能
- **支付记录**: 支付流水查询

### 📍 地址管理 (Address Management)
- **收货地址**: 地址的增删改查
- **默认地址**: 默认收货地址设置
- **地址验证**: 地址信息格式验证

### ❤️ 收藏管理 (Favorite Management)
- **商品收藏**: 收藏、取消收藏
- **收藏列表**: 用户收藏商品查询
- **收藏统计**: 收藏数量统计

### ⭐ 评论管理 (Review Management)
- **商品评论**: 用户评论发布
- **评分系统**: 1-5 星评分
- **评论审核**: 评论内容审核
- **评论统计**: 评论数量、平均评分

### 🎫 优惠券管理 (Coupon Management)
- **优惠券类型**: 满减券、折扣券、免邮券
- **发放管理**: 优惠券发放、领取
- **使用规则**: 使用条件、有效期控制
- **使用记录**: 优惠券使用历史

### 🖼️ 轮播图管理 (Banner Management)
- **轮播图 CRUD**: 轮播图的增删改查
- **图片上传**: 轮播图图片处理
- **链接管理**: 轮播图跳转链接
- **排序控制**: 轮播图显示顺序

### 📝 内容管理 (Content Management)
- **文章管理**: 文章的增删改查
- **富文本编辑**: 支持富文本内容
- **分类管理**: 文章分类体系
- **发布控制**: 文章发布状态管理

### 👨‍💼 管理员管理 (Administrator Management)
- **管理员账号**: 管理员的增删改查
- **权限控制**: 基于角色的权限管理
- **操作日志**: 管理员操作记录
- **登录认证**: 管理员登录验证

### 📁 文件上传 (File Upload)
- **图片上传**: 支持多种图片格式
- **文件处理**: 图片压缩、格式转换
- **存储管理**: 本地文件存储
- **访问控制**: 文件访问权限

## 数据模型

### 用户模型 (User)
```javascript
{
  username: String,      // 用户名
  password: String,      // 加密密码
  phone: String,         // 手机号
  avatar: String,        // 头像URL
  nickName: String,      // 昵称
  gender: String,        // 性别
  birthday: Date,        // 生日
  email: String,         // 邮箱
  role: String,          // 角色
  openid: String,        // 微信openid
  points: Number,        // 积分
  isActive: Boolean,     // 账号状态
  lastLogin: Date        // 最后登录时间
}
```

### 商品模型 (Product)
```javascript
{
  name: String,          // 商品名称
  description: String,   // 商品描述
  price: Number,         // 商品价格
  imageUrl: String,      // 主图URL
  imageGallery: [String], // 图片集
  sales: Number,         // 销量
  stock: Number,         // 库存
  tag: String,           // 商品标签
  category: String,      // 商品分类
  isActive: Boolean,     // 上架状态
  status: String,        // 商品状态
  rating: Number,        // 评分
  ratingsCount: Number   // 评分数量
}
```

### 订单模型 (Order)
```javascript
{
  user: ObjectId,        // 用户ID
  orderItems: [{         // 订单商品
    product: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    spec: String
  }],
  shippingAddress: {     // 收货地址
    name: String,
    phone: String,
    province: String,
    city: String,
    district: String,
    address: String
  },
  paymentMethod: String, // 支付方式
  itemsPrice: Number,    // 商品总价
  shippingPrice: Number, // 运费
  totalPrice: Number,    // 订单总价
  usedCoupon: ObjectId,  // 使用的优惠券
  discountAmount: Number, // 优惠金额
  isPaid: Boolean,       // 支付状态
  isDelivered: Boolean,  // 发货状态
  status: String,        // 订单状态
  orderNumber: String,   // 订单号
  remark: String         // 备注
}
```

## API 接口

### 基础路径
- 开发环境: `http://localhost:5001/api`
- 生产环境: 根据实际部署配置

### 接口模块
- **用户相关**: `/api/users`
- **商品相关**: `/api/products`
- **购物车相关**: `/api/cart`
- **订单相关**: `/api/orders`
- **地址相关**: `/api/addresses`
- **支付相关**: `/api/payments`
- **收藏相关**: `/api/favorites`
- **评论相关**: `/api/reviews`
- **优惠券相关**: `/api/coupons`
- **文章相关**: `/api/articles`
- **积分相关**: `/api/points`
- **管理员相关**: `/api/admin`
- **文件上传**: `/api/upload`
- **轮播图相关**: `/api/banners`

### 认证机制
- 使用 JWT Token 进行用户认证
- Token 在请求头中传递: `Authorization: Bearer <token>`
- 管理员接口需要额外的权限验证

## 开发环境

### 环境要求
- Node.js >= 14.0.0
- MongoDB >= 4.4.0
- npm >= 6.0.0

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env` 文件：
```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/water-shop
JWT_SECRET=your-jwt-secret-key
USE_MEMORY_DB=false
```

### 启动服务
```bash
# 开发环境（自动重启）
npm run dev

# 生产环境
npm run start
```


### 本地启动Mongodb 数据库
```bash
docker-compose up

```

### 数据初始化 (必须先执行这个!!!!,不然admin不可用)
```bash
# 添加测试数据
npm run seed

# 创建测试用户
npm run system-init
```

## 部署说明

### 生产环境配置
1. 设置环境变量
2. 配置 MongoDB 连接
3. 设置 JWT 密钥
4. 配置文件上传路径

### PM2 部署
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name water-shop-api

# 查看状态
pm2 status

# 查看日志
pm2 logs water-shop-api
```

### Docker 部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 安全考虑

### 数据安全
- 密码使用 bcrypt 加密存储
- JWT Token 设置合理过期时间
- 敏感信息不在日志中输出

### 接口安全
- CORS 跨域配置
- 请求频率限制
- 输入数据验证和过滤
- SQL 注入防护（NoSQL 注入）

### 文件安全
- 文件类型验证
- 文件大小限制
- 文件名安全处理
- 上传路径控制

## 监控和日志

### 请求日志
- 使用 Morgan 记录 HTTP 请求
- 自定义日志中间件记录详细信息
- 错误日志单独记录

### 性能监控
- 数据库查询性能监控
- API 响应时间统计
- 内存使用情况监控

## 常见问题

### 1. 数据库连接失败
- 检查 MongoDB 服务是否启动
- 验证连接字符串是否正确
- 检查网络连接和防火墙设置

### 2. JWT Token 验证失败
- 确认 JWT_SECRET 配置正确
- 检查 Token 是否过期
- 验证 Token 格式是否正确

### 3. 文件上传失败
- 检查上传目录权限
- 验证文件大小和格式限制
- 确认磁盘空间是否充足

### 4. API 请求跨域问题
- 检查 CORS 配置
- 验证请求头设置
- 确认前端请求地址正确

## 开发规范

### 代码规范
- 使用 ES6+ 语法
- 遵循 RESTful API 设计原则
- 统一的错误处理机制
- 完善的输入验证

### 提交规范
- feat: 新功能
- fix: 修复问题
- docs: 文档更新
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 技术支持

如有问题或建议，请联系开发团队或提交 Issue。

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的用户管理功能
- 商品和订单管理
- 支付集成
- 优惠券系统 