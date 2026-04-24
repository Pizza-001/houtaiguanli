<template>
  <div class="elite-center-wrapper">
    <!-- Section 1: Statistical Command Hub -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in clinicalStats" :key="index">
          <div class="stat-tile" :style="{ '--accent-color': stat.color }">
            <div class="stat-icon-box">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Section 2: Coordination Console -->
    <div class="coordination-main">
      <el-tabs v-model="activeView" class="clinical-tabs">
        <!-- View A: Global Coordination Monitor -->
        <el-tab-pane name="monitor">
          <template #label>
            <div class="tab-header-content">
              <el-icon><Platform /></el-icon> 实时会诊统筹矩阵
            </div>
          </template>
          
          <div class="monitor-toolbar">
            <div class="legend-group">
              <span class="legend-pill success">在岗</span>
              <span class="legend-pill primary">会诊</span>
              <span class="legend-pill warning">应急</span>
            </div>
            <div class="action-group">
              <el-button type="primary" icon="Plus" @click="handleAdd">录入医生档案</el-button>
              <el-button icon="Refresh" @click="getList">实时同步</el-button>
            </div>
          </div>

          <div v-loading="loading" class="monitor-grid">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in doctorList" :key="item.doctorId">
                <div class="clinical-doctor-card">
                  <div class="card-status-strip" :class="getStatusType(item)"></div>
                  <div class="card-main">
                    <el-avatar v-if="item.avatar" :size="50" :src="item.avatar" class="doctor-photo-solid" />
                    <el-avatar v-else :size="50" class="doctor-photo-solid">{{ (item.name || 'D').charAt(0) }}</el-avatar>
                    <div class="doctor-basic">
                      <div class="doctor-name-row">
                        <span class="name-text">{{ item.name }}</span>
                        <el-tag size="small" :type="getStatusTag(item)" effect="plain">{{ getStatusText(item) }}</el-tag>
                      </div>
                      <div class="title-text">{{ item.title }}</div>
                    </div>
                  </div>
                  <div class="expert-labels">
                    <span class="tag-pill" v-for="tag in (item.specialty || '核心骨干').split('，').slice(0, 2)" :key="tag">
                      {{ tag }}
                    </span>
                  </div>
                  <div class="card-footer-actions">
                    <span class="meta-id">ID: {{ item.doctorId.slice(-6) }}</span>
                    <el-button link type="primary" @click="handleUpdate(item)">档案修编</el-button>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- View B: Archive Management Registry -->
        <el-tab-pane name="archive">
          <template #label>
            <div class="tab-header-content">
              <el-icon><FolderOpened /></el-icon> 全院骨干人才库
            </div>
          </template>
          
          <div class="archive-registry">
            <div class="search-registry-bar">
              <el-form :inline="true" :model="queryParams" class="solid-search-form">
                <el-form-item label="姓名检索">
                  <el-input v-model="queryParams.name" placeholder="快速定位" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="专业职称">
                  <el-select v-model="queryParams.title" placeholder="职称筛选" clearable style="width: 130px">
                    <el-option label="主任医师" value="主任医师" />
                    <el-option label="副主任医师" value="副主任医师" />
                    <el-option label="主治医师" value="主治医师" />
                  </el-select>
                </el-form-item>
                <el-form-item label="统筹状态">
                  <el-select v-model="queryParams.status" placeholder="状态筛选" clearable style="width: 130px">
                    <el-option label="在岗" value="0" />
                    <el-option label="会诊" value="1" />
                    <el-option label="应急" value="2" />
                    <el-option label="休假" value="3" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleQuery">开始检索</el-button>
                  <el-button @click="resetQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <el-table :data="doctorList" v-loading="loading" class="clean-data-table" stripe>
              <el-table-column label="骨干肖像" width="100" align="center">
                <template #default="scope">
                  <el-avatar v-if="scope.row.avatar" :size="32" :src="scope.row.avatar" class="table-avatar" />
                  <el-avatar v-else :size="32" class="table-avatar">{{ (scope.row.name || 'D').charAt(0) }}</el-avatar>
                </template>
              </el-table-column>
              <el-table-column label="姓名" prop="name" width="120" />
              <el-table-column label="职称级别" prop="title" width="150" />
              <el-table-column label="擅长领域" prop="specialty" show-overflow-tooltip />
              <el-table-column label="建档日期" prop="createTime" width="180" align="center" />
              <el-table-column label="操作" width="180" fixed="right" align="right">
                <template #default="scope">
                  <el-button link type="primary" @click="handleUpdate(scope.row)">修编</el-button>
                  <el-button link type="danger" @click="handleDelete(scope.row)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="registry-pagination">
              <el-pagination
                v-model:current-page="queryParams.pageNum"
                v-model:page-size="queryParams.pageSize"
                :total="total"
                layout="prev, pager, next, total"
                @current-change="getList"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- DOSSIER DIALOG: High-Contrast Archive Card -->
    <el-dialog :title="title" v-model="open" width="600px" class="clinical-dialog">
      <div class="dossier-card-layout">
        <div class="dossier-header-border"></div>
        <el-form ref="doctorRef" :model="form" :rules="rules" label-position="top">
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="人员照片 AVATAR" prop="avatar">
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
                  <div v-if="form.avatar" class="creative-uploaded">
                    <img :src="form.avatar" class="preview-avatar" />
                    <div class="change-hint">
                      <el-icon><Refresh /></el-icon>
                      <span>更换头像</span>
                    </div>
                  </div>
                  <div v-else class="creative-placeholder">
                    <el-icon class="upload-icon"><UploadFilled /></el-icon>
                    <div class="upload-text">点击或拖拽上传证件照</div>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="姓名标识 NAME" prop="name">
                <el-input v-model="form.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="职责层级 RANK" prop="title">
                <el-select v-model="form.title" placeholder="请选择级别" style="width: 100%">
                  <el-option label="主任医师" value="主任医师" />
                  <el-option label="副主任医师" value="副主任医师" />
                  <el-option label="主治医师" value="主治医师" />
                  <el-option label="执业兽医师" value="执业兽医师" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="统筹调度状态 STATUS" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio-button label="0">在岗</el-radio-button>
              <el-radio-button label="1">会诊</el-radio-button>
              <el-radio-button label="2">应急</el-radio-button>
              <el-radio-button label="3">休假</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="临床专精方向 SPECIALTY" prop="specialty">
            <el-input v-model="form.specialty" type="textarea" :rows="4" 
                      placeholder="请详细描述该名额骨干的核心专长..." />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="clinical-footer">
          <el-button @click="cancel">取消操作</el-button>
          <el-button type="primary" @click="submitForm">确认完成建档</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { listDoctor, getDoctor, delDoctor, addDoctor, updateDoctor } from '@/api/doctor'
import { getToken } from '@/utils/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Refresh } from '@element-plus/icons-vue'

const activeView = ref('monitor')
const loading = ref(true)
const doctorList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)
const doctorRef = ref(null)

const uploadUrl = ref((import.meta.env.VITE_APP_BASE_API || '/dev-api') + '/common/upload')
const headers = ref({ Authorization: 'Bearer ' + getToken() })

// HUD Stats - REAL DATA Sync based on database 'status'
const clinicalStats = computed(() => [
  { label: '精英骨干总数', value: total.value, icon: 'UserFilled', color: '#3b82f6' },
  { label: '正在会诊中', value: doctorList.value.filter(d => d.status === '1').length, icon: 'Histogram', color: '#10b981' },
  { label: '应急任务量', value: doctorList.value.filter(d => d.status === '2').length, icon: 'Warning', color: '#f59e0b' },
  { label: '在岗出席率', value: ((doctorList.value.filter(d => d.status !== '3').length / (total.value || 1)) * 100).toFixed(1) + '%', icon: 'TrendCharts', color: '#8b5cf6' }
])

const queryParams = ref({
  pageNum: 1,
  pageSize: 12,
  name: undefined,
  title: undefined,
  status: undefined
})

const form = ref({
  doctorId: undefined,
  name: '',
  title: '主任医师',
  specialty: '',
  status: '0',
  avatar: ''
})

const rules = {
  name: [{ required: true, message: '必须提供姓名标识', trigger: 'blur' }],
  title: [{ required: true, message: '职责层级不可为空', trigger: 'change' }],
  status: [{ required: true, message: '统筹状态不可为空', trigger: 'change' }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listDoctor(queryParams.value)
    doctorList.value = res.rows
    total.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const getStatusType = (item) => {
  const map = { '0': 'primary', '1': 'success', '2': 'warning', '3': 'info' }
  return map[item.status] || 'primary'
}

const getStatusText = (item) => {
  const map = { '0': '在岗', '1': '会诊', '2': '应急', '3': '休假' }
  return map[item.status] || '未知状态'
}

const getStatusTag = (item) => {
  const map = { '0': '', '1': 'success', '2': 'warning', '3': 'info' }
  return map[item.status] || ''
}

const handleUploadSuccess = (res) => {
  if (res.code === 200) {
    form.value.avatar = res.url
    ElMessage.success('头像上传成功')
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

const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 12,
    name: undefined,
    title: undefined
  }
  handleQuery()
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = '新建精英人才档案'
}

const handleUpdate = async (row) => {
  reset()
  const res = await getDoctor(row.doctorId)
  form.value = res.data
  open.value = true
  title.value = '编辑核心骨干档案'
}

const submitForm = () => {
  doctorRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.doctorId) {
        await updateDoctor(form.value)
        ElMessage.success('档案修编已保存')
      } else {
        await addDoctor(form.value)
        ElMessage.success('人才库导入成功')
      }
      open.value = false
      getList()
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确认注销由 ${row.name} 建立的骨干档案吗？`, '安全操作确认', {
    confirmButtonText: '确定注销',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await delDoctor(row.doctorId)
    ElMessage.success('档案已安全移除')
    getList()
  })
}

const reset = () => {
  form.value = {
    doctorId: undefined,
    name: '',
    title: '主任医师',
    specialty: '',
    status: '0',
    avatar: ''
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
/* SOLID PROFESSIONAL CLINICAL THEME */
.elite-center-wrapper {
  padding: 30px;
  background-color: #f1f5f9;
  min-height: calc(100vh - 60px);
  color: var(--text-main);
}

/* Stats Styling */
.stats-overview {
  margin-bottom: 24px;
}

.stat-tile {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.stat-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.stat-icon-box {
  width: 52px;
  height: 52px;
  background: var(--accent-color);
  color: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

/* Tabs & Monitor */
.coordination-main {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 30px;
}

.tab-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.monitor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.legend-group {
  display: flex;
  gap: 16px;
}

.legend-pill {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
}
.legend-pill.success { background: #dcfce7; color: #15803d; }
.legend-pill.primary { background: #dbeafe; color: #1d4ed8; }
.legend-pill.warning { background: #fef3c7; color: #92400e; }

/* Doctor Card */
.clinical-doctor-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.clinical-doctor-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.card-status-strip {
  height: 4px;
}
.card-status-strip.success { background: #10b981; }
.card-status-strip.primary { background: #3b82f6; }
.card-status-strip.warning { background: #f59e0b; }

.card-main {
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.doctor-photo-solid {
  background-color: #3b82f6;
  font-weight: bold;
  font-size: 20px;
}

.name-text {
  font-size: 18px;
  font-weight: 700;
  margin-right: 8px;
}

.title-text {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

.expert-labels {
  padding: 0 20px 16px;
  display: flex;
  gap: 8px;
}

.tag-pill {
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  color: #475569;
}

.card-footer-actions {
  padding: 12px 20px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-id {
  font-size: 10px;
  font-family: monospace;
  color: #94a3b8;
}

/* Archive View */
.archive-registry {
  padding: 10px 0;
}

.search-registry-bar {
  margin-bottom: 24px;
}

.search-registry-bar :deep(.el-button--primary) {
  padding: 10px 24px !important;
  font-weight: 800 !important;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(94, 92, 230, 0.2) !important;
}

.search-registry-bar :deep(.el-button--default) {
  padding: 10px 24px !important;
  border-width: 1px !important;
}

.clean-data-table :deep(.el-table__header) {
  background-color: #f8fafc;
}

.table-avatar {
  background: #3b82f6;
  font-weight: bold;
}

.registry-pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* Clinical Dialog */
.clinical-dialog :deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

.clinical-dialog :deep(.el-dialog__header) {
  padding: 24px;
  margin-right: 0;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}

.dossier-card-layout {
  padding: 10px 0;
  position: relative;
}

.dossier-header-border {
  position: absolute;
  top: -24px;
  left: 0;
  width: 40px;
  height: 4px;
  background: #3b82f6;
}

.clinical-footer {
  padding-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.creative-uploaded { 
  height: 180px; 
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.preview-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-hint {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}

.creative-uploaded:hover .change-hint {
  opacity: 1;
}
</style>
