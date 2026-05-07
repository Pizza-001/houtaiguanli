<template>
  <div class="billing-universe">
    <el-row :gutter="24" class="content-row">
      <!-- 1. 左侧：流水与台账列表 (Main Ledger) -->
      <el-col :span="16">
        <div class="glass-card main-panel">
          <div class="panel-header">
            <div class="brand-info">
              <div class="brand-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="brand-text">
                <h1 class="main-title">收银核销中心</h1>
                <p class="sub-title">CASHIER LEDGER SYSTEM • ENTERPRISE EDITION</p>
              </div>
            </div>
            
            <div class="header-actions">
              <el-tabs v-model="activeTab" class="modern-tabs" @tab-change="handleTabChange">
                <el-tab-pane name="billing" label="营业流水" />
                <el-tab-pane name="points" label="积分台账" />
              </el-tabs>
            </div>
          </div>

          <!-- 智控控制台 (Smart Context Bar) -->
          <div class="context-bar">
            <div class="filter-section">
              <div class="filter-item">
                <span class="filter-label">状态筛选</span>
                <el-radio-group v-if="activeTab === 'billing'" v-model="queryParams.status" size="default" class="segmented-control" @change="handleQuery">
                  <el-radio-button label="">全部流水</el-radio-button>
                  <el-radio-button label="0">待结算</el-radio-button>
                  <el-radio-button label="1">已归档</el-radio-button>
                </el-radio-group>
                <el-radio-group v-else v-model="queryParams.status" size="default" class="segmented-control" @change="handleQuery">
                  <el-radio-button label="">全部记录</el-radio-button>
                  <el-radio-button label="0">待发放</el-radio-button>
                  <el-radio-button label="1">已完成</el-radio-button>
                </el-radio-group>
              </div>
              
              <div class="filter-item" v-if="activeTab === 'billing'">
                <span class="filter-label">业务领域</span>
                <el-select 
                  v-model="queryParams.businessType" 
                  placeholder="全业务领域" 
                  clearable 
                  style="width: 260px !important; height: 48px !important;"
                  class="premium-select-box"
                  @change="handleQuery"
                >
                  <el-option label="疫苗预约" value="VACCINE">
                    <span class="opt-content"><el-icon><Calendar /></el-icon> 疫苗预约</span>
                  </el-option>
                  <el-option label="门诊挂号" value="CLINIC">
                    <span class="opt-content"><el-icon><Finished /></el-icon> 门诊挂号</span>
                  </el-option>
                  <el-option label="药品处方" value="MEDICINE">
                    <span class="opt-content"><el-icon><Memo /></el-icon> 药品处方</span>
                  </el-option>
                </el-select>
              </div>
            </div>
            
            <div class="search-section">
              <el-input
                v-model="searchKey"
                placeholder="搜索单号 / 客户手机号 / 姓名..."
                class="premium-search"
                prefix-icon="Search"
                clearable
                @keyup.enter="handleQuery"
              >
                <template #append>
                  <el-button @click="handleQuery">检索</el-button>
                </template>
              </el-input>
            </div>
          </div>

          <!-- 数据展示区 -->
          <div class="table-frame" v-loading="loading">
            <!-- 营业流水表格 -->
            <el-table 
              v-if="activeTab === 'billing'"
              :data="billingList" 
              class="stellar-table" 
              highlight-current-row 
              @current-change="handleSelectRow"
            >
              <template #empty>
                <div class="empty-placeholder">
                  <el-icon class="icon-pulse"><Monitor /></el-icon>
                  <p>今日暂无待结算流水</p>
                  <el-button type="primary" plain size="small" @click="handleQuery">同步最新流水</el-button>
                </div>
              </template>
              <el-table-column label="交易单号" prop="orderNo" min-width="180">
                <template #default="scope">
                  <div class="id-wrapper">
                    <span class="serial">{{ scope.row.orderNo }}</span>
                    <div class="badges">
                      <span class="badge" :class="scope.row.businessType.toLowerCase()">{{ getTypeLabel(scope.row.businessType) }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="客户信息" min-width="140">
                <template #default="scope">
                  <div class="user-strip">
                    <span class="u-name">客户 #{{ scope.row.memberId || '散客' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="应付金额" align="right" width="140">
                <template #default="scope">
                  <span class="money-val">¥ {{ scope.row.totalAmount?.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" align="center" width="120">
                <template #default="scope">
                  <div class="state-pill" :class="scope.row.status === '1' ? 'done' : 'wait'">
                    {{ scope.row.status === '1' ? '已核销' : '待处理' }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="scope">
                  <el-button link type="primary" class="check-btn" @click="handleSelectRow(scope.row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 积分兑换表格 -->
            <el-table 
              v-else
              :data="pointsList" 
              class="stellar-table"
            >
              <template #empty>
                <div class="empty-placeholder">
                  <el-icon class="icon-pulse"><Coin /></el-icon>
                  <p>暂无积分兑换记录</p>
                  <el-button type="primary" plain size="small" @click="handleQuery">刷新数据</el-button>
                </div>
              </template>
              <el-table-column label="兑换单号" prop="id" width="100" />
              <el-table-column label="兑换商品" prop="productName" min-width="180">
                <template #default="scope">
                  <div class="product-cell">
                    <el-tag :type="scope.row.productType === 'COUPON' ? 'success' : 'warning'" size="small" effect="dark" style="margin-right:8px">
                      {{ scope.row.productType === 'COUPON' ? '券' : '款' }}
                    </el-tag>
                    <span>{{ scope.row.productName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="消耗积分" prop="exchangePoints" width="120" align="center">
                <template #default="scope">
                  <span class="points-val">-{{ scope.row.exchangePoints }} pts</span>
                </template>
              </el-table-column>
              <el-table-column label="兑换用户" min-width="150">
                <template #default="scope">
                  <div class="user-meta">
                    <div class="name">{{ scope.row.userName || '未知用户' }}</div>
                    <div class="phone">{{ scope.row.phonenumber }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="兑换时间" prop="exchangeTime" width="180" align="center" />
            </el-table>
          </div>

          <div class="pagination-area">
            <el-pagination
              v-model:current-page="queryParams.pageNum"
              v-model:page-size="queryParams.pageSize"
              :total="total"
              layout="total, prev, pager, next"
              background
              @current-change="handleQuery"
            />
          </div>
        </div>
      </el-col>

      <!-- 2. 右侧：核算面板 (Settlement Console) -->
      <el-col :span="8">
        <div class="glass-card console-panel">
          <div v-if="!selectedRow" class="console-empty">
            <div class="empty-anim">
              <el-icon><CreditCard /></el-icon>
            </div>
            <h3>等待挑选账单</h3>
            <p>请点击左侧列表中的记录进行核销结算</p>
          </div>

          <div v-else class="console-box animate-scale-in">
            <div class="console-header">
              <span class="label">结算详情</span>
              <div class="order-tag">{{ selectedRow.orderNo }}</div>
            </div>

            <div class="ticket-view">
              <div class="ticket-row">
                <span class="t-label">应收总额</span>
                <span class="t-value">¥ {{ selectedRow.totalAmount?.toFixed(2) }}</span>
              </div>
              <div class="ticket-row dashed">
                <span class="t-label">优惠减免</span>
                <span class="t-value">-¥ {{ selectedRow.discountAmount?.toFixed(2) || '0.00' }}</span>
              </div>
              <div class="total-bar">
                <span class="l">实收金额</span>
                <span class="v">¥ {{ (selectedRow.totalAmount - (selectedRow.discountAmount || 0)).toFixed(2) }}</span>
              </div>
            </div>

            <!-- 支付方式选择 -->
            <div v-if="selectedRow.status === '0'" class="pay-section">
              <div class="section-title">选择收款方式</div>
              <div class="pay-grid">
                <div 
                  v-for="item in payMethods" 
                  :key="item.id"
                  class="pay-item"
                  :class="{ active: currentPayMethod === item.id }"
                  @click="currentPayMethod = item.id"
                >
                  <el-icon><component :is="item.icon" /></el-icon>
                  <span>{{ item.label }}</span>
                </div>
              </div>
              <el-button type="primary" class="big-settle-btn" @click="doSettle">
                确认收款并核销记录
              </el-button>
            </div>

            <!-- 已结算展示 -->
            <div v-else class="history-section">
              <div class="stamp-pill">PAID 已归档</div>
              <div class="history-card">
                <div class="h-row">
                  <span>结算方式</span>
                  <span class="bold">{{ selectedRow.paymentMethod || 'CASH' }}</span>
                </div>
                <div class="h-row">
                  <span>结算日期</span>
                  <span class="bold">{{ selectedRow.paymentTime }}</span>
                </div>
                <div class="h-row">
                  <span>经办人</span>
                  <span class="bold">{{ selectedRow.createBy || '管理员' }}</span>
                </div>
              </div>
              <el-button class="print-btn" icon="Printer" plain>打印收据单据</el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  Monitor, Search, CreditCard, Money, Iphone, Coin, Wallet, Printer, Calendar, Finished, Connection, Memo
} from '@element-plus/icons-vue'
import { listBilling, settleBilling } from '@/api/hospital/billing'
import { listAllExchange } from '@/api/hospital/points'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const activeTab = ref('billing')
const billingList = ref([])
const pointsList = ref([])
const total = ref(0)
const searchKey = ref('')
const selectedRow = ref(null)
const currentPayMethod = ref('CASH')

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderNo: undefined,
  businessType: undefined,
  status: ''
})

const payMethods = [
  { id: 'CASH', label: '现金收款', icon: 'Money' },
  { id: 'WECHAT', label: '微信支付', icon: 'Iphone' },
  { id: 'ALIPAY', label: '支付宝', icon: 'Coin' },
  { id: 'BALANCE', label: '余额扣款', icon: 'Wallet' }
]

const handleTabChange = () => {
  queryParams.value.pageNum = 1
  queryParams.value.status = ''
  queryParams.value.businessType = undefined
  selectedRow.value = null
  handleQuery()
}

const handleQuery = () => {
  loading.value = true
  if (activeTab.value === 'billing') {
    queryParams.value.orderNo = searchKey.value
    listBilling(queryParams.value).then(res => {
      billingList.value = res.rows
      total.value = res.total
    }).finally(() => loading.value = false)
  } else {
    listAllExchange(queryParams.value).then(res => {
      pointsList.value = res.rows
      total.value = res.total
    }).finally(() => loading.value = false)
  }
}

const handleSelectRow = (row) => {
  if (activeTab.value === 'billing') {
    selectedRow.value = row
  }
}

const doSettle = () => {
  if (!selectedRow.value) return
  const finalPrice = (selectedRow.value.totalAmount - (selectedRow.value.discountAmount || 0)).toFixed(2)
  
  ElMessageBox.confirm(`确认为记录 [${selectedRow.value.orderNo}] 收到实付款 ¥${finalPrice} 吗？`, '核销确认', {
    confirmButtonText: '确定收款',
    cancelButtonText: '点错了',
    type: 'success'
  }).then(() => {
    settleBilling(selectedRow.value.id, currentPayMethod.value).then(() => {
      ElMessage.success('核销成功')
      handleQuery()
      selectedRow.value = null
    })
  })
}

const getTypeLabel = (t) => {
  const map = { VACCINE: '疫苗', CLINIC: '挂号', MEDICINE: '药品', GENERAL: '杂项' }
  return map[t] || '业务'
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped lang="scss">
.billing-universe {
  padding: 24px;
  background: #f0f2f5;
  height: calc(100vh - 60px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

.content-row { height: 100%; }

.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Panel Header Overhaul */
.panel-header {
  padding: 32px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, rgba(255,255,255,0.5), transparent);
  
  .brand-info {
    display: flex; gap: 20px; align-items: center;
    .brand-icon {
      width: 56px; height: 56px; 
      background: linear-gradient(135deg, #6366F1 0%, #4338CA 100%);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 28px; 
      box-shadow: 0 12px 24px rgba(99, 102, 241, 0.3);
    }
    .main-title { 
      margin: 0; font-size: 26px; font-weight: 850; color: #0F172A; 
      letter-spacing: -0.5px; line-height: 1.2;
    }
    .sub-title { 
      margin: 4px 0 0; font-size: 11px; font-weight: 700; color: #64748B; 
      letter-spacing: 1.5px; text-transform: uppercase;
    }
  }
}

.modern-tabs {
  --el-tabs-header-height: 48px;
  :deep(.el-tabs__nav-wrap::after) { display: none; }
  :deep(.el-tabs__active-bar) { height: 3px; border-radius: 3px; background: #6366F1; }
  :deep(.el-tabs__item) {
    font-size: 16px; font-weight: 600; color: #94A3B8; transition: 0.3s;
    &.is-active { color: #6366F1; font-weight: 800; }
    &:hover { color: #4338CA; }
  }
}

/* Context Bar (Modern Toolbar) */
.context-bar {
  padding: 20px 40px;
  margin: 0 20px 20px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex; justify-content: space-between; align-items: center;
  gap: 30px;
  
  .filter-section { display: flex; gap: 32px; align-items: center; }
  .filter-item {
    display: flex; flex-direction: column; gap: 8px;
    .filter-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
  }
  
  .segmented-control {
    background: #FFF; padding: 3px; border-radius: 10px; border: 1px solid #E2E8F0;
    :deep(.el-radio-button__inner) {
      border: none !important; border-radius: 8px !important; 
      background: transparent; color: #64748B; font-weight: 700;
      padding: 8px 16px; font-size: 13px;
    }
    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: #6366F1; color: #FFF; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }
  }
  
  .premium-select-box {
    :deep(.el-input__wrapper) {
      border-radius: 12px;
      height: 48px !important;
      padding: 0 16px !important;
      box-shadow: 0 0 0 1px #E2E8F0 !important;
      background-color: #fff !important;
      .el-input__inner {
        font-weight: 800 !important;
        color: #0F172A !important;
        font-size: 15px !important;
      }
    }
  }

  .opt-content { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #334155; }
  
  .search-section { flex: 1; max-width: 450px; }
  .premium-search {
    :deep(.el-input__wrapper) { 
      border-radius: 12px 0 0 12px; height: 44px; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    :deep(.el-input-group__append) {
      border-radius: 0 12px 12px 0; background: #6366F1; border: none;
      .el-button { color: #FFF; font-weight: 800; padding: 0 24px; border: none; }
    }
  }
}

/* Table Enhancements */
.table-frame { flex: 1; padding: 0 20px; overflow: hidden; margin-bottom: 10px; }
.stellar-table {
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  :deep(th.el-table__cell) { border: none; font-size: 13px; color: #94A3B8; font-weight: 700; padding: 16px 0; border-bottom: 2px solid #F1F5F9; }
  :deep(td.el-table__cell) { border: none; border-bottom: 1px solid #F1F5F9; padding: 14px 0; }
  
  .empty-placeholder {
    padding: 60px 0; text-align: center; color: #94A3B8;
    .el-icon { font-size: 48px; opacity: 0.3; margin-bottom: 16px; }
    p { font-size: 14px; font-weight: 600; margin-bottom: 16px; }
  }

  .id-wrapper {
    display: flex; align-items: center; gap: 12px;
    .serial { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; color: #334155; }
    .badge {
      padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900;
      &.vaccine { background: #EEF2FF; color: #6366F1; }
      &.clinic { background: #F0FDF4; color: #10B981; }
      &.medicine { background: #FFF7ED; color: #F59E0B; }
    }
  }
  
  .u-name { font-weight: 700; color: #475569; }
  .money-val { font-size: 20px; font-weight: 900; color: #0F172A; font-family: 'Inter', sans-serif; }
  
  .state-pill {
    display: inline-block; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 800;
    &.wait { background: #FEF9C3; color: #854D0E; }
    &.done { background: #DCFCE7; color: #166534; }
  }
  
  .points-val { color: #F59E0B; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
  .user-meta {
    .name { font-weight: 800; color: #334155; }
    .phone { font-size: 12px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; }
  }
}

.pagination-area { padding: 30px 40px; display: flex; justify-content: center; }

/* Right Console */
.console-empty {
  height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #94A3B8;
  .empty-anim { font-size: 80px; opacity: 0.1; margin-bottom: 24px; animation: float 3s infinite ease-in-out; }
  h3 { font-size: 20px; color: #64748B; margin-bottom: 8px; }
}

.console-box {
  padding: 40px; height: 100%; display: flex; flex-direction: column;
  .console-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;
    .label { font-size: 14px; color: #94A3B8; font-weight: 700; }
    .order-tag { background: #F1F5F9; padding: 6px 16px; border-radius: 10px; font-size: 13px; font-weight: 800; color: #1E293B; }
  }
}

.ticket-view {
  background: #1E293B; border-radius: 24px; padding: 30px; color: #fff;
  box-shadow: 0 15px 30px rgba(30, 41, 59, 0.2); margin-bottom: 40px;
  .ticket-row {
    display: flex; justify-content: space-between; margin-bottom: 16px;
    &.dashed { border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 16px; font-size: 13px; color: #94A3B8; }
    .t-label { opacity: 0.8; }
    .t-value { font-weight: 700; }
  }
  .total-bar {
    margin-top: 20px; display: flex; justify-content: space-between; align-items: center;
    .l { font-size: 14px; font-weight: 700; color: #5C6BC0; }
    .v { font-size: 32px; font-weight: 900; }
  }
}

.pay-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0 40px;
  .pay-item {
    background: #fff; border: 2rpx solid #F1F5F9; padding: 20px; border-radius: 20px;
    display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer;
    transition: 0.3s;
    .el-icon { font-size: 24px; color: #94A3B8; }
    span { font-size: 13px; font-weight: 700; color: #64748B; }
    &.active {
      border-color: #5C6BC0; background: #EEF2FF;
      .el-icon, span { color: #5C6BC0; }
      box-shadow: 0 8px 16px rgba(92, 107, 192, 0.1);
    }
  }
}

.big-settle-btn { width: 100%; height: 60px; border-radius: 18px; font-size: 18px; font-weight: 800; background: #5C6BC0; box-shadow: 0 10px 20px rgba(92, 107, 192, 0.3); }

.history-section {
  text-align: center;
  .stamp-pill { display: inline-block; padding: 8px 24px; border: 4rpx solid #10B981; border-radius: 10px; color: #10B981; font-weight: 900; margin-bottom: 30px; transform: rotate(-5deg); }
  .history-card {
    background: #F8FAFC; padding: 24px; border-radius: 20px; margin-bottom: 30px;
    .h-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #64748B; .bold { color: #1E293B; font-weight: 700; } }
  }
  .print-btn { width: 100%; border-radius: 14px; height: 44px; }
}

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
