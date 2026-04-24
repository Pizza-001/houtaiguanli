<template>
  <div class="clinical-placeholder">
    <div class="module-card">
      <div class="header-accent"></div>
      <div class="content">
        <el-icon class="preview-icon"><component :is="icon" /></el-icon>
        <h1 class="title">{{ title }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
        <div class="status-badge">
          <el-icon><Timer /></el-icon> 正在与医院系统深度集成中...
        </div>
        <div class="divider"></div>
        <el-row :gutter="20" class="sub-features">
          <el-col :span="8" v-for="feature in features" :key="feature">
            <div class="feature-item">
              <el-icon><CircleCheckFilled /></el-icon>
              {{ feature }}
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: String,
  subtitle: String,
  icon: String,
  features: Array
})
</script>

<style scoped>
.clinical-placeholder {
  padding: 40px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.module-card {
  background: #ffffff;
  width: 100%;
  max-width: 800px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}

.header-accent {
  height: 6px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
}

.content {
  padding: 60px 40px;
  text-align: center;
}

.preview-icon {
  font-size: 80px;
  color: #3b82f6;
  margin-bottom: 24px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 32px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 40px;
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0 auto 32px;
  width: 100px;
}

.sub-features {
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #475569;
  margin-bottom: 12px;
}

.feature-item .el-icon {
  color: #10b981;
}
</style>
