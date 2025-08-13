/**
 * 全局配置文件
 */

module.exports = {
  // 数据库配置
  mongoURI: process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/water-shop?authSource=admin',
  
  // JWT配置
  jwtSecret: process.env.JWT_SECRET || 'water-shop-api-secret',
  jwt: {
    secret: process.env.JWT_SECRET || 'water-shop-api-secret',
    expiresIn: '7d' // 令牌过期时间
  },
  
  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APPID || 'wxf08bb728186ba02c', // 实际AppID
    appSecret: process.env.WECHAT_APPSECRET || '07b67bd8250827b91cfb07221cb0e664' // 实际AppSecret
  },
  
  // 服务器配置
  server: {
    port: process.env.PORT || 5001,
    env: process.env.NODE_ENV || 'development'
  }
}; 