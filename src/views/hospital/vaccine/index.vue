<template>
  <div class="hospital-container">
    <!-- 顶部统计面坂 HUD -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="(item, index) in clinicalStats" :key="index">
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
          <el-icon><Search /></el-icon>
          <span>疫苗资源检索</span>
        </div>
        <div class="action-group">
          <el-button type="primary" icon="Plus" @click="handleAdd" plain>新增入库</el-button>
        </div>
      </div>
      
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="pro-form">
        <el-form-item label="疫苗名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="快速定位" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="生产厂家" prop="manufacturer">
          <el-input v-model="queryParams.manufacturer" placeholder="输入厂商" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="适用对象" prop="targetScope" style="width: 140px">
          <el-select v-model="queryParams.targetScope" placeholder="全部范围" clearable>
            <el-option label="猫用" value="猫用" />
            <el-option label="狗用" value="狗用" />
            <el-option label="通用" value="通用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">开始检索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置控制台</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表展示区 -->
    <el-card shadow="hover" class="table-card glass-card">
      <el-table 
        v-loading="loading" 
        :data="vaccineList" 
        row-class-name="pro-row"
        :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '600' }"
      >
        <el-table-column label="资源名称" align="left" prop="name" width="220">
          <template #default="scope">
            <div class="name-cell">
              <div class="name-icon-box">
                <el-icon><Box /></el-icon>
              </div>
              <div class="name-text">
                <span class="strong">{{ scope.row.name }}</span>
                <span class="sub-text">ID: {{ scope.row.vaccineId }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="生产厂家" align="center" prop="manufacturer">
          <template #default="scope">
            <div class="manufacturer-badge">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ scope.row.manufacturer || '未知厂商' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="适用范畴" align="center" prop="targetScope">
          <template #default="scope">
            <div class="scope-tag-wrapper">
              <el-tag 
                :class="['scope-tag', scope.row.targetScope === '猫用' ? 'cat' : (scope.row.targetScope === '狗用' ? 'dog' : 'all')]"
                effect="light"
                round
              >
                <el-icon class="tag-icon">
                  <component :is="scope.row.targetScope === '猫用' ? 'MagicStick' : (scope.row.targetScope === '狗用' ? 'Guide' : 'Open')" />
                </el-icon>
                {{ scope.row.targetScope }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="执行零售价" align="center" prop="price">
          <template #default="scope">
            <div class="price-container">
              <span class="currency">¥</span>
              <span class="price-value">{{ scope.row.price || '0.00' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="供应状态" align="center" prop="status">
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

        <el-table-column label="管理指令" align="center" width="200">
          <template #default="scope">
            <div class="op-buttons">
              <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)">参数调整</el-button>
              <el-divider direction="vertical" />
              <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">记录移除</el-button>
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

    <!-- 档案管理对话框 -->
    <el-dialog :title="title" v-model="open" width="650px" append-to-body class="pro-dialog">
      <el-form ref="vaccineRef" :model="form" :rules="rules" label-width="100px" class="two-col-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资源名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产厂商" prop="manufacturer">
              <el-input v-model="form.manufacturer" placeholder="生产企业全称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用范围" prop="targetScope">
              <el-select v-model="form.targetScope" placeholder="请选择" style="width: 100%">
                <el-option label="猫用" value="猫用" />
                <el-option label="狗用" value="狗用" />
                <el-option label="通用" value="通用" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行价格" prop="price">
              <el-input-number v-model="form.price" :precision="2" :step="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="接种注意事项" prop="notes">
              <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="填写禁忌或存储要求..." />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细说明" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="更多补充信息..." />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" class="pro-submit">确认并保存</el-button>
          <el-button @click="cancel">取消操作</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listVaccine, getVaccine, delVaccine, addVaccine, updateVaccine } from '@/api/vaccine'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const vaccineList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  manufacturer: undefined,
  targetScope: undefined
})

const form = ref({})
const rules = {
  name: [{ required: true, message: '资源名称不能为空', trigger: 'blur' }],
  targetScope: [{ required: true, message: '适用对象不能为空', trigger: 'change' }]
}

// 计算面板统计数据
const clinicalStats = computed(() => {
  const activeCount = vaccineList.value.filter(v => v.status === '0').length
  const avgPrice = vaccineList.value.length > 0 
    ? (vaccineList.value.reduce((acc, v) => acc + Number(v.price || 0), 0) / vaccineList.value.length).toFixed(1)
    : 0

  return [
    { label: '库存储备品种', value: total.value, icon: 'Box', class: 'blue' },
    { label: '在售活跃项目', value: activeCount, icon: 'Promotion', class: 'green' },
    { label: '均价水平 (RMB)', value: avgPrice, icon: 'Money', class: 'purple' },
    { label: '待处理预警', value: 0, icon: 'Bell', class: 'orange' }
  ]
})

const getList = async () => {
  loading.value = true
  try {
    const res = await listVaccine(queryParams.value)
    vaccineList.value = res.rows
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
    name: undefined,
    manufacturer: undefined,
    targetScope: undefined
  }
  handleQuery()
}

const reset = () => {
  form.value = {
    vaccineId: undefined,
    name: '',
    manufacturer: '',
    targetScope: '通用',
    price: 0,
    notes: '',
    description: '',
    status: '0'
  }
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = '疫苗资源入库'
}

const handleUpdate = async (row) => {
  reset()
  const res = await getVaccine(row.vaccineId)
  form.value = res.data
  open.value = true
  title.value = '疫苗参数调整'
}

const handleStatusChange = async (row) => {
  const isOffShelf = row.status === '1'
  const text = isOffShelf ? '下架' : '上架'
  try {
    await updateVaccine(row)
    ElMessage({
      message: `${text}成功`,
      type: isOffShelf ? 'warning' : 'success',
      duration: 2000
    })
  } catch (err) {
    row.status = isOffShelf ? '0' : '1'
  }
}

const submitForm = async () => {
  if (form.value.vaccineId) {
    await updateVaccine(form.value)
    ElMessage.success('修改成功')
  } else {
    await addVaccine(form.value)
    ElMessage.success('添加成功')
  }
  open.value = false
  getList()
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要从系统中移除该疫苗记录吗？', '重要提示', {
    type: 'warning',
    confirmButtonText: '强制删除',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    await delVaccine(row.vaccineId)
    ElMessage.success('移除成功')
    getList()
  })
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

/* HUD 样式 */
.stat-row {
  margin-bottom: 24px;
}
.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}
.stat-card.blue { border-top: 4px solid #3b82f6; }
.stat-card.green { border-top: 4px solid #10b981; }
.stat-card.purple { border-top: 4px solid #8b5cf6; }
.stat-card.orange { border-top: 4px solid #f59e0b; }

.stat-label {
  display: block;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  font-family: 'Inter', sans-serif;
}
.stat-icon {
  font-size: 44px;
  color: #cbd5e1;
  opacity: 0.4;
}

/* 卡片通用 */
.query-card {
  border-radius: 16px;
  margin-bottom: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.table-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 10px 40px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.label-group {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}
.label-group .el-icon {
  color: #3b82f6;
}

/* 表格增强 */
.name-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}
.name-icon-box {
  width: 36px;
  height: 36px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}
.name-text {
  display: flex;
  flex-direction: column;
}
.strong {
  font-weight: 700;
  color: #1e293b;
  font-size: 15px;
}
.sub-text {
  font-size: 11px;
  color: #94a3b8;
}

.manufacturer-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
}

.scope-tag-wrapper {
  display: flex;
  justify-content: center;
}
.scope-tag {
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 28px;
  font-weight: 600;
}
.scope-tag.cat { background: #dcfce7; color: #166534; }
.scope-tag.dog { background: #fef3c7; color: #92400e; }
.scope-tag.all { background: #e0f2fe; color: #075985; }
.tag-icon { font-size: 14px; }

.price-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}
.currency {
  font-size: 13px;
  color: #f43f5e;
  font-weight: 600;
}
.price-value {
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
  color: #f43f5e;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.op-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-wrapper {
  margin-top: 32px;
  padding: 16px 0;
  display: flex;
  justify-content: center;
}

/* 对话框增强 */
.pro-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.pro-submit {
  padding: 12px 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  font-weight: 600;
}
</style>
