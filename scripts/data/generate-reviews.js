/**
 * 生成随机商品评论数据
 * 用法：node scripts/generate-reviews.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 载入环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

// 连接MongoDB数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB 连接成功');
}).catch(err => {
  console.error('MongoDB 连接失败', err);
  process.exit(1);
});

// 加载模型
const Product = require('../src/models/product');
const User = require('../src/models/user');
const Review = require('../src/models/review');
const Order = require('../src/models/order');

// 模拟评论内容
const reviewTemplates = [
  {
    positive: [
      "非常满意的购物体验，水质清甜，口感很好。",
      "包装非常精美，收到后就迫不及待地尝了一口，很满意！",
      "这款水真的很赞，以后就认准这一家了。",
      "喝过很多品牌的水，这款的口感是最好的，非常甘甜。",
      "水的口感很纯净，没有异味，很满意。",
      "朋友推荐买的，确实名不虚传，下次还会再来。",
      "物流很快，包装也很好，没有破损，水质很好。",
      "平时很少评价，但这款水真的让我忍不住想推荐给大家。",
      "孩子很喜欢喝，我也觉得口感很好，会一直回购。",
      "日常饮用的好选择，价格也很实惠，推荐给大家。"
    ],
    neutral: [
      "水质还可以，不过包装有点简陋。",
      "口感一般，但胜在价格实惠。",
      "配送速度还行，但偶尔会有瓶盖松动的情况。",
      "比超市买的要便宜一些，味道还行。",
      "没什么特别的，就是普通的矿泉水，但价格还算合理。",
      "水是没问题的，就是包装盒有点破损，希望以后能改进。",
      "味道不错，就是觉得有点小贵。",
      "第二次购买了，品质挺稳定的，但没有什么惊喜。"
    ],
    negative: [
      "收到后发现有一瓶瓶盖松了，有点失望。",
      "物流太慢了，等了一周才收到。",
      "价格有点贵，没有想象中的那么好喝。",
      "包装破损，里面的水洒了不少，很不满意。",
      "喝起来有股塑料味，不太喜欢。",
      "感觉跟普通自来水没什么区别，有点失望。"
    ]
  },
  {
    positive: [
      "这个水壶设计很人性化，倒水很顺畅不会洒。",
      "材质很好，非常适合户外使用，很结实。",
      "比我之前用的水壶好太多了，保温效果很好。",
      "外观设计时尚，拿出去很有面子，同事都问我在哪买的。",
      "水壶的开口设计很贴心，清洗很方便。",
      "防漏效果很好，放在包里一整天也没有渗水。",
      "手感非常舒适，拿着去健身房很方便。",
      "保温效果超棒，放了一晚上水还是热的。",
      "颜色很漂亮，实物和图片一样好看。",
      "送给朋友的礼物，他非常喜欢，质量很好。"
    ],
    neutral: [
      "质量还行，但颜色和图片有些差异。",
      "保温效果一般，但胜在外观好看。",
      "用着还行，就是有点重，不太适合长途携带。",
      "价格合适，做工中规中矩，没什么亮点。",
      "瓶口有点小，倒水不太方便，但质量还好。",
      "比预想的要小一些，但总体还算满意。"
    ],
    negative: [
      "收到就发现有划痕，包装也很粗糙。",
      "保温效果很差，放一会儿就凉了。",
      "用了一周瓶盖就坏了，质量堪忧。",
      "味道太重了，泡什么都带塑料味。",
      "太重了，提着很累，不适合外出使用。",
      "清洗很麻烦，瓶口太小了，刷不到底部。"
    ]
  },
  {
    positive: [
      "这个滤水器效果很好，过滤后的水喝起来特别干净。",
      "安装非常简单，几分钟就搞定了，过滤效果明显。",
      "用了一个月了，水质确实改善了很多，很满意。",
      "滤芯更换提示很贴心，不用担心忘记更换。",
      "设计很漂亮，放在厨房很有格调，也不占地方。",
      "过滤速度很快，水流量也很理想，全家人都很喜欢。",
      "买来送给父母，老人家用着很方便，水质也提升了。",
      "性价比很高，比其他品牌便宜但效果不差。",
      "全家人都反馈喝了这个滤水器过滤的水感觉更健康了。",
      "做菜做饭用这个过滤的水，感觉连饭菜的味道都提升了。"
    ],
    neutral: [
      "滤水效果可以，就是滤芯寿命短了点。",
      "外观还行，但安装有点麻烦。",
      "水流有点小，过滤速度不太理想，但水质确实提升了。",
      "性价比一般，不过胜在滤芯好买。",
      "用着还好，就是噪音有点大。",
      "过滤效果挺明显的，但有时候会漏水，需要多加注意。"
    ],
    negative: [
      "安装复杂又没有详细说明，最后找物业帮忙才装好。",
      "用了不到一个月就开始漏水，客服也不给解决。",
      "滤芯太贵了，用不起，一点也不划算。",
      "过滤效果很差，基本没什么变化，浪费钱。",
      "噪音太大了，晚上接水声音吵得睡不着。",
      "跟介绍完全不符，失望透顶，不推荐购买。"
    ]
  }
];

// 各种口味和特点的描述
const waterDescriptions = {
  taste: ["甜", "醇", "清爽", "润滑", "清新", "柔和", "纯净", "自然", "平衡", "丰富"],
  feeling: ["顺滑", "爽口", "舒适", "解渴", "满足", "愉悦", "放松", "清凉", "轻盈"],
  benefit: ["对健康很有益", "喝了精神特别好", "使人心情愉悦", "喝后感觉整个人都通透了", "很适合日常饮用"]
};

// 生成随机评论内容
function generateReviewText(rating, productType = 0) {
  // 选择评论模板类别
  let category;
  if (rating >= 4) {
    category = 'positive';
  } else if (rating >= 3) {
    category = 'neutral';
  } else {
    category = 'negative';
  }

  // 获取对应类别的评论模板
  const templates = reviewTemplates[productType % reviewTemplates.length][category];
  let comment = templates[Math.floor(Math.random() * templates.length)];

  // 高评分有机会添加更详细的描述
  if (rating >= 4 && Math.random() > 0.5) {
    const taste = waterDescriptions.taste[Math.floor(Math.random() * waterDescriptions.taste.length)];
    const feeling = waterDescriptions.feeling[Math.floor(Math.random() * waterDescriptions.feeling.length)];
    
    if (Math.random() > 0.7) {
      const benefit = waterDescriptions.benefit[Math.floor(Math.random() * waterDescriptions.benefit.length)];
      comment += ` 水质${taste}且${feeling}，${benefit}。`;
    } else {
      comment += ` 口感${taste}且${feeling}，推荐购买！`;
    }
  }

  return comment;
}

// 生成随机日期（1-6个月内）
function generateRandomDate() {
  const now = new Date();
  const monthsAgo = Math.floor(Math.random() * 6) + 1;
  const daysAgo = Math.floor(Math.random() * 30);
  now.setMonth(now.getMonth() - monthsAgo);
  now.setDate(now.getDate() - daysAgo);
  return now;
}

// 生成随机评分（偏向好评）
function generateRating() {
  const rand = Math.random();
  if (rand < 0.6) {
    return 5; // 60%的概率是5星
  } else if (rand < 0.85) {
    return 4; // 25%的概率是4星
  } else if (rand < 0.95) {
    return 3; // 10%的概率是3星
  } else {
    return Math.floor(Math.random() * 2) + 1; // 5%的概率是1-2星
  }
}

// 创建测试评论
async function createReviews() {
  try {
    console.log('开始生成评论数据...');

    // 获取所有产品和用户
    const products = await Product.find({});
    const users = await User.find({});

    if (products.length === 0 || users.length === 0) {
      console.error('错误: 没有找到产品或用户数据');
      process.exit(1);
    }

    console.log(`找到 ${products.length} 个产品和 ${users.length} 个用户`);

    // 删除现有评论数据（谨慎使用！）
    await Review.deleteMany({});
    console.log('已清除现有评论数据');

    // 创建一些模拟订单（如果需要）
    let orders = await Order.find({});

    if (orders.length < products.length * 2) {
      console.log('创建模拟订单...');
      
      // 为每个产品创建至少一个订单
      for (let i = 0; i < products.length; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const product = products[i];
        
        const orderItems = [{
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          image: product.imageUrl
        }];
        
        const order = new Order({
          user: user._id,
          orderItems,
          shippingAddress: {
            name: '测试用户',
            phone: '13800138000',
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            address: '科技园南区'
          },
          paymentMethod: '微信支付',
          itemsPrice: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          shippingPrice: 10,
          totalPrice: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + 10,
          isPaid: true,
          paidAt: generateRandomDate(),
          isDelivered: true,
          deliveredAt: generateRandomDate(),
          status: 'completed'
        });
        
        await order.save();
      }
      
      // 重新获取订单列表
      orders = await Order.find({});
      console.log(`创建了 ${orders.length} 个模拟订单`);
    }

    // 为每个产品生成不同数量的评论
    let totalReviews = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // 为每个产品生成2-15条评论
      const reviewCount = Math.floor(Math.random() * 14) + 2;
      
      console.log(`为产品 "${product.name}" 生成 ${reviewCount} 条评论`);
      
      // 筛选出属于该产品的订单
      const productOrders = orders.filter(order => 
        order.orderItems.some(item => item.product.toString() === product._id.toString())
      );
      
      // 如果没有该产品的订单，创建一个
      if (productOrders.length === 0) {
        console.log(`没有找到产品 "${product.name}" 的订单，创建一个...`);
        const user = users[Math.floor(Math.random() * users.length)];
        
        const orderItems = [{
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          image: product.imageUrl
        }];
        
        const newOrder = new Order({
          user: user._id,
          orderItems,
          shippingAddress: {
            name: '测试用户',
            phone: '13800138000',
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            address: '科技园南区'
          },
          paymentMethod: '微信支付',
          itemsPrice: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          shippingPrice: 10,
          totalPrice: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + 10,
          isPaid: true,
          paidAt: generateRandomDate(),
          isDelivered: true,
          deliveredAt: generateRandomDate(),
          status: 'completed'
        });
        
        await newOrder.save();
        productOrders.push(newOrder);
      }
      
      // 创建评论
      for (let j = 0; j < reviewCount; j++) {
        // 随机选择一个用户和订单
        const user = users[Math.floor(Math.random() * users.length)];
        const order = productOrders[Math.floor(Math.random() * productOrders.length)];
        
        // 生成随机评分和评论内容
        const rating = generateRating();
        const comment = generateReviewText(rating, i % 3);
        
        // 决定是否匿名
        const isAnonymous = Math.random() < 0.3; // 30%的概率匿名
        
        // 随机生成评论图片数量
        const imagesCount = Math.random() < 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
        const images = [];
        
        // 添加随机图片URL
        for (let k = 0; k < imagesCount; k++) {
          // 模拟图片URL（实际项目中应使用真实图片）
          images.push(`/assets/images/reviews/product_${product._id.toString().substring(0, 6)}_review_${j}_${k}.jpg`);
        }
        
        // 创建评论对象
        const review = new Review({
          user: user._id,
          product: product._id,
          order: order._id,
          rating,
          comment,
          images,
          likes: Math.floor(Math.random() * 20), // 随机点赞数
          isAnonymous,
          createdAt: generateRandomDate()
        });
        
        // 随机决定是否有店家回复
        if (Math.random() < 0.4) { // 40%的概率有回复
          review.isReplied = true;
          review.reply = {
            content: `感谢您的评价！我们一直致力于提供优质的产品和服务。${rating >= 4 ? '很高兴您喜欢我们的产品！' : '我们会根据您的反馈不断改进。'}`,
            replyAt: new Date(review.createdAt.getTime() + Math.random() * 86400000 * 3) // 1-3天内回复
          };
        }
        
        try {
          await review.save();
          totalReviews++;
        } catch (error) {
          // 如果是重复评论错误，跳过
          if (error.code === 11000) {
            console.log(`跳过重复评论: 用户 ${user._id} 对产品 ${product._id} 的订单 ${order._id}`);
          } else {
            console.error('评论创建失败:', error);
          }
        }
      }
    }

    console.log(`成功创建 ${totalReviews} 条评论数据！`);
    mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('发生错误:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// 执行创建评论的函数
createReviews();
