<template>
  <div class="navbar">
    <div class="left-menu">
      <el-icon class="hamburger" @click="handleToggle"><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="right-menu">
      <div class="right-actions">
        <el-tooltip content="搜索菜单" placement="bottom">
          <div class="action-item"><el-icon><Search /></el-icon></div>
        </el-tooltip>
        <el-tooltip content="系统公告" placement="bottom">
          <div class="action-item"><el-icon><Bell /></el-icon></div>
        </el-tooltip>
      </div>

      <el-dropdown trigger="click">
        <div class="avatar-container">
          <el-avatar :size="32" :src="userStore.avatar || defaultAvatar" />
          <span class="user-name">{{ userStore.name || '管理员' }}</span>
          <el-icon><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

const handleToggle = () => {
  isCollapse.value = !isCollapse.value
  // Usually this emits to parent layout
}

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
  })
}
</script>

<style scoped>
.navbar {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
}

.left-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hamburger {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.3s;
}

.hamburger:hover {
  color: var(--primary);
}

.right-menu {
  display: flex;
  align-items: center;
  gap: 20px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  border-right: 1px solid var(--border-color);
  padding-right: 20px;
}

.action-item {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.3s;
}

.action-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--primary);
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  transition: background 0.3s;
}

.avatar-container:hover {
  background: rgba(255, 255, 255, 0.05);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}
</style>
