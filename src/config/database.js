const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// 全局保存MongoMemoryServer实例，避免每次重连时创建新实例
let mongod = null;

const connectDB = async () => {
  // 开发环境使用设置
  const useInMemoryDB = process.env.USE_MEMORY_DB === 'true' || false; // 默认不使用内存数据库

  try {
    let dbURI;
    
    if (useInMemoryDB) {
      console.log('使用内存数据库...');
      // 如果实例不存在，创建新实例
      if (!mongod) {
        mongod = await MongoMemoryServer.create();
      }
      dbURI = mongod.getUri();
    } else {
      // 使用本地MongoDB
      dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/water-shop';
      console.log(`尝试连接到MongoDB: ${dbURI}`);
    }
    
    // 连接数据库
    const conn = await mongoose.connect(dbURI);
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 