const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  const useInMemoryDB = process.env.USE_MEMORY_DB === 'true' || false;

  try {
    let dbURI;
    
    if (useInMemoryDB) {
      console.log('使用内存数据库...');
      if (!mongod) {
        mongod = await MongoMemoryServer.create();
      }
      dbURI = mongod.getUri();
    } else {
      // Updated connection string to match docker-compose
      dbURI = process.env.MONGO_URI
      console.log(`尝试连接到MongoDB: ${dbURI}`);
    }
    
    const conn = await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;