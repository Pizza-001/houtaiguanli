<template>
  <div class="app-container">
    <el-card shadow="hover" class="query-card mb-20">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="模板名称" prop="title">
          <el-input v-model="queryParams.title" placeholder="请输入模板名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" class="premium-button">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header-flex">
          <div class="header-title">
            <el-icon><Ticket /></el-icon>
            <span>优惠券模板管理</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" plain icon="Plus" @click="handleAdd">新增模板</el-button>
            <el-button type="success" plain icon="Collection" @click="handleBatchInit" v-if="total === 0">初始化默认模板</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="couponList" stripe class="modern-table">
        <el-table-column label="ID" prop="couponId" width="80" align="center" />
        <el-table-column label="模板名称" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'CASH' ? 'success' : 'warning'">
              {{ scope.row.type === 'CASH' ? '现金券' : '折扣券' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="额度/折扣" align="center">
          <template #default="scope">
            <text class="amount-text" v-if="scope.row.type === 'CASH'">¥{{ scope.row.amount }}</text>
            <text class="amount-text" v-else>{{ scope.row.amount * 10 }}折</text>
          </template>
        </el-table-column>
        <el-table-column label="使用门槛" align="center">
          <template #default="scope">
            满{{ scope.row.minSpend }}元可用
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 弹窗 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body class="premium-dialog">
      <el-form ref="couponRef" :model="form" :rules="rules" label-width="100px" class="mt-20">
        <el-form-item label="模板名称" prop="title">
          <el-input v-model="form.title" placeholder="例如：全场通用、疫苗专项券" />
        </el-form-item>
        <el-form-item label="优惠类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="CASH">现金抵扣</el-radio>
            <el-radio label="PERCENT">折扣比例</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.type === 'CASH' ? '优惠金额' : '折扣比例'" prop="amount">
          <el-input-number v-model="form.amount" :precision="2" :step="0.1" :min="0" class="w100" />
          <div class="tip" v-if="form.type === 'PERCENT'">注：0.9 代表 9折</div>
        </el-form-item>
        <el-form-item label="使用门槛" prop="minSpend">
          <el-input-number v-model="form.minSpend" :min="0" class="w100" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w100"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { listCoupon, addCoupon, updateCoupon, delCoupon } from '@/api/hospital/billing'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Ticket, Plus, Edit, Delete, Collection } from '@element-plus/icons-vue'

const loading = ref(true)
const couponList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)
const dateRange = ref([])

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  title: undefined
})

const form = ref({})
const rules = {
  title: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
  amount: [{ required: true, message: '值不能为空', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listCoupon(queryParams.value)
    couponList.value = res.data
    total.value = res.data.length
  } catch (err) {
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  getList()
}

const resetQuery = () => {
  queryParams.value.title = undefined
  handleQuery()
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = '添加优惠券模板'
}

const handleUpdate = (row) => {
  reset()
  form.value = { ...row }
  dateRange.value = [row.validFrom, row.validTo]
  open.value = true
  title.value = '修改优惠券模板'
}

const submitForm = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    form.value.validFrom = dateRange.value[0]
    form.value.validTo = dateRange.value[1]
  }
  
  if (form.value.couponId) {
    await updateCoupon(form.value)
    ElMessage.success('修改成功')
  } else {
    await addCoupon(form.value)
    ElMessage.success('添加成功')
  }
  open.value = false
  getList()
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该模板？').then(async () => {
    await delCoupon(row.couponId)
    ElMessage.success('删除成功')
    getList()
  })
}

const handleBatchInit = () => {
  ElMessageBox.confirm('是否初始化默认优惠券模板？').then(async () => {
    const defaults = [
      { title: '新春全场通用券', type: 'CASH', amount: 20, minSpend: 200 },
      { title: '无门槛购药优惠券', type: 'CASH', amount: 10, minSpend: 0 },
      { title: '宠物疫苗专项券', type: 'CASH', amount: 50, minSpend: 200 },
      { title: '就诊服务抵扣券', type: 'CASH', amount: 30, minSpend: 300 }
    ]
    for (const item of defaults) {
      await addCoupon(item)
    }
    ElMessage.success('初始化成功')
    getList()
  })
}

const reset = () => {
  form.value = {
    couponId: undefined,
    title: '',
    type: 'CASH',
    amount: 10,
    minSpend: 100,
    status: '0'
  }
  dateRange.value = []
}

const cancel = () => {
  open.value = false
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
}
.query-card, .table-card { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.card-header-flex { display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; color: #1e293b; }
.header-title .el-icon { color: #f59e0b; }
.amount-text { font-weight: 800; color: #ef4444; font-size: 16px; }
.w100 { width: 100%; }
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.tip { font-size: 12px; color: #94a3b8; margin-top: 4px; }
</style>
