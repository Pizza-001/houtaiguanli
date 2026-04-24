<template>
  <div class="app-container">
    <!-- 1. 顶部统计概览 -->
    <el-row :gutter="20" class="mb20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card blue">
          <div class="stat-title">今日总预约</div>
          <div class="stat-value">{{ totalToday }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card orange">
          <div class="stat-title">待审核预约</div>
          <div class="stat-value">{{ pendingCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card green">
          <div class="stat-title">已确认就诊</div>
          <div class="stat-value">{{ confirmCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card grey">
          <div class="stat-title">已取消/过期</div>
          <div class="stat-value">{{ cancelCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 搜索过滤区 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item label="模糊搜索" prop="petName">
        <el-input
          v-model="queryParams.petName"
          placeholder="宠物名/主人名"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="主诊医生" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="医生姓名"
          clearable
          style="width: 160px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="预约日期" prop="date">
        <el-date-picker
          v-model="queryParams.date"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
          <el-option label="待就诊" value="0" />
          <el-option label="已完成" value="1" />
          <el-option label="已取消" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 3. 数据表格区 -->
    <el-table v-loading="loading" :data="reservationList" border stripe class="custom-table">
      <el-table-column label="预约号" align="center" prop="reservationId" width="180" />
      <el-table-column label="预约类型" align="center" prop="type">
        <template #default="scope">
          <el-tag :type="scope.row.type === '疫苗预约' ? 'info' : 'primary'">{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="患宠信息" align="left" width="180">
        <template #default="scope">
          <div class="pet-cell">
            <span class="p-name">{{ scope.row.petName }}</span>
            <span class="p-info">{{ scope.row.petBread }} / {{ scope.row.petAge }}岁</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="就诊人" align="center" prop="userName" />
      <el-table-column label="主诊医生" align="center" prop="name" />
      <el-table-column label="预约时段" align="center" width="180">
        <template #default="scope">
          <span>{{ scope.row.date }} {{ scope.row.time }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ formatStatus(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
          <el-button 
            v-if="scope.row.status === '0'"
            link 
            type="success" 
            icon="Check" 
            @click="handleComplete(scope.row)"
          >接诊完成</el-button>
          <el-button 
            v-if="scope.row.status === '0'"
            link 
            type="danger" 
            icon="Close" 
            @click="handleCancel(scope.row)"
          >取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 4. 详情弹窗 -->
    <el-dialog title="预约详情" v-model="detailOpen" width="500px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="症状描述">
          <div class="symptom-text">{{ currentRecord.symptom || '无症状描述' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="患宠品种">{{ currentRecord.petBread }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentRecord.userName }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ currentRecord.createTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailOpen = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { listReservation, updateReservation, delReservation } from '@/api/reservation'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const reservationList = ref([])
const detailOpen = ref(false)
const currentRecord = ref({})

// 模拟统计数据 (后期可对接口返回)
const totalToday = ref(0)
const pendingCount = ref(0)
const confirmCount = ref(0)
const cancelCount = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  petName: undefined,
  name: undefined,
  date: undefined,
  status: undefined
})

/** 查询列表 */
function getList() {
  loading.value = true
  listReservation(queryParams).then(response => {
    reservationList.value = response.rows
    total.value = response.total
    loading.value = false
    updateStats()
  }).catch(() => {
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.petName = undefined
  queryParams.name = undefined
  queryParams.date = undefined
  queryParams.status = undefined
  handleQuery()
}

function handleDetail(row) {
  currentRecord.value = row
  detailOpen.value = true
}

function handleComplete(row) {
  ElMessageBox.confirm('确认该预约已完成接诊？', '系统提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const data = { reservationId: row.reservationId, status: '1' }
    return updateReservation(data)
  }).then(() => {
    getList()
    ElMessage.success('状态更新成功')
  })
}

function handleCancel(row) {
  ElMessageBox.confirm('确定要取消该预约吗？此操作不可逆。', '系统提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(() => {
    const data = { reservationId: row.reservationId, status: '2' }
    return updateReservation(data)
  }).then(() => {
    getList()
    ElMessage.success('已取消预约')
  })
}

function getStatusType(status) {
  if (status === '0') return 'warning'
  if (status === '1') return 'success'
  if (status === '2') return 'danger'
  return 'info'
}

function formatStatus(status) {
  const map = { '0': '待就诊', '1': '已完成', '2': '已取消' }
  return map[status] || '未知'
}

function updateStats() {
  // 这里可以统计当前列表数据，仅做演示
  totalToday.value = total.value
  pendingCount.value = reservationList.value.filter(i => i.status === '0').length
  confirmCount.value = reservationList.value.filter(i => i.status === '1').length
  cancelCount.value = reservationList.value.filter(i => i.status === '2').length
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.mb20 { margin-bottom: 20px; }
.stat-card {
  height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center;
  color: #fff; border: none;
  .stat-title { font-size: 14px; opacity: 0.8; margin-bottom: 10px; }
  .stat-value { font-size: 28px; font-weight: 900; }
  &.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  &.orange { background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%); }
  &.green { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
  &.grey { background: linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%); }
}

.search-form {
  background: #f8fafc; padding: 20px 20px 0; border-radius: 8px; margin-bottom: 20px;
}

.pet-cell {
  display: flex; flex-direction: column;
  .p-name { font-weight: 700; color: #333; }
  .p-info { font-size: 12px; color: #999; }
}

.symptom-text {
  background: #fdf6ec; color: #e6a23c; padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.6;
}

.custom-table {
  border-radius: 8px; overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
</style>
