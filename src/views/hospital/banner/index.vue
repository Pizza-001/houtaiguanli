<template>
  <div class="banner-manager-container">
    <!-- Premium Header -->
    <div class="glass-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="premium-title">视觉资产中心</h1>
          <p class="premium-subtitle">打造极致的线上品牌视觉体验 / Banner Management</p>
        </div>
        <div class="header-actions">
          <el-button class="premium-add-btn" icon="Plus" size="large" @click="handleAdd">
            新增视觉位
          </el-button>
        </div>
      </div>
    </div>

    <!-- Enhanced Search/Filter bar -->
    <div class="filter-section" v-if="bannerList.length > 0">
      <el-input
        v-model="queryParams.title"
        placeholder="搜索轮播资源..."
        class="premium-search"
        @keyup.enter="handleQuery"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- Gallery Grid -->
    <div class="banner-grid" v-loading="loading">
      <el-row :gutter="30">
        <el-col 
          v-for="(item, index) in bannerList" 
          :key="item.bannerId" 
          :xs="24" :sm="12" :md="8" :lg="6"
          class="grid-item"
        >
          <div class="premium-card" :style="{ '--delay': index * 0.1 + 's' }">
            <div class="card-preview">
              <el-image 
                :src="item.image" 
                fit="cover" 
                class="main-img"
                :preview-src-list="[item.image]"
                preview-teleported
              >
                <template #placeholder>
                  <div class="img-loading"><el-icon class="is-loading"><Loading /></el-icon></div>
                </template>
              </el-image>
              <div class="card-badge" :class="{ 'badge-active': item.status === '0' }">
                {{ item.status === '0' ? '正在展示' : '已入库' }}
              </div>
              <div class="card-overlay">
                <div class="overlay-actions">
                  <el-button circle icon="Edit" @click="handleUpdate(item)" class="action-btn edit-btn"></el-button>
                  <el-button circle icon="Delete" @click="handleDelete(item)" class="action-btn delete-btn"></el-button>
                </div>
              </div>
            </div>
            
            <div class="card-content">
              <div class="content-top">
                <h3 class="item-title">{{ item.title || '未命名项目' }}</h3>
                <span class="weight-tag">#{{ item.sort }}</span>
              </div>
              <div class="content-bottom">
                <div class="link-info">
                  <el-icon v-if="item.linkUrl"><Link /></el-icon>
                  <span v-if="item.linkUrl" @click="copyLink(item.linkUrl)" class="link-text">{{ item.linkUrl }}</span>
                  <span v-else class="no-link">暂无外链</span>
                </div>
                <el-switch
                  v-model="item.status"
                  active-value="0"
                  inactive-value="1"
                  inline-prompt
                  active-text="ON"
                  inactive-text="OFF"
                  @change="(val) => handleStatusChange(item, val)"
                  class="premium-switch"
                />
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Empty State -->
    <el-empty v-if="!loading && bannerList.length === 0" description="这里空空如也，创造你的第一个 Banner 吧">
      <el-button type="primary" plain @click="handleAdd">即刻创建</el-button>
    </el-empty>

    <!-- Refined Pagination -->
    <div class="premium-pagination">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        layout="prev, pager, next, total"
        :total="total"
        background
        @current-change="getList"
      />
    </div>

    <!-- Premium Creative Dialog -->
    <el-dialog 
      :title="false"
      v-model="open" 
      width="580px" 
      append-to-body
      class="premium-dialog"
      :show-close="false"
    >
      <template #header>
        <div class="dialog-custom-header">
          <div class="header-icon-box">
            <el-icon><Picture /></el-icon>
          </div>
          <div class="header-title-box">
            <h2>{{ title }}</h2>
            <p>完善资源详情，开启视觉叙事</p>
          </div>
          <el-button circle icon="Close" @click="cancel" class="close-btn"></el-button>
        </div>
      </template>

      <el-form ref="bannerRef" :model="form" :rules="rules" label-width="100px" label-position="top">
        <div class="form-grid">
          <el-form-item label="轮播图标题" prop="title" class="full-width">
            <el-input v-model="form.title" placeholder="输入资源主标题..." />
          </el-form-item>
          
          <el-form-item label="视觉位资源" prop="image" class="full-width">
            <el-upload
              class="creative-uploader"
              :action="uploadUrl"
              :headers="headers"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeUpload"
              drag
            >
              <div v-if="form.image" class="creative-uploaded">
                <img :src="form.image" class="preview-full" />
                <div class="change-hint">
                  <el-icon><Refresh /></el-icon>
                  <span>更换素材</span>
                </div>
              </div>
              <div v-else class="creative-placeholder">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">点击或将图片拖拽到此处上传</div>
              </div>
            </el-upload>
          </el-form-item>

          <el-form-item label="跳转链接" prop="linkUrl">
            <el-input v-model="form.linkUrl" placeholder="https://..." prefix-icon="Link" />
          </el-form-item>
          
          <el-form-item label="显示排序" prop="sort">
            <el-input v-model.number="form.sort" placeholder="数字越小越靠前" type="number">
              <template #prefix>
                <el-icon><Sort /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="上架状态" prop="status" class="full-width">
            <el-radio-group v-model="form.status" class="pro-radio-group">
              <el-radio-button label="0">立即发布</el-radio-button>
              <el-radio-button label="1">暂存草稿</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="creative-footer">
          <el-button @click="cancel" class="cancel-btn">暂存草稿</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="submit-btn">
            发布资源
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listBanner, getBanner, delBanner, addBanner, updateBanner } from '@/api/banner'
import { getToken } from '@/utils/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Edit, Delete, Link, Search, 
  Loading, Picture, Close, Refresh, 
  UploadFilled, Sort
} from '@element-plus/icons-vue'

const loading = ref(true)
const submitLoading = ref(false)
const bannerList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)

const uploadUrl = ref((import.meta.env.VITE_APP_BASE_API || '/dev-api') + '/common/upload')
const headers = ref({ Authorization: 'Bearer ' + getToken() })

const queryParams = ref({
  pageNum: 1,
  pageSize: 8,
  title: undefined,
  status: undefined
})

const form = ref({
  bannerId: undefined,
  title: '',
  image: '',
  linkUrl: '',
  sort: 1,
  status: '0'
})

const rules = {
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  image: [{ required: true, message: '必须上传展示图', trigger: 'change' }]
}

const bannerRef = ref(null)

const getList = async () => {
  loading.value = true
  try {
    const res = await listBanner(queryParams.value)
    if (res && res.rows) {
      bannerList.value = res.rows
      total.value = res.total
    } else if (Array.isArray(res)) {
      bannerList.value = res
      total.value = res.length
    } else {
      bannerList.value = []
      total.value = 0
    }
  } catch (err) {
    console.error('获取轮播图失败:', err)
    ElMessage.error('无法加载轮播资源，请检查后台及数据库状态')
    bannerList.value = []
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

const copyLink = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('链接已复制到剪切板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动选择')
  })
}

const handleStatusChange = async (row, val) => {
  try {
    await updateBanner({ ...row, status: val })
    ElMessage.success(val === '0' ? '已展示' : '已隐藏')
  } catch (err) {
    row.status = val === '0' ? '1' : '0'
  }
}

const handleUploadSuccess = (res) => {
  if (res.code === 200) {
    form.value.image = res.url
    ElMessage.success('资源上传成功')
  } else {
    ElMessage.error(res.msg || '上传失败')
  }
}

const handleUploadError = (err) => {
  console.error('上传异常:', err)
  ElMessage.error('上传请求失败，请检查网络或后端服务')
}

const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  const isLt2M = file.size / 1024 / 1024 < 5

  if (!isJPG) ElMessage.error('仅支持 JPG/PNG/WEBP 格式!')
  if (!isLt2M) ElMessage.error('图片体积不能超过 5MB!')
  return isJPG && isLt2M
}

const handleAdd = () => {
  reset()
  if (bannerRef.value) bannerRef.value.clearValidate()
  open.value = true
  title.value = '新增轮播资源'
}

const handleUpdate = async (row) => {
  reset()
  if (bannerRef.value) bannerRef.value.clearValidate()
  const res = await getBanner(row.bannerId)
  form.value = res.data
  open.value = true
  title.value = '编辑轮播详情'
}

const submitForm = async () => {
  if (!bannerRef.value) return
  
  await bannerRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      console.log('正在提交轮播图数据:', JSON.stringify(form.value, null, 2))
      
      try {
        if (form.value.bannerId) {
          await updateBanner(form.value)
          ElMessage.success('信息更新成功')
        } else {
          await addBanner(form.value)
          ElMessage.success('新资源入库成功')
        }
        open.value = false
        getList()
      } catch (error) {
        console.error('提交失败详情:', error)
      } finally {
        submitLoading.value = false
      }
    } else {
      ElMessage.warning('请检查必填项，确保已上传图片')
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要移出当前的轮播展示吗？', '操作确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delBanner(row.bannerId)
    ElMessage.success('已删除')
    getList()
  })
}

const reset = () => {
  form.value = {
    bannerId: undefined,
    title: '',
    image: '',
    linkUrl: '',
    sort: 1,
    status: '0'
  }
}

const cancel = () => {
  open.value = false
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
:root {
  --premium-purple: #6c5ce7;
  --premium-blue: #0984e3;
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.4);
}

.banner-manager-container {
  padding: 30px;
  background: #f8faff;
  min-height: 100vh;
}

/* Header Styles */
.glass-header {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(108, 92, 231, 0.08);
  margin-bottom: 40px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.premium-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #6c5ce7, #0984e3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.premium-subtitle {
  color: #a0a0a0;
  margin: 10px 0 0;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.premium-add-btn {
  background: linear-gradient(135deg, #6c5ce7, #0984e3) !important;
  border: none !important;
  color: white !important;
  height: 54px !important;
  padding: 0 30px !important;
  border-radius: 16px !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  box-shadow: 0 10px 20px rgba(108, 92, 231, 0.2);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

.premium-add-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 30px rgba(108, 92, 231, 0.3);
}

/* Filter Section */
.filter-section {
  margin-bottom: 30px;
  max-width: 400px;
}

:deep(.premium-search .el-input__wrapper) {
  border-radius: 14px;
  padding: 10px 15px;
  background: #fff;
  border: none;
  box-shadow: 0 5px 15px rgba(0,0,0,0.03);
}

/* Grid & Card Styles */
.banner-grid {
  perspective: 1000px;
}

.premium-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0,0,0,0.05);
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  margin-bottom: 30px;
  opacity: 0;
  animation: slideInUp 0.6s forwards;
  animation-delay: var(--delay);
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(30px) rotateX(-5deg); }
  to { opacity: 1; transform: translateY(0) rotateX(0); }
}

.premium-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 20px 40px rgba(108, 92, 231, 0.15);
}

.card-preview {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.main-img {
  width: 100%;
  height: 100%;
  transition: transform 0.8s ease;
}

.premium-card:hover .main-img {
  transform: scale(1.1);
}

.card-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  color: #fff;
  z-index: 2;
}

.badge-active {
  background: rgba(82, 196, 26, 0.8);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.premium-card:hover .card-overlay {
  opacity: 1;
}

.action-btn {
  width: 50px !important;
  height: 50px !important;
  margin: 0 10px !important;
  border: none !important;
  font-size: 20px !important;
}

.edit-btn { background: #fff !important; color: var(--premium-purple) !important; }
.delete-btn { background: rgba(255, 71, 87, 0.9) !important; color: #fff !important; }

/* Card Content */
.card-content {
  padding: 24px;
}

.content-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.item-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2d3436;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weight-tag {
  color: var(--premium-purple);
  background: rgba(108, 92, 231, 0.1);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.content-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #636e72;
  font-size: 13px;
  max-width: 65%;
}

.link-text {
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-text:hover { color: var(--premium-purple); text-decoration: underline; }

.no-link { font-style: italic; opacity: 0.6; }

/* Dialog Styles - Professional Sharp Redesign */
:deep(.premium-dialog) {
  border-radius: 8px !important;
  background: #ffffff;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
}

.dialog-custom-header {
  padding: 18px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  position: relative;
}

.header-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  background: #4f46e5;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 20px;
  margin-right: 16px;
}

.header-title-box h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.header-title-box p {
  margin: 2px 0 0;
  font-size: 13px;
  color: #64748b;
}

.close-btn {
  position: absolute;
  top: 18px;
  right: 16px;
  width: 32px !important;
  height: 32px !important;
  color: #94a3b8 !important;
}

.close-btn:hover {
  background: #f1f5f9 !important;
  color: #1e293b !important;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

/* Compact Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.full-width { grid-column: span 2; }

:deep(.el-form-item) {
  margin-bottom: 0px !important;
}

:deep(.el-form-item__label) {
  font-weight: 600 !important;
  color: #334155 !important;
  font-size: 13px !important;
  padding-bottom: 6px !important;
  line-height: 1 !important;
}

/* Professional Inputs */
:deep(.el-input__wrapper), :deep(.el-input-number) {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  padding: 4px 12px !important;
  transition: all 0.2s ease !important;
}

:deep(.el-input__wrapper.is-focus), :deep(.el-input-number:focus-within) {
  border-color: #4f46e5 !important;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
}

/* Pro Radio Group */
.pro-radio-group { width: 100%; display: flex; gap: 8px; }
:deep(.pro-radio-group .el-radio-button__inner) {
  width: 100%;
  border-radius: 6px !important;
  border: 1px solid #cbd5e1 !important;
  background: #ffffff !important;
  color: #475569 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  padding: 10px !important;
  transition: all 0.2s !important;
}
:deep(.pro-radio-group .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #4f46e5 !important;
  border-color: #4f46e5 !important;
  color: #ffffff !important;
}

/* Compact Uploader */
:deep(.creative-uploader .el-upload-dragger) {
  padding: 12px !important;
  border-radius: 8px;
  border: 1px dashed #cbd5e1 !important;
  background: #f8fafc !important;
}

.creative-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.upload-icon { font-size: 32px; color: #64748b; margin-bottom: 8px; }
.upload-text { font-size: 13px; color: #64748b; }

.creative-uploaded { height: 180px; }

/* Sharp Footer */
.creative-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  flex: 1;
  height: 40px !important;
  border-radius: 6px !important;
  border: 1px solid #cbd5e1 !important;
  font-weight: 600 !important;
  background: #ffffff !important;
}

.submit-btn {
  flex: 2;
  height: 40px !important;
  border-radius: 6px !important;
  background: #4f46e5 !important;
  border: none !important;
  font-weight: 600 !important;
  color: #ffffff !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
}

.submit-btn:hover { background: #4338ca !important; }

/* Pagination */
.premium-pagination {
  margin-top: 50px;
  display: flex;
  justify-content: center;
}
</style>

