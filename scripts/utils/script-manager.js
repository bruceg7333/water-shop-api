/**
 * 脚本管理工具
 * 用于管理项目中的各种脚本文件
 */

const fs = require('fs');
const path = require('path');

class ScriptManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.scriptsDir = path.join(__dirname, '..');
  }

  // 扫描项目中的脚本文件
  scanProjectScripts() {
    console.log('📂 扫描项目中的脚本文件...\n');
    
    const scripts = {
      root: [],
      organized: [],
      temporary: []
    };
    
    // 扫描根目录的脚本
    const rootFiles = fs.readdirSync(this.projectRoot);
    rootFiles.forEach(file => {
      if (file.endsWith('.js') && (file.includes('test-') || file.includes('create-') || file.includes('check-'))) {
        scripts.root.push({
          name: file,
          path: path.join(this.projectRoot, file),
          size: this.getFileSize(path.join(this.projectRoot, file)),
          type: this.getScriptType(file)
        });
      }
    });
    
    // 扫描scripts目录的脚本
    if (fs.existsSync(this.scriptsDir)) {
      this.scanDirectory(this.scriptsDir, scripts.organized);
    }
    
    return scripts;
  }

  // 递归扫描目录
  scanDirectory(dir, collection) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(itemPath, collection);
      } else if (item.endsWith('.js')) {
        collection.push({
          name: item,
          path: itemPath,
          relativePath: path.relative(this.projectRoot, itemPath),
          size: this.getFileSize(itemPath),
          type: this.getScriptType(item)
        });
      }
    });
  }

  // 获取文件大小
  getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return `${(stats.size / 1024).toFixed(1)}KB`;
  }

  // 判断脚本类型
  getScriptType(filename) {
    if (filename.includes('test-')) return '测试脚本';
    if (filename.includes('create-')) return '数据创建';
    if (filename.includes('init-') || filename.includes('system-')) return '初始化';
    if (filename.includes('check-')) return '检查验证';
    if (filename.includes('generate-')) return '数据生成';
    if (filename.includes('add-')) return '数据添加';
    return '工具脚本';
  }

  // 移动脚本到organized目录
  async organizeScripts() {
    console.log('🔄 整理脚本文件...\n');
    
    const scripts = this.scanProjectScripts();
    const moved = [];
    
    for (const script of scripts.root) {
      const targetDir = this.getTargetDirectory(script.type);
      const targetPath = path.join(targetDir, script.name);
      
      // 确保目标目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      try {
        // 移动文件
        fs.renameSync(script.path, targetPath);
        moved.push({
          from: script.name,
          to: path.relative(this.projectRoot, targetPath)
        });
        console.log(`✅ 移动: ${script.name} → ${path.relative(this.projectRoot, targetPath)}`);
      } catch (error) {
        console.error(`❌ 移动失败: ${script.name} - ${error.message}`);
      }
    }
    
    return moved;
  }

  // 获取目标目录
  getTargetDirectory(scriptType) {
    switch (scriptType) {
      case '测试脚本':
        return path.join(this.scriptsDir, 'tests');
      case '初始化':
        return path.join(this.scriptsDir, 'init');
      case '数据创建':
      case '数据生成':
      case '数据添加':
        return path.join(this.scriptsDir, 'data');
      default:
        return path.join(this.scriptsDir, 'utils');
    }
  }

  // 清理临时测试脚本
  async cleanupTemporaryScripts() {
    console.log('🧹 清理临时测试脚本...\n');
    
    const testDir = path.join(this.scriptsDir, 'tests');
    if (!fs.existsSync(testDir)) {
      console.log('⚠️  测试目录不存在，跳过清理');
      return [];
    }
    
    const cleaned = [];
    const testFiles = fs.readdirSync(testDir);
    
    // 保留综合测试脚本，删除其他临时测试脚本
    const preserveFiles = ['comprehensive-test.js'];
    
    testFiles.forEach(file => {
      if (file.endsWith('.js') && !preserveFiles.includes(file)) {
        const filePath = path.join(testDir, file);
        try {
          fs.unlinkSync(filePath);
          cleaned.push(file);
          console.log(`🗑️  删除: ${file}`);
        } catch (error) {
          console.error(`❌ 删除失败: ${file} - ${error.message}`);
        }
      }
    });
    
    return cleaned;
  }

  // 生成脚本使用说明
  generateUsageGuide() {
    const guide = `# 水商城脚本使用指南

## 📁 脚本目录结构

\`\`\`
scripts/
├── init/           # 初始化脚本
│   └── system-init.js    # 系统初始化（首次部署必需）
├── tests/          # 测试脚本
│   └── comprehensive-test.js  # 综合功能测试
├── data/           # 数据脚本
│   ├── generate-*.js     # 数据生成脚本
│   └── create-*.js       # 数据创建脚本
└── utils/          # 工具脚本
    └── script-manager.js # 脚本管理工具
\`\`\`

## 🚀 使用方法

### 首次部署
\`\`\`bash
# 系统初始化（创建超级管理员等）
node scripts/init/system-init.js
\`\`\`

### 功能测试
\`\`\`bash
# 运行综合功能测试
node scripts/tests/comprehensive-test.js
\`\`\`

### 脚本管理
\`\`\`bash
# 查看和整理脚本
node scripts/utils/script-manager.js
\`\`\`

## 📝 开发规范

1. **测试脚本**：放入 \`tests/\` 目录，开发完成后可删除
2. **初始化脚本**：放入 \`init/\` 目录，用于系统部署
3. **数据脚本**：放入 \`data/\` 目录，用于生成测试数据
4. **工具脚本**：放入 \`utils/\` 目录，提供辅助功能

## ⚠️  注意事项

- 初始化脚本只在首次部署时运行一次
- 测试脚本可以重复运行用于验证功能
- 数据脚本会检查重复，避免重复创建
- 定期清理不需要的临时脚本
`;

    fs.writeFileSync(path.join(this.scriptsDir, 'README.md'), guide);
    console.log('📖 脚本使用说明已生成: scripts/README.md');
  }

  // 显示脚本统计信息
  displayStatistics() {
    const scripts = this.scanProjectScripts();
    
    console.log('📊 === 脚本统计信息 ===\n');
    
    // 根目录脚本
    if (scripts.root.length > 0) {
      console.log('🔸 根目录脚本 (需要整理):');
      scripts.root.forEach(script => {
        console.log(`   ${script.name} (${script.size}) - ${script.type}`);
      });
      console.log('');
    }
    
    // 已整理脚本
    if (scripts.organized.length > 0) {
      console.log('✅ 已整理脚本:');
      const byType = {};
      scripts.organized.forEach(script => {
        if (!byType[script.type]) byType[script.type] = [];
        byType[script.type].push(script);
      });
      
      Object.keys(byType).forEach(type => {
        console.log(`   ${type}:`);
        byType[type].forEach(script => {
          console.log(`     ${script.relativePath} (${script.size})`);
        });
      });
      console.log('');
    }
    
    // 总结
    const total = scripts.root.length + scripts.organized.length;
    console.log(`📈 总计: ${total} 个脚本文件`);
    console.log(`   - 需要整理: ${scripts.root.length} 个`);
    console.log(`   - 已经整理: ${scripts.organized.length} 个`);
  }

  // 交互式菜单
  async showMenu() {
    console.log('🛠️  水商城脚本管理工具\n');
    console.log('请选择操作:');
    console.log('1. 查看脚本统计');
    console.log('2. 整理脚本文件');
    console.log('3. 清理临时脚本');
    console.log('4. 生成使用说明');
    console.log('5. 执行所有整理操作');
    console.log('0. 退出\n');
  }

  // 执行所有整理操作
  async performFullCleanup() {
    console.log('🔧 执行完整脚本整理...\n');
    
    // 1. 整理脚本
    const moved = await this.organizeScripts();
    
    // 2. 清理临时脚本
    const cleaned = await this.cleanupTemporaryScripts();
    
    // 3. 生成使用说明
    this.generateUsageGuide();
    
    // 4. 显示结果
    console.log('\n🎉 整理完成！');
    console.log(`✅ 移动了 ${moved.length} 个脚本文件`);
    console.log(`🗑️  清理了 ${cleaned.length} 个临时文件`);
    console.log('📖 生成了使用说明文档');
    
    // 5. 显示最终统计
    console.log('\n');
    this.displayStatistics();
  }
}

// 直接执行时的处理
if (require.main === module) {
  const manager = new ScriptManager();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--auto') || args.includes('-a')) {
    // 自动执行完整整理
    manager.performFullCleanup();
  } else if (args.includes('--stats') || args.includes('-s')) {
    // 只显示统计信息
    manager.displayStatistics();
  } else {
    // 交互式模式（简化版）
    console.log('🛠️  脚本管理工具');
    console.log('');
    console.log('使用方法:');
    console.log('  node script-manager.js --auto    # 自动整理所有脚本');
    console.log('  node script-manager.js --stats   # 查看脚本统计');
    console.log('');
    
    manager.displayStatistics();
    
    console.log('\n💡 建议运行: node script-manager.js --auto');
  }
}

module.exports = ScriptManager; 