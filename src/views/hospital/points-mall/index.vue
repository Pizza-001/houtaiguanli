<template>
  <div class="hospital-container">
    <el-card shadow="hover" class="query-card">
      <div class="card-header">
        <div class="label-group">
          <el-icon><Gift /></el-icon>
          <span>积分商城管理</span>
        </div>
      </view>
      
      <el-tabs v-model="activeTab" class="mall-tabs">
        <el-tab-pane label="商品上架管理" name="products">
          <el-table v-loading="loading" :data="productList">
            <el-table-column label="商品名称" align="center" prop="productName" />
            <el-table-column label="类型" align="center" prop="type">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'MEDICINE' ? 'success' : 'warning'">
                  {{ scope.row.type === 'MEDICINE' ? '药品' : '优惠券' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="所需积分" align="center" prop="pointsPrice">
              <template #default="scope">
                <span class="points-val">{{ scope.row.pointsPrice }} PT</span>
              </template>
            </el-table-column>
            <el-table-column label="库存" align="center" prop="stock" />
            <el-table-column label="状态" align="center" prop="status">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  active-value="0"
                  inactive-value="1"
                  @change="handleStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
              <template #default="scope">
                <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="履行兑换记录" name="records">
          <el-table v-loading="loading" :data="recordList">
            <el-table-column label="用户ID" align="center" prop="userId" />
            <el-table-column label="兑换商品" align="center" prop="productName" />
            <el-table-column label="消耗积分" align="center" prop="exchangePoints" />
            <el-table-column label="兑换时间" align="center" prop="exchangeTime" width="180" />
            <el-table-column label="状态" align="center" prop="status">
              <template #default="scope">
                <el-tag :type="scope.row.status === '0' ? 'info' : 'success'">
                  {{ scope.row.status === '0' ? '待发放' : '已完成' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listPointsProduct, listExchangeRecord } from '@/api/points-mall'
import { Gift } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const activeTab = ref('products')
const productList = ref([])
const recordList = ref([])

const getProductList = async () => {
  loading.value = true
  try {
    const res = await listPointsProduct()
    productList.value = res.rows
  } finally {
    loading.value = false
  }
}

const getRecordList = async () => {
  loading.value = true
  try {
    const res = await listExchangeRecord()
    recordList.value = res.rows
  } finally {
    loading.value = false
  }
}

const handleStatusChange = (row) => {
  ElMessage.success('状态更新成功 (模拟)')
}

onMounted(() => {
  getProductList()
  getRecordList()
})
</script>

<style scoped>
.hospital-container { padding: 20px; background: #f8fafc; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.label-group { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; color: #1e293b; }
.points-val { color: #6366f1; font-weight: 800; }
.mall-tabs { margin-top: 20px; }
</style>
