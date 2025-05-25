/**
 * 商品评价测试数据生成脚本
 * 运行方法：node addTestReviews.js
 */

// 连接数据库
const mongoose = require('mongoose');
const Product = require('./src/models/product');
const User = require('./src/models/user');
const Order = require('./src/models/order');
const Review = require('./src/models/review');

// MongoDB连接
mongoose.connect('mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

// 评价内容模板库
const reviewTemplates = [
  // 5星评价内容
  [
    "非常好的水，口感清甜，送货很快！每天都喝，已经是回头客了。",
    "这个牌子的水一直很信赖，家里常备，包装也很好看，价格实惠。",
    "水质特别好，口感清爽，每天两瓶，感觉很健康。很满意这次购物体验！",
    "朋友推荐的品牌，确实名不虚传，水很纯净，没有异味，全家都爱喝。",
    "物流超快，当天下单第二天就收到了。水的口感很好，买来给家里老人喝的，他们都很喜欢。",
    "喝了这么多年，一直很满意。纯净水中的上品，值得购买。",
    "服务态度很好，水的质量也不错，很满意这次购物体验。",
    "瓶子设计很人性化，水也很甜，没有杂质，家人都说好。",
    "这个水PH值很均衡，长期饮用对身体很好，已经是第五次购买了。",
    "质量很好，价格公道，全五星好评！"
  ],
  // 4星评价内容
  [
    "水的品质不错，就是包装有点简单，希望能改进一下外观设计。",
    "总体来说挺好的，口感清爽，就是价格略贵，希望能有更多优惠活动。",
    "水质不错，物流也很快，就是有一瓶盖子不太紧，不过问题不大。",
    "水源地很好，水质纯净，就是瓶身设计不太方便携带。下次还会购买。",
    "这款水口感不错，比超市买的要好，就是送货员把水放在楼下，自己搬上楼有点累。",
    "喝了一段时间了，感觉不错，水质很纯净。但是希望能有更环保的包装。",
    "水很好喝，就是价格比其他品牌贵一点，但是水质确实好，值得。",
    "整体满意，就是物流配送时间不太稳定，有时候很晚才送到。",
    "口感很好，送货也很准时，唯一不足就是活动力度不大，优惠少。",
    "水很干净，没有异味，就是最近涨价了，希望能保持原价。"
  ],
  // 3星评价内容
  [
    "水质一般，但胜在价格便宜，家里人觉得还行。",
    "包装不错，水的口感中规中矩，没有特别突出的地方。",
    "送货速度还可以，但水的口感比之前差了一些，希望能恢复以前的品质。",
    "不算特别好，但也不差，一分价钱一分货吧。期待有更多优惠。",
    "水温度有点偏高，口感一般，但价格便宜，还能接受。",
    "品质还行，就是包装有点旧，有几瓶盖子松动，需要改进。",
    "感觉水质和之前买的有点不一样，希望厂家能保持品质稳定。",
    "普普通通的水，没什么特色，就当解渴用吧。",
    "感觉和超市买的差别不大，优势是送货上门比较方便。",
    "中规中矩，没有惊喜也没有失望，一般般吧。"
  ],
  // 2星评价内容
  [
    "水的味道有点怪，不太满意，可能不会再买了。",
    "包装很随意，有几瓶还有点漏水，希望商家能注意一下质量控制。",
    "送货太慢了，等了三天才收到，而且水的口感也很一般。",
    "价格不便宜，但质量一般，性价比不高，有点失望。",
    "瓶子设计不太好，拿取不方便，水质也就那样吧。",
    "有异味，感觉不是很纯净，和宣传的有差距。",
    "物流太慢，客服态度也不好，水质一般，不推荐。",
    "收到后发现生产日期很久以前的，而且口感也不好，很失望。",
    "水有点浑浊，不够清澈，喝起来口感也不佳，下次不会再买了。",
    "两箱水里有三瓶盖子松动，还好没完全漏，但也很影响体验。"
  ],
  // 1星评价内容
  [
    "水质太差，有异味，一点都不纯净，非常失望！",
    "包装破损严重，有几瓶漏水弄湿了其他物品，客服也不给解决，态度很差！",
    "价格贵得离谱，结果水质比普通自来水好不到哪去，绝对不会再买！",
    "送来的水已经过期了，商家还不给退，太不负责任了！",
    "物流慢得令人发指，十天才到，还少了两瓶，各方面体验极差！",
    "打开瓶盖发现有杂质，绝对不敢喝，但是商家却说这是正常现象，太离谱了！",
    "水有股塑料味，喝了会感觉不舒服，差评！",
    "下单十瓶只送来八瓶，联系客服推脱责任，服务态度极差！",
    "产品完全不符合描述，而且开封就有异味，非常糟糕的购物体验！",
    "瓶子材质很差，放几天就变形了，水质也远不如宣传的那么好，太坑了！"
  ]
];

// 常见用户名
const userNames = [
  '张三', '李四', '王五', '赵六', '刘七', '孙八', '周九', 
  '吴十', '郑十一', '王小明', '李小红', '张小花', '刘大壮', 
  '陈梦琪', '王子豪', '林小雨', '张雨晴', '王佳怡', '李晓明',
  '陈晓', '林小鹿', '黄小米', '赵小云', '钱多多', '孙甜甜'
];

// 常见评价图片
const imageUrls = [
  '/static/images/reviews/review1.jpg',
  '/static/images/reviews/review2.jpg',
  '/static/images/reviews/review3.jpg',
  '/static/images/reviews/review4.jpg',
  '/static/images/reviews/review5.jpg',
  '/static/images/reviews/water1.jpg',
  '/static/images/reviews/water2.jpg',
  '/static/images/reviews/water3.jpg',
  '/static/images/reviews/water4.jpg'
];

// 随机生成一个日期，在过去的60天内
const randomDate = () => {
  const now = new Date();
  const pastDays = Math.floor(Math.random() * 60);
  now.setDate(now.getDate() - pastDays);
  return now;
};

// 随机生成评论数据
const generateRandomReview = async (userId, productId, orderId) => {
  // 随机评分 1-5星
  const rating = Math.floor(Math.random() * 5) + 1;
  
  // 根据评分选择对应的评价内容模板
  const templates = reviewTemplates[5 - rating];
  const commentIndex = Math.floor(Math.random() * templates.length);
  const comment = templates[commentIndex];
  
  // 随机决定是否匿名 (20%概率匿名)
  const isAnonymous = Math.random() < 0.2;
  
  // 随机决定是否添加图片 (30%概率添加)
  let images = [];
  if (Math.random() < 0.3) {
    // 添加1-3张随机图片
    const imageCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < imageCount; i++) {
      const imageIndex = Math.floor(Math.random() * imageUrls.length);
      images.push(imageUrls[imageIndex]);
    }
  }
  
  // 随机点赞数 (0-20)
  const likes = Math.floor(Math.random() * 21);
  
  // 构建评价对象
  return {
    user: userId,
    product: productId,
    order: orderId,
    rating,
    comment,
    images,
    likes,
    isAnonymous,
    createdAt: randomDate()
  };
};

// 主函数：添加测试评价
const addTestReviews = async () => {
  try {
    // 获取所有商品
    const products = await Product.find();
    if (products.length === 0) {
      console.log('没有找到商品，请先添加商品数据');
      return;
    }
    
    // 获取所有用户
    const users = await User.find();
    if (users.length === 0) {
      console.log('没有找到用户，请先添加用户数据');
      
      // 创建一个默认用户用于测试
      const defaultUser = new User({
        username: 'testuser',
        password: 'password123',
        nickName: '测试用户',
        phone: '13800138000'
      });
      await defaultUser.save();
      users.push(defaultUser);
      console.log('已创建默认测试用户');
    }
    
    // 清空所有现有评价
    await Review.deleteMany({});
    console.log('已清空现有评价数据');
    
    // 为每个商品添加随机数量的评价
    for (const product of products) {
      // 随机决定该商品的评价数量 (1-15条)
      const reviewCount = Math.floor(Math.random() * 15) + 1;
      console.log(`为商品 ${product.name} 添加 ${reviewCount} 条评价`);
      
      for (let i = 0; i < reviewCount; i++) {
        // 随机选择一个用户
        const randomUserIndex = Math.floor(Math.random() * users.length);
        const user = users[randomUserIndex];
        
        // 创建一个测试订单(如果需要的话)
        let orderId;
        const existingOrder = await Order.findOne({ user: user._id });
        
        if (existingOrder) {
          orderId = existingOrder._id;
        } else {
          // 创建一个新订单
          const newOrder = new Order({
            user: user._id,
            orderItems: [{
              product: product._id,
              name: product.name,
              price: product.price,
              quantity: 1,
              image: product.imageUrl
            }],
            shippingAddress: {
              name: userNames[Math.floor(Math.random() * userNames.length)],
              phone: '138' + Math.floor(Math.random() * 100000000),
              province: '广东省',
              city: '深圳市',
              district: '南山区',
              address: '科技园南区'
            },
            itemsPrice: product.price,
            shippingPrice: 10,
            totalPrice: product.price + 10,
            isPaid: true,
            paidAt: new Date(),
            isDelivered: true,
            deliveredAt: new Date(),
            status: 'completed'
          });
          
          await newOrder.save();
          orderId = newOrder._id;
        }
        
        // 生成随机评价数据
        const reviewData = await generateRandomReview(user._id, product._id, orderId);
        
        // 保存评价到数据库
        const review = new Review(reviewData);
        await review.save();
      }
    }
    
    console.log('成功添加测试评价数据！');
    process.exit(0);
  } catch (error) {
    console.error('添加测试评价数据失败:', error);
    process.exit(1);
  }
};

// 执行主函数
addTestReviews(); 