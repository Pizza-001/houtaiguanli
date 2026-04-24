import { defineStore } from 'pinia'
import request from '@/utils/request'

// Use a function to load Layout to break circular dependencies
// Layout -> Sidebar -> SidebarItem -> permission.js -> Layout
const Layout = () => import('@/layout/index.vue')

// Dynamic component loading for views
const modules = import.meta.glob('@/views/**/*.vue')

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [],
    addRoutes: [],
    isLoaded: false
  }),
  actions: {
    setRoutes(routes) {
      this.addRoutes = routes
      this.routes = routes
      this.isLoaded = true
    },
    async generateRoutes() {
      const res = await request({
        url: '/getRouters',
        method: 'get'
      })
      const sdata = JSON.parse(JSON.stringify(res.data))
      const rdata = JSON.parse(JSON.stringify(res.data))
      const sidebarRoutes = filterAsyncRouter(sdata)
      const rewriteRoutes = filterAsyncRouter(rdata, false, true)
      
      rewriteRoutes.push({ path: '/:pathMatch(.*)*', redirect: '/404', hidden: true })
      
      this.setRoutes(sidebarRoutes)
      return rewriteRoutes
    }
  }
})

const subTitleMapping = {
  '系统管理': 'System Management',
  '用户管理': 'User Center',
  '角色管理': 'Role Control',
  '菜单管理': 'Menu Design',
  '部门管理': 'Department',
  '岗位管理': 'Position',
  '字典管理': 'Dictionary',
  '参数设置': 'Configuration',
  '通知公告': 'Notification',
  '日志管理': 'Audit Logs',
  '医院管理': 'Hospital Center',
  '医生管理': 'Elite Medical Coordination',
  '疫苗管理': 'Vaccine Plan',
  '知识库': 'Knowledge Base',
  '预约管理': 'Booking Center',
  '轮播图': 'Banner Setup',
  '控制台': 'Dashboard Overview',
  '收银结算': 'Integrated Billing & Settlement'
}

// Iterate through the backend data and convert to vue-router format
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    
    // Inject subTitle metadata
    if (route.meta && route.meta.title) {
      route.meta.subTitle = subTitleMapping[route.meta.title] || ''
    }

    if (route.component) {
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = () => import('@/layout/index.vue') // Or a dedicated ParentView if it exists
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap, lastRouter = false) {
  var res = []
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length > 0) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach(c => {
          c.path = el.path + '/' + c.path
          if (c.children && c.children.length > 0) {
            res.push(...filterChildren(c.children, c))
            return
          }
          res.push(c)
        })
        return
      }
    }
    res.push(el)
  })
  return res
}

export const loadView = (view) => {
  let res;
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0];
    if (dir === view) {
      res = modules[path];
      break;
    }
  }
  return res || (() => import('@/views/dashboard/index.vue'))
}

// Icon helper
export function getIcon(icon) {
  if (!icon || icon === '#') return null
  
  const mapping = {
    'system': 'Setting',
    'user': 'User',
    'chart': 'PieChart',
    'peoples': 'Avatar',
    'tree': 'Share',
    'component': 'Menu',
    'dashboard': 'DataLine',
    'doctor': 'Umbrella',
    'hospital': 'FirstAidKit',
    'banner': 'Picture',
    'vaccine': 'MedicineBox',
    'knowledge': 'Notebook',
    'billing': 'Wallet'
}
  
  if (mapping[icon]) return mapping[icon]
  return icon.charAt(0).toUpperCase() + icon.slice(1)
}
