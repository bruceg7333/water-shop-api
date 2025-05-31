/**
 * 批量压缩图片脚本
 * 用于压缩uploads目录中所有超过200KB的图片
 * 使微信小程序能够正常加载这些图片
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 上传目录路径
const uploadsDir = path.join(__dirname, '../public/uploads');

// 压缩图片函数 (与uploadController.js中相同)
const compressImage = async (filePath, options = {}) => {
  try {
    const imageInfo = await sharp(filePath).metadata();
    
    // 根据图片大小决定压缩质量
    let quality = 80; // 默认质量
    let width = imageInfo.width;
    
    // 文件大于200KB需要压缩
    const stats = fs.statSync(filePath);
    const fileSizeInKB = stats.size / 1024;
    
    if (fileSizeInKB > 200) {
      // 如果文件太大，降低质量和尺寸
      quality = Math.min(quality, Math.floor(200 / fileSizeInKB * 80));
      
      // 如果质量已经很低但文件仍然太大，则降低尺寸
      if (quality < 40 && width > 800) {
        width = Math.floor(width * 0.7); // 降低到70%
      }
      
      // 如果文件非常大，进一步降低尺寸
      if (fileSizeInKB > 1000 && width > 600) {
        width = Math.floor(width * 0.5); // 降低到50%
      }
    } else {
      // 如果文件已经小于200KB，不需要压缩
      console.log(`文件 ${path.basename(filePath)} 大小已符合要求: ${fileSizeInKB.toFixed(2)}KB`);
      return false;
    }
    
    console.log(`压缩 ${path.basename(filePath)} (原始大小: ${fileSizeInKB.toFixed(2)}KB, 质量: ${quality}, 宽度: ${width}px)`);
    
    // 根据文件类型处理
    let compressedImage;
    try {
      if (imageInfo.format === 'png') {
        compressedImage = await sharp(filePath)
          .resize({ width: width, withoutEnlargement: true })
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      } else if (imageInfo.format === 'jpeg' || imageInfo.format === 'jpg') {
        compressedImage = await sharp(filePath)
          .resize({ width: width, withoutEnlargement: true })
          .jpeg({ quality })
          .toBuffer();
      } else if (imageInfo.format === 'webp') {
        compressedImage = await sharp(filePath)
          .resize({ width: width, withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();
      } else if (imageInfo.format === 'gif') {
        // GIF处理比较特殊，如果需要保留动画则不用sharp处理
        // 这里转为静态PNG
        compressedImage = await sharp(filePath, { animated: false })
          .resize({ width: width, withoutEnlargement: true })
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      } else {
        // 其他格式，尝试转换为jpg
        compressedImage = await sharp(filePath)
          .resize({ width: width, withoutEnlargement: true })
          .jpeg({ quality })
          .toBuffer();
      }
      
      // 覆盖原始文件
      await fs.promises.writeFile(filePath, compressedImage);
      
      // 检查压缩后的大小
      const newStats = fs.statSync(filePath);
      const newSizeKB = newStats.size / 1024;
      
      console.log(`✅ 压缩完成: ${path.basename(filePath)} (新大小: ${newSizeKB.toFixed(2)}KB)`);
      
      // 如果压缩后仍然大于200KB，递归压缩
      if (newSizeKB > 200) {
        console.log(`⚠️ 文件仍然超过200KB，进一步压缩: ${path.basename(filePath)}`);
        return await compressImage(filePath);
      }
      
      return true;
    } catch (error) {
      console.error(`图片处理错误 (${path.basename(filePath)}):`, error.message);
      return false;
    }
  } catch (error) {
    console.error(`处理 ${path.basename(filePath)} 时出错:`, error.message);
    return false;
  }
};

// 批量处理文件
const processImages = async () => {
  try {
    // 检查目录是否存在
    if (!fs.existsSync(uploadsDir)) {
      console.error(`上传目录不存在: ${uploadsDir}`);
      return;
    }
    
    // 读取目录中的所有文件
    const files = fs.readdirSync(uploadsDir);
    console.log(`找到 ${files.length} 个文件`);
    
    // 过滤出图片文件
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    console.log(`找到 ${imageFiles.length} 个图片文件`);
    
    // 过滤出超过200KB的图片
    const largeImages = [];
    for (const image of imageFiles) {
      const filePath = path.join(uploadsDir, image);
      const stats = fs.statSync(filePath);
      const fileSizeInKB = stats.size / 1024;
      
      if (fileSizeInKB > 200) {
        largeImages.push({
          path: filePath,
          name: image,
          size: fileSizeInKB
        });
      }
    }
    
    console.log(`找到 ${largeImages.length} 个大于200KB的图片`);
    
    // 按大小排序（从大到小）
    largeImages.sort((a, b) => b.size - a.size);
    
    // 显示最大的5个文件
    if (largeImages.length > 0) {
      console.log('\n最大的5个文件:');
      const top5 = largeImages.slice(0, Math.min(5, largeImages.length));
      for (const img of top5) {
        console.log(`- ${img.name}: ${img.size.toFixed(2)}KB`);
      }
      console.log('');
    }
    
    // 处理所有大图片
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < largeImages.length; i++) {
      const img = largeImages[i];
      console.log(`[${i+1}/${largeImages.length}] 处理: ${img.name} (${img.size.toFixed(2)}KB)`);
      
      try {
        const result = await compressImage(img.path);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`压缩失败: ${img.name}`, error);
        failed++;
      }
    }
    
    console.log('\n压缩完成!');
    console.log(`✅ 成功: ${success}`);
    console.log(`❌ 失败: ${failed}`);
    
  } catch (error) {
    console.error('批量处理图片时出错:', error);
  }
};

// 执行批量处理
console.log('开始批量压缩图片...');
processImages().then(() => {
  console.log('批量处理完成！');
}); 