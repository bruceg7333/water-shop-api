const mongoose = require('mongoose');

// 直接使用MongoDB URI，避免依赖配置文件
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/water-shop';

// 连接到MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB连接成功:', MONGO_URI);
  clearFavorites();
})
.catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

async function clearFavorites() {
  try {
    // 直接使用mongoose删除collection中的所有文档
    const result = await mongoose.connection.collection('favorites').deleteMany({});
    
    console.log(`成功删除${result.deletedCount}条收藏记录`);
    console.log('收藏数据库已清空');
    
    // 关闭连接
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('清空收藏数据库失败:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 