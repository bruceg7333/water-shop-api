const mongoose = require('mongoose');
require('dotenv').config();

async function updateCouponFrontendType() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-shop');
    console.log('数据库连接成功');

    // 导入优惠券模型
    const Coupon = require('../src/models/coupon');

    // 查找所有没有frontendType字段的优惠券
    const couponsWithoutFrontendType = await Coupon.find({
      frontendType: { $exists: false }
    });

    console.log(`找到 ${couponsWithoutFrontendType.length} 个需要更新的优惠券`);

    // 更新每个优惠券的frontendType字段
    for (const coupon of couponsWithoutFrontendType) {
      let frontendType;
      
      if (coupon.type === 'percentage') {
        frontendType = 'percentage';
      } else if (coupon.type === 'fixed') {
        frontendType = 'discount'; // 默认为满减券
      }

      if (frontendType) {
        await Coupon.findByIdAndUpdate(coupon._id, {
          frontendType: frontendType
        });
        console.log(`更新优惠券 ${coupon.name} (${coupon.code}) 的 frontendType 为 ${frontendType}`);
      }
    }

    // 显示更新后的统计信息
    const stats = await Coupon.aggregate([
      {
        $group: {
          _id: '$frontendType',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n更新后的优惠券类型统计:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} 个`);
    });

    console.log('\n优惠券frontendType字段更新完成');
    process.exit(0);
  } catch (error) {
    console.error('更新失败:', error);
    process.exit(1);
  }
}

updateCouponFrontendType(); 