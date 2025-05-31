const express = require('express')
const router = express.Router()
const bannerController = require('../controllers/bannerController')
const { protect, authorize } = require('../middlewares/adminAuth')

// 管理端路由(需要管理员权限)
router.get('/', protect, authorize('banner_read'), bannerController.getBanners)
router.post('/', protect, authorize('banner_create'), bannerController.createBanner)
router.put('/:id', protect, authorize('banner_update'), bannerController.updateBanner)
router.delete('/:id', protect, authorize('banner_delete'), bannerController.deleteBanner)
router.put('/:id/status', protect, authorize('banner_update'), bannerController.toggleBannerStatus)
router.put('/sort/batch', protect, authorize('banner_update'), bannerController.updateBannerSort)

// 辅助接口(用于轮播图配置)
router.get('/products/search', protect, authorize('banner_create'), bannerController.searchProducts)
router.get('/articles/search', protect, authorize('banner_create'), bannerController.searchArticles)
router.get('/categories', protect, authorize('banner_create'), bannerController.getProductCategories)

// 小程序端路由(公开接口)
router.get('/active', bannerController.getActiveBanners)
router.post('/:id/click', bannerController.clickBanner)

module.exports = router 