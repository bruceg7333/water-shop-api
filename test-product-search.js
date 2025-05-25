const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

// 测试管理员商品搜索功能
async function testProductSearch() {
  try {
    console.log('开始测试商品搜索功能...\n');
    
    // 测试1: 基本查询
    console.log('1. 测试基本查询');
    const response1 = await axios.get(`${baseURL}/admin/products`, {
      params: {
        page: 1,
        pageSize: 10
      },
      headers: {
        'Authorization': 'Bearer your-admin-token' // 需要替换为实际token
      }
    });
    console.log('基本查询结果:', response1.data);
    console.log('商品数量:', response1.data.data?.total || 0);
    console.log('');
    
    // 测试2: 关键词搜索
    console.log('2. 测试关键词搜索 (SPRINKLE)');
    const response2 = await axios.get(`${baseURL}/admin/products`, {
      params: {
        page: 1,
        pageSize: 10,
        keyword: 'SPRINKLE'
      },
      headers: {
        'Authorization': 'Bearer your-admin-token'
      }
    });
    console.log('关键词搜索结果:', response2.data);
    console.log('');
    
    // 测试3: 分类筛选
    console.log('3. 测试分类筛选 (纯净水)');
    const response3 = await axios.get(`${baseURL}/admin/products`, {
      params: {
        page: 1,
        pageSize: 10,
        category: '纯净水'
      },
      headers: {
        'Authorization': 'Bearer your-admin-token'
      }
    });
    console.log('分类筛选结果:', response3.data);
    console.log('');
    
    // 测试4: 状态筛选
    console.log('4. 测试状态筛选 (上架商品)');
    const response4 = await axios.get(`${baseURL}/admin/products`, {
      params: {
        page: 1,
        pageSize: 10,
        status: 'on'
      },
      headers: {
        'Authorization': 'Bearer your-admin-token'
      }
    });
    console.log('状态筛选结果:', response4.data);
    console.log('');
    
    // 测试5: 价格区间筛选
    console.log('5. 测试价格区间筛选 (1-3元)');
    const response5 = await axios.get(`${baseURL}/admin/products`, {
      params: {
        page: 1,
        pageSize: 10,
        priceRange: '1-3'
      },
      headers: {
        'Authorization': 'Bearer your-admin-token'
      }
    });
    console.log('价格区间筛选结果:', response5.data);
    console.log('');
    
    // 测试6: 排序
    console.log('6. 测试排序 (按价格升序)');
    const response6 = await axios.get(`${baseURL}/admin/products`, {
      params: {
        page: 1,
        pageSize: 10,
        sortBy: 'price',
        sortOrder: 'asc'
      },
      headers: {
        'Authorization': 'Bearer your-admin-token'
      }
    });
    console.log('排序结果:', response6.data);
    console.log('');
    
    console.log('所有测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testProductSearch(); 