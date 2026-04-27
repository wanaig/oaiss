import { createRouter, createWebHistory } from 'vue-router'
import { pinia, useAppStore } from '../store'
import { ROLE } from '../config/menu'

const routes = [
  {
    path: '/',
    redirect: '/official-home',
  },
  {
    path: '/official-home',
    name: 'OfficialHome',
    component: () => import('../views/OfficialHome.vue'),
    meta: { public: true, keepWhenLoggedIn: true, title: '官方网站首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    children: [
      {
        path: 'enterprise/carbon/upload',
        name: 'EnterpriseCarbonUpload',
        component: () => import('../views/enterprise/CarbonUpload.vue'),
        meta: { title: '上传审核', roles: [ROLE.ENTERPRISE] },
      },
      {
        path: 'enterprise/p2p/orders',
        name: 'EnterpriseP2POrders',
        component: () => import('../views/enterprise/P2POrders.vue'),
        meta: { title: 'P2P订单管理', roles: [ROLE.ENTERPRISE] },
      },
      {
        path: 'enterprise/trading/market',
        name: 'EnterpriseTradingMarket',
        component: () => import('../views/enterprise/TradingMarket.vue'),
        meta: { title: '双向拍卖', roles: [ROLE.ENTERPRISE] },
      },
      {
        path: 'enterprise/company/dashboard',
        name: 'EnterpriseCompanyDashboard',
        component: () => import('../views/enterprise/CompanyDashboard.vue'),
        meta: { title: '数据可视化', roles: [ROLE.ENTERPRISE] },
      },
      {
        path: 'enterprise/account/center',
        name: 'EnterpriseAccountCenter',
        component: () => import('../views/enterprise/AccountCenter.vue'),
        meta: { title: '我的账户', roles: [ROLE.ENTERPRISE] },
      },
      {
        path: 'auditor/audit/list',
        name: 'AuditorAuditList',
        component: () => import('../views/auditor/AuditList.vue'),
        meta: { title: '审核列表', roles: [ROLE.AUDITOR] },
      },
      {
        path: 'auditor/audit/detail/:reportId',
        name: 'AuditorAuditDetail',
        component: () => import('../views/auditor/AuditDetail.vue'),
        meta: { title: '审核详情', roles: [ROLE.AUDITOR] },
      },
      {
        path: 'admin/system/users',
        name: 'AdminSystemUsers',
        component: () => import('../views/admin/SystemUsers.vue'),
        meta: { title: '用户管理', roles: [ROLE.ADMIN] },
      },
      {
        path: 'admin/system/carbon',
        name: 'AdminSystemCarbon',
        component: () => import('../views/admin/SystemCarbon.vue'),
        meta: { title: '碳核算管理', roles: [ROLE.ADMIN] },
      },
      {
        path: 'admin/system/config',
        name: 'AdminSystemConfig',
        component: () => import('../views/admin/SystemConfig.vue'),
        meta: { title: '系统配置', roles: [ROLE.ADMIN] },
      },
      {
        path: 'admin/data/statistics',
        name: 'AdminDataStatistics',
        component: () => import('../views/admin/DataStatistics.vue'),
        meta: { title: '统计数据', roles: [ROLE.ADMIN] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const appStore = useAppStore(pinia)

  if (to.meta.public && appStore.loggedIn && !to.meta.keepWhenLoggedIn) {
    return appStore.homePath
  }

  if (to.meta.public) {
    return true
  }

  if (!appStore.loggedIn) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
    const hasRole = to.meta.roles.includes(appStore.role)
    if (!hasRole) {
      return appStore.homePath
    }
  }

  return true
})

export default router
