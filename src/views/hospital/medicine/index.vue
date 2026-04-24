<template>
  <div class="hospital-container">
    <!-- 顶部统计面板 HUD -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="(item, index) in medicineStats" :key="index">
        <div class="stat-card" :class="item.class">
          <div class="stat-info">
            <span class="stat-label">{{ item.label }}</span>
            <span class="stat-value">{{ item.value }}</span>
          </div>
          <el-icon class="stat-icon"><component :is="item.icon" /></el-icon>
        </div>
      </el-col>
    </el-row>

    <!-- 检索与操作区 -->
    <el-card shadow="hover" class="query-card">
      <div class="card-header">
        <div class="label-group">
          <el-icon><ShoppingBag /></el-icon>
          <span>药房库存与商城管理</span>
        </div>
        <div class="action-group">
          <el-button type="primary" icon="Plus" @click="handleAdd" plain>新药入库</el-button>
        </div>
      </div>
      
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="pro-form">
        <el-form-item label="药品名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="搜索药品..." clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="分类" prop="type">
          <el-select v-model="queryParams.type" placeholder="全部分类" clearable style="width: 150px">
            <el-option v-for="dict in categories" :key="dict" :label="dict" :value="dict" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery" icon="Search">检索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表展示区 -->
    <el-card shadow="hover" class="table-card glass-card">
      <el-table 
        v-loading="loading" 
        :data="medicineList" 
        row-class-name="pro-row"
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '600' }"
      >
        <el-table-column label="药品信息" align="left" width="300">
          <template #default="scope">
            <div class="medicine-cell">
              <div class="medicine-img-box">
                <el-image 
                  :src="scope.row.image ? formatImageUrl(scope.row.image) : '/static/images/med-placeholder.png'" 
                  fit="cover"
                  class="medicine-img"
                >
                  <template #error>
                    <div class="image-slot"><el-icon><Memo /></el-icon></div>
                  </template>
                </el-image>
              </div>
              <div class="medicine-text">
                <span class="strong">{{ scope.row.name }}</span>
                <span class="sub-text">{{ scope.row.specification }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="分类" align="center" prop="type">
          <template #default="scope">
            <el-tag effect="plain" type="info" round>{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="单位" align="center" prop="unit" width="80" />

        <el-table-column label="执行单价" align="center" prop="price">
          <template #default="scope">
            <div class="price-container">
              <span class="currency">¥</span>
              <span class="price-value">{{ scope.row.price }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="当前库存" align="center" prop="stock">
          <template #default="scope">
            <el-tag :type="scope.row.stock < 10 ? 'danger' : 'success'" effect="light">
              {{ scope.row.stock }} {{ scope.row.unit }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="商城状态" align="center" prop="status" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              active-text="上架"
              inactive-text="下架"
              inline-prompt
              style="--el-switch-on-color: #10b981; --el-switch-off-color: #f43f5e"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="scope">
            <div class="op-buttons">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-show="total > 0"
          :total="total"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 药品编辑对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body class="pro-dialog">
      <el-form ref="medicineRef" :model="form" :rules="rules" label-width="100px" class="two-col-form">
        <el-row :gutter="20">
          <el-col :span="24" class="mb-20">
            <el-form-item label="商品图片">
              <div class="avatar-uploader" @click="handleUpload">
                <el-image v-if="form.image" :src="formatImageUrl(form.image)" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                <div class="upload-tip">点击上传商品图片</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="药品名称" prop="name">
              <el-input v-model="form.name" placeholder="如：海乐妙" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="药品分类" prop="type">
              <el-select v-model="form.type" placeholder="选择或填写" filterable allow-create style="width: 100%">
                <el-option v-for="t in categories" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号" prop="specification">
              <el-input v-model="form.specification" placeholder="如：100mg*2片" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计费单位" prop="unit">
              <el-input v-model="form.unit" placeholder="如：盒、支、瓶" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行价格" prop="price">
              <el-input-number v-model="form.price" :precision="2" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细说明" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="填写药品的功效、禁忌或用法..." />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" class="pro-submit">确 认</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listMedicine, getMedicine, delMedicine, addMedicine, updateMedicine, getMedicineCategories } from '@/api/medicine'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, ShoppingBag, Memo, Box, Money, Bell, Promotion } from '@element-plus/icons-vue'

const loading = ref(true)
const medicineList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)
const categories = ref([])

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  type: undefined
})

const form = ref({})
const rules = {
  name: [{ required: true, message: '药品名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '请选择或填写分类', trigger: 'change' }],
  price: [{ required: true, message: '价格不能为空', trigger: 'blur' }]
}

// 统计 HUD
const medicineStats = computed(() => {
  const stockWarning = medicineList.value.filter(m => m.stock < 10).length
  const onShelf = medicineList.value.filter(m => m.status === '0').length
  return [
    { label: '在售商品总数', value: total.value, icon: 'Box', class: 'blue' },
    { label: '当前上架中', value: onShelf, icon: 'Promotion', class: 'green' },
    { label: '库存偏低预警', value: stockWarning, icon: 'Bell', class: 'orange' },
    { label: '均价水平 (RMB)', value: 0, icon: 'Money', class: 'purple' }
  ]
})

const formatImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return import.meta.env.VITE_APP_BASE_API + url
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listMedicine(queryParams.value)
    medicineList.value = res.rows
    total.value = res.total
    
    // 获取分类
    const catRes = await getMedicineCategories()
    categories.value = catRes.data
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
    name: undefined,
    type: undefined
  }
  handleQuery()
}

const reset = () => {
  form.value = {
    medicineId: undefined,
    name: '',
    type: '',
    specification: '',
    unit: '盒',
    price: 0,
    stock: 100,
    image: '',
    description: '',
    status: '0'
  }
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = '药品信息入库'
}

const handleUpdate = async (row) => {
  reset()
  const res = await getMedicine(row.medicineId)
  form.value = res.data
  open.value = true
  title.value = '药品参数修改'
}

const handleStatusChange = async (row) => {
  const text = row.status === '0' ? '上架' : '下架'
  try {
    await updateMedicine(row)
    ElMessage.success(`${text}成功`)
  } catch (err) {
    row.status = row.status === '0' ? '1' : '0'
  }
}

const submitForm = async () => {
  if (form.value.medicineId) {
    await updateMedicine(form.value)
    ElMessage.success('修改成功')
  } else {
    await addMedicine(form.value)
    ElMessage.success('添加成功')
  }
  open.value = false
  getList()
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除“${row.name}”的记录吗？`, '警告', { type: 'warning' }).then(async () => {
    await delMedicine(row.medicineId)
    ElMessage.success('删除成功')
    getList()
  })
}

// 模拟上传图片
const handleUpload = () => {
  // 实际项目中应调用成熟的上传组件或API
  ElMessage.info('正在调用文件服务器...')
}

const cancel = () => {
  open.value = false
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.hospital-container {
  padding: 24px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
}

.stat-row { margin-bottom: 24px; }
.stat-card {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px; background: #fff; border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  transition: all 0.3s;
}
.stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.stat-card.blue { border-left: 5px solid #3b82f6; }
.stat-card.green { border-left: 5px solid #10b981; }
.stat-card.purple { border-left: 5px solid #8b5cf6; }
.stat-card.orange { border-left: 5px solid #f59e0b; }

.stat-label { display: block; font-size: 13px; color: #64748b; margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: 800; color: #1e293b; }
.stat-icon { font-size: 40px; color: #cbd5e1; opacity: 0.5; }

.query-card { border-radius: 16px; margin-bottom: 24px; border: none; }
.table-card { border-radius: 16px; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.04); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.label-group { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; }

.medicine-cell { display: flex; align-items: center; gap: 12px; }
.medicine-img-box { width: 60px; height: 60px; border-radius: 10px; overflow: hidden; background: #f1f5f9; }
.medicine-img { width: 100%; height: 100%; }
.medicine-text { display: flex; flex-direction: column; }
.strong { font-weight: 700; color: #1e293b; }
.sub-text { font-size: 12px; color: #94a3b8; margin-top: 4px; }

.price-container { display: flex; align-items: baseline; gap: 2px; }
.currency { font-size: 12px; color: #f43f5e; font-weight: 600; }
.price-value { color: #f43f5e; font-weight: 800; font-size: 18px; }

.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }

.avatar-uploader {
  width: 120px; height: 120px; border: 1px dashed #d9d9d9; border-radius: 12px;
  cursor: pointer; position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: border-color 0.3s;
}
.avatar-uploader:hover { border-color: #409eff; }
.avatar-uploader-icon { font-size: 28px; color: #8c939d; }
.upload-tip { font-size: 12px; color: #94a3b8; margin-top: 8px; }
.avatar { width: 100%; height: 100%; object-fit: cover; }

.mb-20 { margin-bottom: 20px; }
.pro-submit { padding: 10px 30px; font-weight: 600; }
</style>
