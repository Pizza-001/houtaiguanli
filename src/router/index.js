import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/user'
import { usePermissionStore } from '@/store/permission'

const Layout = () => import('@/layout/index.vue')

const routes = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        name: 'Dashboard',
        meta: { title: '控制台', icon: 'DataBoard', affix: true }
      }
    ]
  },
  {
    path: '/hospital',
    component: Layout,
    children: [
      {
        path: 'chat',
        component: () => import('@/views/hospital/chat/index.vue'),
        name: 'HumanChat',
        meta: { title: '人工服务', icon: 'ChatLineRound' }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/error/404.vue'),
    hidden: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const hasToken = getToken()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      if (userStore.roles.length === 0) {
        try {
          // Get user info first
          await userStore.getInfo()
          // Then generate routes if not loaded
          if (!permissionStore.isLoaded) {
            const accessRoutes = await permissionStore.generateRoutes()
            accessRoutes.forEach(route => {
              router.addRoute(route)
            })
            next({ path: to.path, query: to.query, hash: to.hash, replace: true })
          } else {
            next()
          }
        } catch (err) {
          userStore.logout()
          next(`/login?redirect=${to.path}`)
        }
      } else {
        if (!permissionStore.isLoaded) {
           const accessRoutes = await permissionStore.generateRoutes()
           accessRoutes.forEach(route => {
             router.addRoute(route)
           })
           next({ path: to.path, query: to.query, hash: to.hash, replace: true })
        } else {
          next()
        }
      }
    }
  } else {
    if (to.path === '/login') {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router
