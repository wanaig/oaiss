<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Expand, Fold, Bell, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { useAppStore } from '../store'
import { MENU_BY_ROLE, ROLE_LABEL } from '../config/menu'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const menuTree = computed(() => MENU_BY_ROLE[appStore.role] || [])

const activeMenu = computed(() => route.path)

const defaultOpeneds = computed(() => {
  const openList = []
  menuTree.value.forEach((group) => {
    group.children.forEach((secondLevel) => {
      if (secondLevel.children.some((leaf) => leaf.path === route.path)) {
        openList.push(group.label, `${group.label}-${secondLevel.label}`)
      }
    })
  })
  return openList
})

const onSelectMenu = (index) => {
  if (index && index.startsWith('/') && index !== route.path) {
    router.push(index)
  }
}

onMounted(() => {
  if (appStore.token && !appStore._validated) {
    appStore._validated = true
    appStore.fetchCurrentUser()
  }
})

const onLogout = () => {
  appStore.logout()
  ElMessage.success('已退出登录')
  router.replace('/login')
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside class="sidenav" :width="appStore.sidebarCollapsed ? '64px' : '240px'">
      <div class="sidenav-brand">
        <div class="brand-icon">C</div>
        <span v-show="!appStore.sidebarCollapsed" class="brand-text">碳链监管</span>
      </div>

      <el-scrollbar class="sidenav-scroll">
        <el-menu
          :default-active="activeMenu"
          :default-openeds="defaultOpeneds"
          :collapse="appStore.sidebarCollapsed"
          :collapse-transition="false"
          unique-opened
          @select="onSelectMenu"
        >
          <template v-for="group in menuTree" :key="group.label">
            <el-sub-menu :index="group.label">
              <template #title>
                <span>{{ group.label }}</span>
              </template>
              <el-sub-menu v-for="l2 in group.children" :key="`${group.label}-${l2.label}`" :index="`${group.label}-${l2.label}`">
                <template #title><span>{{ l2.label }}</span></template>
                <el-menu-item v-for="leaf in l2.children" :key="leaf.path" :index="leaf.path">{{ leaf.label }}</el-menu-item>
              </el-sub-menu>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <div class="topbar-left">
          <el-button class="collapse-btn" text @click="appStore.toggleSidebar">
            <el-icon :size="20"><Fold v-if="!appStore.sidebarCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          <div class="page-title">{{ route.meta?.title || '' }}</div>
        </div>

        <div class="topbar-right">
          <el-button class="notif-btn" text circle>
            <el-icon :size="18"><Bell /></el-icon>
          </el-button>
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar"><el-icon><UserFilled /></el-icon></el-avatar>
              <div class="user-meta" v-if="!appStore.sidebarCollapsed">
                <div class="user-name">{{ appStore.username }}</div>
                <div class="user-role-badge">{{ ROLE_LABEL[appStore.role] || appStore.roleLabel }}</div>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="onLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-shell { height: 100%; }

/* ── Sidebar ── */
.sidenav {
  background: var(--saas-sidebar);
  color: #fff;
  transition: width 0.25s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidenav-brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.brand-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4361ee, #2ec4b6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  flex-shrink: 0;
}
.brand-text { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; }
.sidenav-scroll { flex: 1; }
.sidenav-scroll :deep(.el-menu) { border: none; background: transparent; }
.sidenav-scroll :deep(.el-sub-menu__title),
.sidenav-scroll :deep(.el-menu-item) {
  color: rgba(255,255,255,0.65);
  height: 42px;
  line-height: 42px;
}
.sidenav-scroll :deep(.el-sub-menu__title:hover),
.sidenav-scroll :deep(.el-menu-item:hover) { background: rgba(255,255,255,0.06); color: #fff; }
.sidenav-scroll :deep(.el-menu-item.is-active) {
  color: #fff;
  background: rgba(67, 97, 238, 0.35);
  position: relative;
}
.sidenav-scroll :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0; top: 8px; bottom: 8px;
  width: 3px;
  background: var(--saas-primary);
  border-radius: 0 2px 2px 0;
}
.sidenav-scroll :deep(.el-sub-menu .el-menu) { background: rgba(0,0,0,0.15); }

/* ── Topbar ── */
.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--saas-header);
  border-bottom: 1px solid var(--saas-border);
}
.topbar-left { display: flex; align-items: center; gap: 12px; }
.page-title { font-size: 17px; font-weight: 600; color: var(--saas-text); }
.collapse-btn { color: var(--saas-text-secondary); }
.collapse-btn:hover { color: var(--saas-text); }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.notif-btn { color: var(--saas-text-secondary); }
.notif-btn:hover { color: var(--saas-text); }
.user-info { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.user-avatar { background: linear-gradient(135deg, #4361ee, #2ec4b6); }
.user-meta { line-height: 1.3; }
.user-name { font-size: 13px; font-weight: 600; color: var(--saas-text); }
.user-role-badge { font-size: 11px; color: var(--saas-text-light); }
.main-content { min-height: calc(100vh - 64px); background: var(--saas-bg); }

@media (max-width: 992px) {
  .sidenav { width: 64px !important; }
  .brand-text { display: none; }
}
</style>
