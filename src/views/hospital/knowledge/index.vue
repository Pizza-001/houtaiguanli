<template>
  <div class="hospital-container">
    <!-- 顶部 HUD 统计面板 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="8" v-for="(item, index) in kpiData" :key="index">
        <div class="kpi-card" :style="{ borderTopColor: item.color }">
          <div class="kpi-info">
            <span class="kpi-label">{{ item.label }}</span>
            <div class="kpi-main">
              <span class="kpi-value">{{ item.value }}</span>
              <span class="kpi-unit">{{ item.unit }}</span>
            </div>
          </div>
          <el-icon class="kpi-icon" :style="{ color: item.color }"><component :is="item.icon" /></el-icon>
        </div>
      </el-col>
    </el-row>

    <!-- 检索与过滤控制台 -->
    <el-card class="filter-card glass-card" shadow="never">
      <el-form :inline="true" :model="queryParams" class="pro-search-form">
        <el-form-item label="文章标题">
          <el-input v-model="queryParams.title" placeholder="模糊匹配" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="分类归属">
          <el-select v-model="queryParams.category" placeholder="全部分类" clearable style="width: 150px" @change="handleQuery">
            <el-option label="日常护理" value="日常护理" />
            <el-option label="医疗百科" value="医疗百科" />
            <el-option label="行为训练" value="行为训练" />
            <el-option label="营养建议" value="营养建议" />
            <el-option label="心理健康" value="心理健康" />
            <el-option label="急救常识" value="急救常识" />
            <el-option label="品种科普" value="品种科普" />
          </el-select>
        </el-form-item>
        <el-form-item label="展示状态">
          <el-radio-group v-model="queryParams.status" @change="handleQuery">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="0">发布中</el-radio-button>
            <el-radio-button label="1">已下架</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">开始检索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置控制台</el-button>
        </el-form-item>
        <div class="header-ops">
          <el-button type="success" icon="Plus" @click="handleAdd" class="pro-btn">发布新文章</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="main-card glass-card">
      <el-table 
        v-loading="loading" 
        :data="knowledgeList" 
        row-class-name="pro-table-row"
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '700' }"
      >
        <el-table-column label="文章预览" width="400">
          <template #default="scope">
            <div class="article-cell" :class="{ 'is-offline': scope.row.status === '1' }">
              <div class="article-cover">
                <el-icon v-if="!scope.row.coverImage"><Picture /></el-icon>
                <img v-else :src="scope.row.coverImage" />
                <div v-if="scope.row.status === '1'" class="offline-mask">已下架</div>
              </div>
              <div class="article-info">
                <span class="article-title">{{ scope.row.title }}</span>
                <div class="article-meta">
                  <span class="article-id">#{{ scope.row.knowledgeId }}</span>
                  <el-tag v-if="scope.row.status === '1'" size="small" type="info">归档历史</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类归属" align="center" width="130">
          <template #default="scope">
            <el-tag 
              :class="['cate-tag', getCateClass(scope.row.category)]"
              effect="light"
              round
            >
              {{ scope.row.category || '未分类' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="内容贡献者" align="center" width="160">
          <template #default="scope">
            <div class="author-cell">
              <el-avatar :size="28" :src="scope.row.contributorAvatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="author-info">
                <span class="author-name">{{ scope.row.author || '平台专家' }}</span>
                <el-tag size="small" effect="plain" class="contributor-tag">专栏作者</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="传播热度 (移动端)" align="center" width="160">
          <template #default="scope">
            <div class="views-cell">
              <div class="views-header">
                <el-icon class="view-icon"><View /></el-icon>
                <span class="view-count">{{ formatViews(scope.row.views) }}</span>
              </div>
              <el-progress 
                :percentage="calculateHeat(scope.row.views)" 
                :show-text="false" 
                :stroke-width="4"
                class="heat-bar"
                :color="customColors"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="近期动态" align="center" prop="createTime" width="180">
          <template #default="scope">
            <div class="time-cell">
               <span class="date-text">{{ scope.row.createTime }}</span>
               <span class="time-label">创建日期</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="管理指令" align="center" fixed="right" width="220">
          <template #default="scope">
            <div class="action-btns-pro">
              <el-tooltip content="修订内容" placement="top">
                <el-button circle type="primary" :icon="Edit" @click="handleUpdate(scope.row)" />
              </el-tooltip>
              
              <el-tooltip :content="scope.row.status === '0' ? '执行下架' : '重新发布'" placement="top">
                <el-button 
                  circle
                  :type="scope.row.status === '0' ? 'warning' : 'success'" 
                  :icon="scope.row.status === '0' ? 'CircleClose' : 'CircleCheck'" 
                  @click="handleStatusToggle(scope.row, scope.row.status === '0' ? '1' : '0')"
                />
              </el-tooltip>

              <el-tooltip content="彻底销毁" placement="top">
                <el-button circle type="danger" :icon="Delete" @click="handleRealDelete(scope.row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-footer">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 文章编辑器对话框 -->
    <el-dialog :title="title" v-model="open" width="680px" append-to-body class="pro-dialog">
      <el-form ref="knowledgeRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="文章标题" prop="title">
              <el-input v-model="form.title" placeholder="输入引人注目的标题..." />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容分类归属" prop="category">
              <el-select v-model="form.category" placeholder="选择归属分类" style="width: 100%">
                <el-option label="日常护理" value="日常护理" />
                <el-option label="医疗百科" value="医疗百科" />
                <el-option label="行为训练" value="行为训练" />
                <el-option label="营养建议" value="营养建议" />
                <el-option label="心理健康" value="心理健康" />
                <el-option label="急救常识" value="急救常识" />
                <el-option label="品种科普" value="品种科普" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容贡献者" prop="author">
              <el-input v-model="form.author" placeholder="作者或贡献机构名称" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
             <el-form-item label="封面图片 (URL)" prop="coverImage">
              <el-input v-model="form.coverImage" placeholder="请输入封面图链接或上传..." />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="文章正文内容" prop="content">
          <div class="editor-wrapper">
            <Toolbar
              class="editor-toolbar"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              class="editor-content"
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="handleCreated"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-foot">
          <el-button @click="cancel">取消操作</el-button>
          <el-button type="primary" @click="submitForm" class="submit-btn" icon="Notification">立即同步仓库</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, onMounted, computed } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { listKnowledge, getKnowledge, delKnowledge, addKnowledge, updateKnowledge } from '@/api/knowledge'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UserFilled, Reading, Plus, Search, Picture, Edit, Delete, View, 
  Refresh, CircleClose, CircleCheck, Notification, DataLine, Document, CirclePlus
} from '@element-plus/icons-vue'

const loading = ref(true)
const knowledgeList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)

// KPI 统计
const kpiData = computed(() => {
  const totalViews = knowledgeList.value.reduce((acc, k) => acc + (k.views || 0), 0)
  return [
    { label: '库内知识储备', value: total.value, unit: '篇', icon: 'Document', color: '#2563eb' },
    { label: '全平台传播量', value: totalViews, unit: '次', icon: 'DataLine', color: '#10b981' },
    { label: '待处理历史库', value: knowledgeList.value.filter(k => k.status === '1').length, unit: '篇', icon: 'Notification', color: '#f59e0b' }
  ]
})

// 样式类映射
const getCateClass = (cat) => {
  const map = {
    '日常护理': 'care',
    '医疗百科': 'medical',
    '行为训练': 'train',
    '营养建议': 'food',
    '心理健康': 'mental',
    '急救常识': 'emergency',
    '品种科普': 'science'
  }
  return map[cat] || 'default'
}

// 浏览量格式化
const formatViews = (val) => (val || 0) > 1000 ? (val / 1000).toFixed(1) + 'k' : (val || 0)
const calculateHeat = (val) => Math.min(((val || 0) / 4000) * 100, 100)
const customColors = [
  { color: '#cbd5e1', percentage: 20 },
  { color: '#3b82f6', percentage: 50 },
  { color: '#f43f5e', percentage: 90 },
]

// 编辑器
const editorRef = shallowRef()
const toolbarConfig = {}
const editorConfig = { placeholder: '从这里开启知识之门...' }
const handleCreated = (editor) => { editorRef.value = editor }

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  title: undefined,
  category: undefined,
  status: ""
})

const form = ref({})
const rules = {
  title: [{ required: true, message: '请赋予知识一个灵魂标题', trigger: 'blur' }],
  content: [{ required: true, message: '正文内容不能为空', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listKnowledge(queryParams.value)
    knowledgeList.value = res.rows
    total.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    title: undefined,
    category: undefined,
    status: ""
  }
  handleQuery()
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = '筹备新的养成知识'
}

const handleUpdate = async (row) => {
  reset()
  const res = await getKnowledge(row.knowledgeId)
  form.value = res.data
  open.value = true
  title.value = '修订知识细节'
}

const submitForm = async () => {
  if (form.value.knowledgeId) {
    await updateKnowledge(form.value)
    ElMessage.success('修订内容已同步')
  } else {
    await addKnowledge(form.value)
    ElMessage.success('新篇章已存入库')
  }
  open.value = false
  // 强制拉取最新数据，并重置到第一页以显示最新内容（如果是新增）
  if (!form.value.knowledgeId) queryParams.value.pageNum = 1
  getList()
}

// 逻辑上下架切换
const handleStatusToggle = async (row, targetStatus) => {
  const action = targetStatus === '1' ? '下架' : '重新发布'
  const confirmMsg = targetStatus === '1' 
    ? '下架后文章将在小程序/前端隐藏，仅在历史库可见。' 
    : '确定重新发布该文章吗？'
  
  ElMessageBox.confirm(confirmMsg, `操作确认: ${action}`, {
    confirmButtonText: '立即执行',
    cancelButtonText: '取消',
    type: targetStatus === '1' ? 'warning' : 'info'
  }).then(async () => {
    row.status = targetStatus
    await updateKnowledge(row)
    ElMessage({
      message: `${action}操作成功`,
      type: targetStatus === '1' ? 'warning' : 'success'
    })
    getList()
  })
}

// 物理彻底删除
const handleRealDelete = (row) => {
  ElMessageBox.confirm('【危险操作】确定彻底销毁该记录吗？此操作不可撤销！', '数据清理确认', {
    type: 'error',
    confirmButtonText: '彻底删除',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    await delKnowledge(row.knowledgeId)
    ElMessage.success('记录已永久抹除')
    getList()
  })
}

const reset = () => {
  form.value = {
    knowledgeId: undefined,
    title: '',
    category: '',
    content: '',
    author: '平台专家',
    views: 0,
    coverImage: '',
    status: '0'
  }
}

const cancel = () => { open.value = false }

onMounted(() => getList())
</script>

<style scoped>
.hospital-container {
  padding: 24px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
}

.stat-row { margin-bottom: 24px; }
.kpi-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 5px solid #ccc;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  transition: transform 0.3s;
}
.kpi-card:hover { transform: translateY(-3px); }
.kpi-label { font-size: 13px; color: #64748b; font-weight: 700; opacity: 0.8; }
.kpi-value { font-size: 32px; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
.kpi-unit { font-size: 13px; color: #94a3b8; font-weight: 500; }
.kpi-icon { font-size: 44px; opacity: 0.12; }

/* 过滤面板 */
.filter-card { border-radius: 12px; border: none; margin-bottom: 20px; padding: 15px 0 0 0; }
.pro-search-form { display: flex; align-items: center; flex-wrap: wrap; position: relative; width: 100%; border-bottom: 0px; }
.header-ops { margin-left: auto; margin-right: 20px; }

/* 表格样式 */
.main-card { border-radius: 12px; border: none; }
.article-cell { display: flex; align-items: center; gap: 16px; transition: opacity 0.3s; }
.is-offline { opacity: 0.6; }
.article-cover {
  width: 70px;
  height: 46px;
  background: #f1f5f9;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.article-cover img { width: 100%; height: 100%; object-fit: cover; }
.offline-mask {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center;
}

.article-info { display: flex; flex-direction: column; gap: 6px; }
.article-title { font-weight: 700; color: #1e293b; font-size: 14px; }
.article-meta { display: flex; align-items: center; gap: 10px; }
.article-id { font-size: 11px; color: #94a3b8; font-family: monospace; }

.cate-tag { border: none; font-weight: 700; padding: 0 14px; }
.cate-tag.care { background: #e0f2fe; color: #0369a1; }
.cate-tag.medical { background: #dcfce7; color: #166534; }
.cate-tag.train { background: #fef3c7; color: #92400e; }
.cate-tag.food { background: #fee2e2; color: #991b1b; }

.author-cell { display: flex; align-items: center; gap: 12px; }
.author-info { display: flex; flex-direction: column; gap: 2px; text-align: left; }
.author-name { font-size: 14px; color: #1e293b; font-weight: 700; line-height: 1.2; }
.contributor-tag { border: none; background: #f1f5f9; color: #64748b; font-size: 11px; height: 18px; padding: 0 6px; }

.views-cell { display: flex; flex-direction: column; gap: 6px; width: 120px; margin: 0 auto; }
.views-header { display: flex; align-items: center; justify-content: center; gap: 6px; }
.view-count { font-size: 14px; font-weight: 800; color: #1e293b; }
.heat-bar { width: 100%; border-radius: 4px; overflow: hidden; }

.time-cell { display: flex; flex-direction: column; align-items: center; }
.date-text { color: #475569; font-size: 13px; font-weight: 500; }
.time-label { font-size: 11px; color: #94a3b8; }

.action-btns-pro { display: flex; gap: 8px; justify-content: center; }
.action-btns-pro .el-button { 
  transition: all 0.3s; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.action-btns-pro .el-button:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.cate-tag.mental { background: #fae8ff; color: #a21caf; }
.cate-tag.emergency { background: #fff1f2; color: #e11d48; }
.cate-tag.science { background: #f0f9ff; color: #0369a1; }

/* 编辑器美化 */
.editor-wrapper { border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
.editor-toolbar { border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.editor-content { height: 420px !important; }

.pagination-footer { margin-top: 24px; display: flex; justify-content: center; padding-bottom: 20px; }

.submit-btn {
  padding: 12px 40px; border-radius: 12px; font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none;
}
</style>
