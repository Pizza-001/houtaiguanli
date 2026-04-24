<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu-custom"
    :collapse="isCollapse"
    unique-opened
    router
  >
    <sidebar-item v-for="route in menuRoutes" :key="route.path" :item="route" />
  </el-menu>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import { usePermissionStore } from '@/store/permission'

const route = useRoute()
const permissionStore = usePermissionStore()
const isCollapse = ref(false)

const menuRoutes = computed(() => permissionStore.routes)

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})
</script>

<style scoped>
.sidebar-menu-custom {
  height: 100%;
  border-right: none !important;
  background-color: transparent !important;
}

:deep(.el-menu) {
  border-right: none !important;
  background-color: transparent !important;
}
</style>
