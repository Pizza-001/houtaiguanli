<template>
  <div class="dashboard-container">
    <div class="welcome-section mb-20">
      <h1 class="welcome-title">欢迎回来, {{ userName }}</h1>
      <p class="welcome-subtitle">这是宠物医院今日的实时数据概览</p>
    </div>

    <!-- Stats Cards Area -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6" v-for="item in stats" :key="item.title">
        <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0px' }">
          <div class="stat-inner" :style="{ background: item.grad }">
            <div class="stat-icon-wrapper">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-text">
              <div class="stat-label">{{ item.title }}</div>
              <div class="stat-val">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Area -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">近七日诊疗趋势</span>
              <el-tag size="small" type="success">实时更新</el-tag>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart-comp" :option="chartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="links-card">
          <template #header>
            <span class="header-title">快捷入口</span>
          </template>
          <div class="quick-grid">
            <div 
              v-for="link in quickLinks" 
              :key="link.title" 
              class="quick-item"
              @click="handleQuickAction(link.action)"
            >
              <div class="quick-icon-box" :style="{ color: link.color }">
                <el-icon><component :is="link.icon" /></el-icon>
              </div>
              <div class="quick-label">{{ link.title }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt-20 info-card glass-card">
          <div class="hospital-status">
            <div class="status-item">
              <span class="status-dot success"></span>
              <span class="status-label">在线医生</span>
              <span class="status-val">12</span>
            </div>
            <div class="status-item">
              <span class="status-dot warning"></span>
              <span class="status-label">住院宠物</span>
              <span class="status-val">8</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

// Register ECharts modules
use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const userStore = useUserStore()
const userName = computed(() => userStore.name || '管理员')

const stats = ref([
  { title: '今日就诊', value: '42', icon: 'Calendar', grad: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { title: '新增预约', value: '15', icon: 'Timer', grad: 'linear-gradient(135deg, #32D74B 0%, #17AD37 100%)' },
  { title: '累计宠物', value: '1,284', icon: 'Service', grad: 'linear-gradient(135deg, #FF9F0A 0%, #E68A00 100%)' },
  { title: '药品警告', value: '3', icon: 'Warning', grad: 'linear-gradient(135deg, #FF3B30 0%, #D70A1E 100%)' }
])

const quickLinks = [
  { title: '门诊建档', icon: 'FolderAdd', action: 'create', color: '#5E5CE6' },
  { title: '查看预约', icon: 'List', action: 'view', color: '#32D74B' },
  { title: '药品出库', icon: 'Goods', action: 'stock', color: '#FF9F0A' },
  { title: '发布公告', icon: 'Notification', action: 'notify', color: '#FF3B30' },
  { title: '系统配置', icon: 'Setting', action: 'config', color: '#64D2FF' },
  { title: '病历管理', icon: 'Document', action: 'emr', color: '#AF52DE' }
]

const handleQuickAction = (action) => {
  console.log('Action:', action)
}

// Chart Logic
const chartOption = ref({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#eee',
    borderWidth: 1,
    textStyle: { color: '#333' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    axisLine: { lineStyle: { color: '#E5E5EA' } },
    axisLabel: { color: '#8E8E93' }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { type: 'dashed', color: '#F2F2F7' } },
    axisLabel: { color: '#8E8E93' }
  },
  series: [
    {
      name: '就诊量',
      type: 'line',
      smooth: true,
      data: [45, 78, 52, 91, 64, 110, 85],
      lineStyle: { width: 4, color: '#5E5CE6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(94, 92, 230, 0.3)' },
            { offset: 1, color: 'rgba(94, 92, 230, 0)' }
          ]
        }
      },
      itemStyle: { color: '#5E5CE6', borderWidth: 2 }
    }
  ]
})
</script>

<style scoped>
.welcome-title {
  font-size: 28px;
  margin: 0 0 8px;
  background: var(--grad-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  color: var(--text-secondary);
  font-size: 16px;
}

.stat-inner {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: #fff;
}

.stat-icon-wrapper {
  font-size: 32px;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  backdrop-filter: blur(4px);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-val {
  font-size: 26px;
  font-weight: 700;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.chart-container {
  height: 350px;
}

.chart-comp {
  height: 100%;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.quick-item {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 12px 0;
  border-radius: 8px;
}

.quick-item:hover {
  transform: translateY(-4px);
  background: var(--bg-main);
}

.quick-icon-box {
  font-size: 24px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
}

.quick-label {
  font-size: 12px;
  color: var(--text-main);
}

.hospital-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.success { background: var(--success); }
.status-dot.warning { background: var(--warning); }

.status-label {
  color: var(--text-secondary);
  flex: 1;
}

.status-val {
  font-weight: 600;
  color: var(--text-main);
}
</style>

