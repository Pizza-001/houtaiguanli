<template>
  <div class="billing-center-wrapper">
    <el-row :gutter="24" class="full-height-row">
      <!-- Left Section: Transaction List -->
      <el-col :span="16">
        <div class="billing-card main-list-panel">
          <div class="panel-header">
            <el-tabs v-model="activeTab" class="premium-tabs" @tab-change="handleQuery">
              <el-tab-pane name="all">
                <template #label>
                  <div class="tab-label">
                    <el-icon><Menu /></el-icon> 全部流水 <span class="count">({{ total }})</span>
                  </div>
                </template>
              </el-tab-pane>
              <el-tab-pane name="0">
                <template #label>
                  <div class="tab-label">
                    <el-icon><Clock /></el-icon> 待结账 <span class="count highlight">({{ pendingCount }})</span>
                  </div>
                </template>
              </el-tab-pane>
              <el-tab-pane name="1">
                <template #label>
                  <div class="tab-label">
                    <el-icon><CircleCheckFilled /></el-icon> 已归档记录
                  </div>
                </template>
              </el-tab-pane>
              <el-tab-pane name="points">
                <template #label>
                  <div class="tab-label">
                    <el-icon><Gift /></el-icon> 积分台账
                  </div>
                </template>
              </el-tab-pane>
            </el-tabs>

            <div class="header-actions">
              <el-select v-model="queryParams.businessType" placeholder="业务类型" clearable style="width: 120px" @change="handleQuery">
                <el-option label="疫苗" value="VACCINE" />
                <el-option label="门诊" value="CLINIC" />
                <el-option label="药品" value="MEDICINE" />
              </el-select>
              <el-input
                v-model="queryParams.orderNo"
                placeholder="宠物/电话/姓名"
                style="width: 200px"
                prefix-icon="Search"
                clearable
                @keyup.enter="handleQuery"
              />
            </div>
          </div>

          <div class="table-container">
            <el-table :data="billingList" v-loading="loading" class="premium-table" highlight-current-row @current-change="handleCurrentChange">
              <el-table-column label="单号流水" prop="orderNo" width="180">
                <template #default="scope">
                  <div class="order-no-cell">
                    <span class="no-text">{{ scope.row.orderNo }}</span>
                    <el-tag size="small" :type="getTypeTag(scope.row.businessType)" effect="light">{{ getTypeLabel(scope.row.businessType) }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="宠物详情" width="150" align="center">
                <template #default="scope">
                  <div class="pet-info-mini">
                    <span class="pet-name">宠物 #{{ scope.row.petId || '00' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="金额合计" prop="totalAmount" align="right">
                <template #default="scope">
                  <span class="amount-text">¥ {{ scope.row.totalAmount.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="结算状态" align="center" width="100">
                <template #default="scope">
                  <div class="status-indicator" :class="'status-' + scope.row.status">
                    {{ scope.row.status === '1' ? '已收银' : '待结算' }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="right">
                <template #default="scope">
                  <el-button link type="primary" icon="Memo" @click="handleCurrentChange(scope.row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pagination-footer">
            <el-pagination
              v-model:current-page="queryParams.pageNum"
              v-model:page-size="queryParams.pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="handleQuery"
              small
            />
          </div>
        </div>
      </el-col>

      <!-- Right Section: Settlement Panel -->
      <el-col :span="8">
        <div class="billing-card settlement-panel">
          <div v-if="!selectedRow" class="panel-empty-state">
            <el-icon class="empty-icon"><Search /></el-icon>
            <p>请挑选流水进行核算</p>
          </div>
          
          <div v-else class="panel-active-content">
            <div class="settlement-header">
              <h3>账单核算汇总</h3>
              <el-tag :type="selectedRow.status === '1' ? 'success' : 'warning'">
                {{ selectedRow.status === '1' ? '已核销' : '待结算' }}
              </el-tag>
            </div>

            <div class="order-summary-card">
              <div class="summary-item">
                <span class="label">流水号</span>
                <span class="value">{{ selectedRow.orderNo }}</span>
              </div>
              <div class="summary-item">
                <span class="label">应付总额</span>
                <span class="value price">¥ {{ selectedRow.totalAmount.toFixed(2) }}</span>
              </div>
              <el-divider border-style="dashed" />
              <div class="summary-item interactive">
                <span class="label">使用优惠券</span>
                <el-tag link>无可用优惠券</el-tag>
              </div>
              <div class="summary-item interactive">
                <span class="label">积分抵扣</span>
                <span class="value">0.00</span>
              </div>
            </div>

            <div class="actual-pay-box">
              <span class="pay-label">实收合计</span>
              <span class="pay-amount">¥ {{ selectedRow.totalAmount.toFixed(2) }}</span>
            </div>

            <div v-if="selectedRow.status === '0'" class="payment-methods-grid">
              <div 
                v-for="method in paymentMethods" 
                :key="method.id" 
                class="method-tile"
                :class="{ active: selectedMethod === method.id }"
                @click="selectedMethod = method.id"
              >
                <el-icon><component :is="method.icon" /></el-icon>
                <span>{{ method.label }}</span>
              </div>
            </div>

            <div v-else class="payment-history-info">
              <div class="history-row">
                <span class="label">结算人:</span>
                <span class="value">管理员</span>
              </div>
              <div class="history-row">
                <span class="label">结算时间:</span>
                <span class="value">{{ selectedRow.paymentTime || '--' }}</span>
              </div>
              <div class="history-row">
                <span class="label">支付方式:</span>
                <span class="value gold">{{ selectedRow.paymentMethod || 'CASH' }}</span>
              </div>
            </div>

            <div class="panel-action-footer">
              <el-button v-if="selectedRow.status === '0'" type="primary" size="large" class="settle-btn" @click="handleSettle">
                确认结算核销
              </el-button>
              <el-button v-else type="default" size="large" class="print-btn" icon="Printer">
                打印凭证回执
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listBilling, settleBilling } from '@/api/hospital/billing'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const activeTab = ref('all')
const total = ref(0)
const pendingCount = ref(0)
const billingList = ref([])
const selectedRow = ref(null)
const selectedMethod = ref('CASH')

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  businessType: '',
  status: undefined
})

const paymentMethods = [
  { id: 'CASH', label: '现金', icon: 'Wallet' },
  { id: 'ALIPAY', label: '支付宝', icon: 'Coin' },
  { id: 'WECHAT', label: '微信', icon: 'Iphone' },
  { id: 'BALANCE', label: '余额', icon: 'SoldOut' }
]

const handleQuery = () => {
  loading.value = true
  queryParams.value.status = activeTab.value === 'all' || activeTab.value === 'points' ? undefined : activeTab.value
  
  listBilling(queryParams.value).then(res => {
    billingList.value = res.rows
    total.value = res.total
    // For demo/UI, we treat 'all' as a trigger to refresh pending count
    if (activeTab.value === 'all') {
       pendingCount.value = res.rows.filter(b => b.status === '0').length
    }
  }).finally(() => {
    loading.value = false
  })
}

const handleCurrentChange = (row) => {
  selectedRow.value = row
}

const handleSettle = () => {
  if (!selectedRow.value) return
  
  ElMessageBox.confirm(`确认收到客户 ¥ ${selectedRow.value.totalAmount.toFixed(2)} 吗？结算后不可撤销。`, '收银核销确认', {
    confirmButtonText: '确定核销',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    settleBilling(selectedRow.value.id, selectedMethod.value).then(() => {
      ElMessage.success('结算核销成功，已自动归档')
      handleQuery()
      selectedRow.value = null
    })
  })
}

const getTypeLabel = (type) => {
  const map = { VACCINE: '疫苗', CLINIC: '门诊', MEDICINE: '药品', GENERAL: '其他' }
  return map[type] || '业务'
}

const getTypeTag = (type) => {
  const map = { VACCINE: 'info', CLINIC: 'primary', MEDICINE: 'success', GENERAL: 'warning' }
  return map[type] || ''
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.billing-center-wrapper {
  padding: 24px;
  background-color: var(--bg-main);
  height: calc(100vh - 60px);
}

.full-height-row {
  height: 100%;
}

.billing-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Panel Header & Tabs */
.panel-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.tab-label .count {
  font-size: 11px;
  color: var(--text-muted);
}

.tab-label .count.highlight {
  color: var(--primary);
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Table Design */
.table-container {
  flex: 1;
  padding: 0 12px;
}

.order-no-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.no-text {
  font-family: monospace;
  font-weight: 600;
  color: var(--text-main);
}

.amount-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.status-indicator {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 0;
  border-radius: 4px;
}

.status-0 { color: #f59e0b; }
.status-1 { color: #10b981; }

.pagination-footer {
  padding: 16px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--border-color);
}

/* Settlement Panel */
.panel-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.panel-active-content {
  padding: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settlement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.settlement-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
}

.order-summary-card {
  background: var(--bg-main);
  padding: 24px;
  border-radius: var(--radius-md);
  margin-bottom: 30px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.summary-item .label { color: var(--text-secondary); }
.summary-item .value { font-weight: 600; color: var(--text-main); }
.summary-item .value.price { color: var(--primary); font-size: 18px; }

.summary-item.interactive {
  cursor: pointer;
}

.actual-pay-box {
  background: var(--primary-light);
  padding: 24px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
  border: 1px dashed var(--primary);
}

.pay-label { font-size: 12px; color: var(--primary); margin-bottom: 8px; font-weight: 600; }
.pay-amount { font-size: 36px; font-weight: 900; color: var(--primary); }

/* Payment Methods */
.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: auto;
}

.method-tile {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.method-tile .el-icon { font-size: 24px; color: var(--text-muted); }
.method-tile span { font-size: 13px; font-weight: 600; }

.method-tile.active {
  border-color: var(--primary);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(94, 92, 230, 0.1);
}

.method-tile.active .el-icon { color: var(--primary); }

.payment-history-info {
  margin-top: auto;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 30px;
}

.history-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.history-row .gold { color: var(--primary); font-weight: 700; }

.panel-action-footer .el-button {
  width: 100%;
  height: 52px;
  font-size: 16px;
  letter-spacing: 2px;
}

.settle-btn {
  box-shadow: 0 8px 16px rgba(94, 92, 230, 0.2);
}
</style>
