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
      
      // 1. 克隆原始数据
      const sdata = JSON.parse(JSON.stringify(res.data))
      const rdata = JSON.parse(JSON.stringify(res.data))
      
      // 2. 执行菜单重组
      const sidebarSource = this.reorganize(sdata)
      const rewriteSource = this.reorganize(rdata)
      
      // 3. 执行路由解析和组件加载
      const sidebarRoutes = filterAsyncRouter(sidebarSource)
      const rewriteRoutes = filterAsyncRouter(rewriteSource, false, true)
      
      rewriteRoutes.push({ path: '/:pathMatch(.*)*', redirect: '/404', hidden: true })
      
      this.setRoutes(sidebarRoutes)
      return rewriteRoutes
    },
    reorganize(routes) {
      const titlesToRemove = ['菜单管理', '参数设置', '字典管理', '部门管理', '岗位管理', '代码生成', '通知公告', '日志管理', '配置管理']
      let systemUser = null
      let systemRole = null
      let hospitalMenu = null

      // 第一步：先递归找人，确保不管嵌套在哪都能找到
      const findTargets = (list) => {
        for (const item of list) {
          const title = item.meta?.title
          if (title === '用户管理') systemUser = JSON.parse(JSON.stringify(item))
          if (title === '角色管理') systemRole = JSON.parse(JSON.stringify(item))
          if (title === '宠物医院管理' || title === '医院管理') hospitalMenu = item
          if (item.children) findTargets(item.children)
        }
      }
      findTargets(routes)

      // 第二步：递归清理不需要的菜单和旧的父级
      const cleanRoutes = (list) => {
        for (let i = list.length - 1; i >= 0; i--) {
          const item = list[i]
          const title = item.meta?.title
          if (titlesToRemove.includes(title) || title === '系统管理') {
            list.splice(i, 1)
            continue
          }
          if (item.children) cleanRoutes(item.children)
        }
      }
      cleanRoutes(routes)

      // 第三步：将备份好的菜单精准插入“宠物医院管理”
      if (hospitalMenu) {
        if (!hospitalMenu.children) hospitalMenu.children = []
        
        // 1. 注入用户和角色
        if (systemUser) hospitalMenu.children.push(systemUser)
        if (systemRole) hospitalMenu.children.push(systemRole)
        
        // 2. 注入新创建的优惠券管理 (确保路径与物理文件匹配)
        hospitalMenu.children.push({
          name: 'Coupon',
          path: 'coupon',
          hidden: false,
          component: 'hospital/coupon/index',
          meta: { title: '优惠券管理', icon: 'Ticket', noCache: false, link: null }
        })
      }

      return routes
    }
  }
})

// Advanced Metadata Configuration for Sidebar
const MENU_METADATA = {
  '控制台': { icon: 'Odometer', sub: 'Dashboard Overview' },
  '系统管理': { icon: 'Setting', sub: 'System Governance' },
  '用户管理': { icon: 'User', sub: 'Identity & Access' },
  '角色管理': { icon: 'Key', sub: 'Role Control' },
  '菜单管理': { icon: 'Grid', sub: 'Menu Architecture' },
  '部门管理': { icon: 'Connection', sub: 'Department Org' },
  '岗位管理': { icon: 'Suitcase', sub: 'Career Paths' },
  '字典管理': { icon: 'Reading', sub: 'Dictionary Master' },
  '参数设置': { icon: 'SetUp', sub: 'Config Center' },
  '配置管理': { icon: 'SetUp', sub: 'Config Center' },
  '通知公告': { icon: 'Bell', sub: 'Broadcasting' },
  '日志管理': { icon: 'Document', sub: 'Audit Intelligence' },
  '医院管理': { icon: 'OfficeBuilding', sub: 'Medical Center' },
  '宠物医院管理': { icon: 'OfficeBuilding', sub: 'Pet Hospital Mgt' },
  '医生管理': { icon: 'UserFilled', sub: 'Elite Medical Team' },
  '疫苗管理': { icon: 'FirstAidKit', sub: 'Immunization Plan' },
  '知识库': { icon: 'Notebook', sub: 'Clinical Knowledge' },
  '养宠知识管理': { icon: 'Notebook', sub: 'Knowledge Base' },
  '预约管理': { icon: 'Timer', sub: 'Booking Engine' },
  '轮播图': { icon: 'Monitor', sub: 'Media Control' },
  '轮播图管理': { icon: 'Monitor', sub: 'Media Control' },
  '收银结算': { icon: 'Money', sub: 'Financial Terminal' },
  '会员管理': { icon: 'Trophy', sub: 'VIP Ecosystem' },
  '宠物管理': { icon: 'Guide', sub: 'Pet Archives' },
  '宠物档案与CRM': { icon: 'Guide', sub: 'Pet CRM' },
  '优惠券管理': { icon: 'Ticket', sub: 'Coupon Marketing' },
  '药房管理': { icon: 'FirstAidKit', sub: 'Pharmacy Hub' },
  '病历管理': { icon: 'DocumentCopy', sub: 'Medical Records' },
  '电子病历(SOAP)': { icon: 'Reading', sub: 'EMR & SOAP' },
  '化验与影像(PACS)': { icon: 'Camera', sub: 'Lab & Imaging' },
  '住院与手术': { icon: 'HomeFilled', sub: 'Inpatient & Surgery' },
  '预约登记': { icon: 'EditPen', sub: 'Registration' }
}

const FALLBACK_ICON_MAP = {
  'system': 'Setting', 'user': 'User', 'chart': 'Odometer', 
  'peoples': 'UserFilled', 'tree': 'Connection', 'component': 'Grid', 
  'dashboard': 'Odometer', 'doctor': 'UserFilled', 'hospital': 'OfficeBuilding', 
  'banner': 'Monitor', 'vaccine': 'FirstAidKit', 'knowledge': 'Notebook', 
  'billing': 'Money', 'pet': 'Guide', 'post': 'Suitcase', 'role': 'Key', 
  'menu': 'Grid', 'dept': 'Connection', 'dict': 'Reading', 'config': 'SetUp', 
  'notice': 'Bell', 'log': 'Document', 'member': 'Trophy'
}

function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    
    if (route.meta && route.meta.title) {
      const config = MENU_METADATA[route.meta.title]
      if (config) {
        route.meta.subTitle = config.sub || ''
        route.meta.icon = config.icon
      } else {
        if (route.meta.icon && FALLBACK_ICON_MAP[route.meta.icon]) {
          route.meta.icon = FALLBACK_ICON_MAP[route.meta.icon]
        } else if (!route.meta.icon || route.meta.icon === '#') {
          route.meta.icon = 'Menu'
        } else {
          route.meta.icon = route.meta.icon.split('-').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join('')
        }
      }
    }

    if (route.component) {
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = () => import('@/layout/index.vue')
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
