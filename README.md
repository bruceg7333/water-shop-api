# 水商城后端 API

## 项目说明

这是水商城小程序的后端 API 服务，提供了用户管理、商品管理、购物车、订单管理等功能。

## 环境要求

- Node.js >= 14
- MongoDB >= 4.4
- npm 或 yarn

## 安装依赖

```bash
npm install
# 或者使用 yarn
yarn
```

## 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm run start
```

默认情况下，API 服务运行在 http://localhost:5001

## 添加测试数据

可以通过以下脚本添加测试数据到数据库：

### 1. 添加测试订单

```bash
node scripts/generate-orders.js
```

### 2. 添加测试评论

```bash
node addTestReviews.js
# 或
node scripts/generate-reviews.js
```

## API 文档

API 基础路径: `http://localhost:5001/api`

### 主要 API 功能模块:

- 用户管理 - `/users`
- 商品管理 - `/products`
- 购物车 - `/cart`
- 订单管理 - `/orders`
- 收藏管理 - `/favorites` 
- 评论管理 - `/reviews`
- 优惠券 - `/coupons`
- 地址管理 - `/addresses`

## 常见问题

### 如果前端连接不上后端 API

1. 确保 MongoDB 服务正在运行
2. 确保后端 API 服务启动成功
3. 检查前端 `utils/request.js` 中的 `BASE_URL` 是否正确指向后端 API 服务地址
4. 如果使用移动设备开发，确保移动设备和开发机器在同一网络环境，并使用开发机器的局域网 IP 替换 localhost 