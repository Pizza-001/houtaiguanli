<template>
  <div v-if="!item.hidden">
    <!-- Single menu item -->
    <el-menu-item v-if="theOnlyOneChild" :index="resolvePath(theOnlyOneChild.path)">
      <el-icon v-if="theOnlyOneChild.meta?.icon || item.meta?.icon">
        <component :is="theOnlyOneChild.meta?.icon || item.meta?.icon" />
      </el-icon>
      <template #title>
        <div class="menu-item-content">
          <span class="menu-text">{{ theOnlyOneChild.meta?.title || item.meta?.title || item.name }}</span>
          <span v-if="(theOnlyOneChild.meta && theOnlyOneChild.meta.subTitle) || (item.meta && item.meta.subTitle)" class="menu-sub-text">
            {{ theOnlyOneChild.meta?.subTitle || item.meta?.subTitle }}
          </span>
        </div>
      </template>
    </el-menu-item>

    <!-- Submenu -->
    <el-sub-menu v-else :index="resolvePath(item.path)">
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <div class="menu-item-content">
          <span class="menu-text">{{ item.meta ? item.meta.title : item.name }}</span>
          <span v-if="item.meta && item.meta.subTitle" class="menu-sub-text">
            {{ item.meta.subTitle }}
          </span>
        </div>
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(item.path)"
      />
    </el-sub-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  basePath: {
    type: String,
    default: ''
  }
})

const theOnlyOneChild = computed(() => {
  if (!props.item.children) return props.item
  const visibleChildren = props.item.children.filter(item => !item.hidden)
  
  // If no children, return the item itself
  if (visibleChildren.length === 0) {
    return { ...props.item, noShowingChildren: true }
  }

  // If only one child, return that child but prefix with parent path to ensure resolvePath works from root
  if (visibleChildren.length === 1 && !props.item.alwaysShow) {
    const child = visibleChildren[0]
    // If the child path is already absolute, don't prefix
    if (child.path.startsWith('/')) return child
    return { ...child, path: props.item.path + '/' + child.path }
  }
  
  return null
})

const resolvePath = (childPath) => {
  if (childPath && childPath.startsWith('http')) return childPath
  if (props.basePath && props.basePath.startsWith('http')) return props.basePath
  
  let path = props.basePath || ''
  if (childPath) {
    if (path.endsWith('/')) {
      path += childPath
    } else {
      path += '/' + childPath
    }
  }
  return path.replace(/\/+/g, '/')
}

</script>

<style scoped>
.menu-item-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.1;
  margin-left: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--text-main);
  transition: color 0.3s ease;
}

.menu-sub-text {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-top: 4px;
}

:deep(.el-menu-item), :deep(.el-sub-menu__title) {
  display: flex !important;
  align-items: center !important;
}

:deep(.el-menu-item) {
  height: 50px !important;
  margin: 6px 16px !important;
  border-radius: var(--radius-md) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  color: var(--text-main) !important;
}

:deep(.el-menu-item.is-active) {
  background: var(--primary-light) !important;
  color: var(--primary) !important;
  box-shadow: 0 4px 12px rgba(94, 92, 230, 0.1);
  font-weight: 700 !important;
}

:deep(.el-menu-item.is-active .menu-text) {
  color: var(--primary) !important;
}

:deep(.el-menu-item:hover) {
  background: var(--primary-light) !important;
  color: var(--primary) !important;
}

:deep(.el-sub-menu__title) {
  height: 50px !important;
  margin: 6px 16px !important;
  border-radius: var(--radius-md) !important;
  color: var(--text-main) !important;
}

:deep(.el-sub-menu__title:hover) {
  background: var(--primary-light) !important;
  color: var(--primary) !important;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 20px !important;
  width: 24px !important;
  height: 24px !important;
  margin-right: 12px !important;
  flex-shrink: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.el-menu-item.is-active .el-icon),
:deep(.el-menu-item:hover .el-icon),
:deep(.el-sub-menu__title:hover .el-icon) {
  color: var(--primary) !important;
}
</style>
