const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Article = require('../src/models/article');

// 加载环境变量
dotenv.config();

// 连接到数据库
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/water-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('已连接到数据库');
  seedArticles();
}).catch(err => {
  console.error('数据库连接错误', err);
  process.exit(1);
});

// 测试文章数据
const articles = [
  {
    title: '每天应该喝多少水？科学饮水指南',
    summary: '了解成年人每日饮水量推荐标准以及影响饮水需求的各种因素',
    content: `<div class="article-content">
      <p>水是生命之源，是维持人体正常生理功能的重要物质。但是，你是否知道每天究竟应该喝多少水才合适？</p>
      <h2>成人每日饮水量建议</h2>
      <p>根据中国营养学会建议，成年人每天的饮水量应在1500-1700毫升左右，即7-8杯水（每杯约200毫升）。而美国国家医学科学院则建议，成年男性每日总水摄入量应达到约3.7升（包括食物中的水分），成年女性约为2.7升。</p>
      <p>不过，每个人的饮水需求并非一成不变，它受到多种因素的影响：</p>
      <h2>影响饮水需求的因素</h2>
      <ul>
        <li><strong>体重</strong>：体重越大，所需水分越多。一种简单的计算方法是每公斤体重需要30-40毫升水。</li>
        <li><strong>年龄</strong>：随着年龄增长，体内水分比例降低，但饮水需求仍然存在。老年人可能对口渴感不敏感，更需注意主动饮水。</li>
        <li><strong>活动水平</strong>：运动会增加出汗量，需要额外补充水分。一般建议运动前、中、后都应适量补水。</li>
        <li><strong>气候环境</strong>：高温或干燥环境会增加水分流失，需增加饮水量。</li>
        <li><strong>健康状况</strong>：某些疾病(如发热、腹泻)会增加水分流失；某些药物也会影响体内水分平衡。</li>
      </ul>
      <h2>如何判断是否喝够水？</h2>
      <p>最简单的方法是观察尿液颜色。健康状态下，尿液应呈淡黄色。如果尿液颜色较深，则可能是缺水的信号；如果尿液几乎透明，则可能是水分摄入过多。</p>
      <h2>科学饮水小贴士</h2>
      <ul>
        <li>养成规律饮水习惯，不要等到口渴才喝水</li>
        <li>早晨起床后、餐前30分钟、运动前后都是饮水的好时机</li>
        <li>水温以室温为宜，过冷或过热的水不利于吸收</li>
        <li>少量多次比一次大量饮水更有利于身体吸收</li>
        <li>注意水质安全，选择可靠的饮用水源</li>
      </ul>
      <p>记住，保持良好的水分平衡是维护健康的基础。通过科学饮水，让水成为你健康生活的重要伙伴！</p>
    </div>`,
    imageUrl: '/assets/images/articles/article1.jpg',
    category: 'health',
    author: '营养师 李明',
    tags: ['健康', '饮水', '营养'],
    publishDate: new Date('2024-04-10'),
    views: 1254,
    shares: 328,
    isPublished: true
  },
  {
    title: '不同类型饮用水的区别与选择',
    summary: '纯净水、矿泉水、蒸馏水、苏打水等饮用水种类的特点及适用人群',
    content: `<div class="article-content">
      <p>超市货架上琳琅满目的各种水，你真的了解它们的区别吗？本文将帮你明晰不同类型饮用水的特点，做出适合自己的选择。</p>
      <h2>常见饮用水类型及特点</h2>
      <h3>1. 纯净水</h3>
      <p><strong>特点</strong>：通过反渗透、蒸馏、电渗析等工艺处理，去除了水中的杂质、微生物和大部分矿物质。</p>
      <p><strong>优点</strong>：纯度高，不含污染物，口感清淡。</p>
      <p><strong>适用人群</strong>：适合大多数人群日常饮用，尤其是对水质安全要求较高的人群。</p>
      
      <h3>2. 矿泉水</h3>
      <p><strong>特点</strong>：来自地下深处，含有天然矿物质和微量元素，如钙、镁、钾等。</p>
      <p><strong>优点</strong>：富含有益矿物质，可补充人体所需微量元素。</p>
      <p><strong>适用人群</strong>：适合需要补充矿物质的人群，如经常运动的人、骨质疏松风险人群等。</p>
      
      <h3>3. 蒸馏水</h3>
      <p><strong>特点</strong>：通过蒸馏过程去除了几乎所有溶解性物质。</p>
      <p><strong>优点</strong>：纯度极高，几乎不含任何杂质。</p>
      <p><strong>适用人群</strong>：主要用于医疗、实验室等特殊用途，不建议长期作为日常饮用水。</p>
      
      <h3>4. 苏打水</h3>
      <p><strong>特点</strong>：含有碳酸氢钠，有气泡，呈弱碱性。</p>
      <p><strong>优点</strong>：可中和胃酸，帮助消化，口感独特。</p>
      <p><strong>适用人群</strong>：适合偶尔饮用，特别是饭后有助消化，但不建议作为主要饮用水。</p>
      
      <h3>5. 电解水</h3>
      <p><strong>特点</strong>：通过电解过程调整水的pH值，制成碱性水。</p>
      <p><strong>优点</strong>：支持者认为可以中和体内酸性物质，改善健康。</p>
      <p><strong>适用人群</strong>：科学证据有限，建议谨慎选择。</p>
      
      <h2>如何根据个人需求选择饮用水？</h2>
      <ul>
        <li><strong>追求安全与纯净</strong>：选择纯净水</li>
        <li><strong>需要补充矿物质</strong>：选择矿泉水</li>
        <li><strong>需要助消化</strong>：可偶尔饮用苏打水</li>
        <li><strong>有特殊健康需求</strong>：咨询医生后选择专业水品牌</li>
      </ul>
      
      <h2>饮用水的储存与安全</h2>
      <ul>
        <li>一次开封的瓶装水最好在24小时内饮用完</li>
        <li>避免将瓶装水长时间暴露在阳光下或高温环境中</li>
        <li>定期清洗水壶、水杯等盛水容器</li>
        <li>注意查看瓶装水的生产日期和保质期</li>
      </ul>
      
      <p>选择合适的饮用水是健康生活的一部分。了解各类水的特点，可以帮助我们更科学地选择，满足个人健康需求。</p>
    </div>`,
    imageUrl: '/assets/images/articles/article2.jpg',
    category: 'science',
    author: '水质专家 王强',
    tags: ['饮用水', '矿泉水', '纯净水'],
    publishDate: new Date('2024-03-25'),
    views: 986,
    shares: 215,
    isPublished: true
  },
  {
    title: '饮水与健康：关于水的几个误区',
    summary: '澄清常见的饮水误区，帮助建立科学的饮水观念',
    content: `<div class="article-content">
      <p>饮水看似简单，但仍有许多人对饮水存在误解。以下是几个常见的饮水误区，让我们一起澄清。</p>
      
      <h2>误区一：口渴才是补水的信号</h2>
      <p><strong>事实</strong>：当你感到口渴时，身体已经处于轻度脱水状态。口渴是身体水分不足的警告信号，而非饮水的最佳时机。</p>
      <p><strong>正确做法</strong>：建立规律的饮水习惯，主动补水，不要等到口渴才想起喝水。健康成人每天应该摄入约1.5-2升水（约7-8杯）。</p>
      
      <h2>误区二：喝越多水越好</h2>
      <p><strong>事实</strong>：过量饮水可能导致水中毒，尤其是在短时间内大量饮水时。水中毒会稀释血液中的电解质，严重时可能危及生命。</p>
      <p><strong>正确做法</strong>：根据个人情况适量饮水，健康成人一般每小时不应超过1升水。特殊情况如剧烈运动后需要补充电解质。</p>
      
      <h2>误区三：任何液体都能代替水</h2>
      <p><strong>事实</strong>：咖啡、茶、酒精饮料等含有利尿成分，可能导致更多水分流失。含糖饮料则会带来额外的热量和糖分摄入。</p>
      <p><strong>正确做法</strong>：以白水为主要饮品，适量饮用其他饮料。如果喝含咖啡因饮料，需额外补充清水。</p>
      
      <h2>误区四：运动时不宜喝水</h2>
      <p><strong>事实</strong>：运动过程中会通过出汗流失大量水分，不及时补充可能导致运动能力下降，甚至出现脱水症状。</p>
      <p><strong>正确做法</strong>：运动前、中、后都应适量补水。中等强度运动每15-20分钟补充100-200毫升水；高强度或长时间运动考虑补充运动饮料以补充电解质。</p>
      
      <h2>误区五：喝冰水会导致体内"寒气"</h2>
      <p><strong>事实</strong>：从现代医学角度，人体有完善的体温调节机制，适量饮用冰水不会导致健康问题。但对于一些特殊体质或有胃肠道问题的人，过冷的水确实可能引起不适。</p>
      <p><strong>正确做法</strong>：选择适合自己的水温，一般建议饮用常温或稍凉的水，这样更有利于吸收。</p>
      
      <h2>误区六：晚上喝水会导致水肿</h2>
      <p><strong>事实</strong>：正常人在睡前适量饮水不会导致水肿。晨起面部水肿通常与其他因素有关，如盐分摄入过多、肾功能问题等。</p>
      <p><strong>正确做法</strong>：睡前1-2小时可以适量饮水，但避免大量饮水以减少夜间起床如厕的频率。</p>
      
      <p>科学饮水是健康生活的基础。了解这些常见误区，可以帮助我们更好地满足身体对水分的需求，维护整体健康。</p>
    </div>`,
    imageUrl: '/assets/images/articles/article3.jpg',
    category: 'science',
    author: '营养师 张伟',
    tags: ['健康', '饮水', '误区'],
    publishDate: new Date('2024-02-18'),
    views: 750,
    shares: 186,
    isPublished: true
  },
  {
    title: '喝水的最佳时间：优化你的饮水时间表',
    summary: '什么时候喝水最有益健康？了解优化饮水时间的科学依据',
    content: `<div class="article-content">
      <p>饮水不仅是量的问题，时间也很重要。本文将介绍一天中最佳的饮水时机，帮助你优化饮水习惯。</p>
      
      <h2>早晨起床后</h2>
      <p><strong>为什么</strong>：经过一夜睡眠，身体处于轻度脱水状态。此时饮水可以补充水分，激活身体机能，促进新陈代谢。</p>
      <p><strong>建议</strong>：起床后空腹喝一杯温水（约200-300毫升），可以加入少量柠檬汁增加维生素C摄入。</p>
      
      <h2>餐前30分钟</h2>
      <p><strong>为什么</strong>：餐前适量饮水有助于控制食欲，防止进食过量；同时可以为消化系统做准备。</p>
      <p><strong>建议</strong>：餐前30分钟喝一杯水（约200毫升），但不要过量，以免稀释胃酸。</p>
      
      <h2>餐后1-2小时</h2>
      <p><strong>为什么</strong>：餐后立即大量饮水可能稀释消化酶，影响食物消化。等待1-2小时再饮水更有利于消化过程。</p>
      <p><strong>建议</strong>：餐后可以小口喝水解渴，但主要补水时间应在餐后1-2小时。</p>
      
      <h2>运动前、中、后</h2>
      <p><strong>运动前</strong>：开始运动前1-2小时喝约500毫升水，为身体提供充足水分。</p>
      <p><strong>运动中</strong>：每15-20分钟小口补充100-200毫升水，防止脱水。</p>
      <p><strong>运动后</strong>：根据出汗情况，逐步补充流失的水分，约450-675毫升。如果是大量出汗，考虑补充电解质饮料。</p>
      
      <h2>下午2-3点</h2>
      <p><strong>为什么</strong>：这个时间段人体常常会感到疲劳，适当饮水可以提神醒脑，恢复精力。</p>
      <p><strong>建议</strong>：喝一杯温水或者淡茶，避免含糖饮料或咖啡，以免影响晚上睡眠。</p>
      
      <h2>睡前1-2小时</h2>
      <p><strong>为什么</strong>：睡前适量饮水可以预防夜间脱水，但时间不宜太接近睡觉时间，以免影响睡眠质量。</p>
      <p><strong>建议</strong>：睡前1-2小时喝约200毫升水，避免睡前大量饮水以减少夜间起床如厕的频率。</p>
      
      <h2>特殊时段的饮水建议</h2>
      <h3>感冒或发热时</h3>
      <p>适当增加饮水量，帮助降温并补充因出汗和呼吸增加而流失的水分。</p>
      
      <h3>天气炎热时</h3>
      <p>需增加饮水频率和总量，每小时补充少量水分比一次大量饮水更有效。</p>
      
      <h3>长途旅行时</h3>
      <p>每小时喝小量水，特别是在飞机上，因为机舱环境干燥会增加水分流失。</p>
      
      <p>记住，优化饮水时间是健康生活的一部分。建立良好的饮水习惯，让合适的水分在合适的时间滋养你的身体！</p>
    </div>`,
    imageUrl: '/assets/images/articles/article1.jpg',
    category: 'tips',
    author: '健康顾问 赵丽',
    tags: ['饮水时间', '健康', '生活习惯'],
    publishDate: new Date('2024-01-15'),
    views: 682,
    shares: 125,
    isPublished: true
  },
  {
    title: '水质如何影响健康：你需要知道的事实',
    summary: '探讨水质对人体健康的影响以及如何确保饮用水安全',
    content: `<div class="article-content">
      <p>水是生命之源，但并非所有的水都对健康有益。水质问题直接关系到我们的健康状况，本文将探讨水质与健康的关系以及如何确保饮用水安全。</p>
      
      <h2>水质问题对健康的潜在影响</h2>
      
      <h3>1. 微生物污染</h3>
      <p><strong>潜在风险</strong>：细菌、病毒、原生动物等病原体可能导致急性胃肠道疾病、腹泻、痢疾等。</p>
      <p><strong>常见来源</strong>：粪便污染、污水处理不当、自来水管道老化。</p>
      
      <h3>2. 重金属污染</h3>
      <p><strong>潜在风险</strong>：</p>
      <ul>
        <li><strong>铅</strong>：影响儿童智力发育，损害神经系统</li>
        <li><strong>汞</strong>：损害神经系统，影响胎儿发育</li>
        <li><strong>砷</strong>：增加癌症风险，影响心血管系统</li>
        <li><strong>铬</strong>：可能导致肝肾损伤，有致癌风险</li>
      </ul>
      <p><strong>常见来源</strong>：工业废水、老旧管道、自然环境中的矿物质。</p>
      
      <h3>3. 化学污染物</h3>
      <p><strong>潜在风险</strong>：农药、工业化学品、消毒副产物等可能增加癌症风险，影响内分泌系统。</p>
      <p><strong>常见来源</strong>：农业径流、工业排放、氯消毒过程。</p>
      
      <h3>4. 矿物质失衡</h3>
      <p><strong>潜在影响</strong>：矿物质过多或过少都可能影响健康：</p>
      <ul>
        <li>钙镁含量过高导致水质硬度大，可能影响肾脏健康</li>
        <li>氟含量过高可能导致氟中毒，影响骨骼和牙齿</li>
        <li>一些有益矿物质缺乏可能无法通过饮水获得额外补充</li>
      </ul>
      
      <h2>如何确保饮用水安全</h2>
      
      <h3>家庭自查方法</h3>
      <ul>
        <li><strong>观察</strong>：清澈、无色、无异味是基本要求</li>
        <li><strong>水质检测盒</strong>：可检测部分污染物，如氯、铅、细菌等</li>
        <li><strong>专业检测</strong>：对于特殊关注的污染物，可送样至专业实验室检测</li>
      </ul>
      
      <h3>家庭饮水处理方案</h3>
      
      <h4>净水器选择</h4>
      <p>不同类型的净水器针对不同水质问题：</p>
      <ul>
        <li><strong>活性炭过滤器</strong>：去除氯、异味、部分有机物</li>
        <li><strong>反渗透系统</strong>：可去除大多数污染物，包括重金属、矿物质</li>
        <li><strong>紫外线消毒</strong>：高效灭杀微生物</li>
        <li><strong>离子交换软水器</strong>：降低水硬度</li>
      </ul>
      
      <h4>日常饮水建议</h4>
      <ul>
        <li>饮用前放水10-30秒，清除管道中滞留的水</li>
        <li>使用冷水做饭和饮用，热水可能含有更多的管道金属</li>
        <li>定期清洁水壶、水具，避免二次污染</li>
        <li>外出时选择可靠品牌的瓶装水</li>
      </ul>
      
      <h2>特殊人群饮水建议</h2>
      <ul>
        <li><strong>婴幼儿</strong>：对水质要求更高，考虑使用专门的婴儿水或反渗透处理的水</li>
        <li><strong>孕妇</strong>：避免含高氯或高硝酸盐的水，确保水源安全</li>
        <li><strong>老年人</strong>：避免饮用过硬的水，可能增加肾脏负担</li>
        <li><strong>免疫力低下者</strong>：应确保饮用微生物安全的水，必要时煮沸处理</li>
      </ul>
      
      <p>水质与健康密切相关，了解潜在风险并采取适当措施确保饮用水安全，是保护家人健康的重要一步。关注水质，就是关注健康！</p>
    </div>`,
    imageUrl: '/assets/images/articles/article2.jpg',
    category: 'health',
    author: '环境卫生专家 陈健',
    tags: ['水质', '健康', '安全'],
    publishDate: new Date('2023-12-20'),
    views: 598,
    shares: 109,
    isPublished: true
  }
];

// 添加测试文章数据
async function seedArticles() {
  try {
    // 清空现有文章数据
    await Article.deleteMany({});
    console.log('已清空旧文章数据');
    
    // 插入新文章数据
    const createdArticles = await Article.insertMany(articles);
    
    console.log(`已成功添加 ${createdArticles.length} 篇测试文章`);
    console.log('文章ID:');
    createdArticles.forEach(article => {
      console.log(`- ${article.title}: ${article._id}`);
    });
    
    // 断开数据库连接
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('添加测试文章失败:', error);
  }
}

// 如果直接运行脚本则执行
if (require.main === module) {
  console.log('开始添加测试文章数据...');
} 