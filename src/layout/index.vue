<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Expand, Fold, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../store'
import { MENU_BY_ROLE } from '../config/menu'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const menuTree = computed(() => MENU_BY_ROLE[appStore.role] || [])

const activeMenu = computed(() => route.path)

const defaultOpeneds = computed(() => {
  const openList = []

  menuTree.value.forEach((group) => {
    group.children.forEach((secondLevel) => {
      const matchCurrent = secondLevel.children.some((leaf) => leaf.path === route.path)

      if (matchCurrent) {
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

const onLogout = () => {
  appStore.logout()
  ElMessage.success('已退出登录')
  router.replace('/login')
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside class="side-panel" :width="appStore.sidebarCollapsed ? '70px' : '260px'">
      <div class="brand-area">
        <div class="logo-dot" />
        <span v-show="!appStore.sidebarCollapsed" class="brand-title">碳监管中台</span>
      </div>

      <el-scrollbar class="menu-scrollbar">
        <el-menu
          class="side-menu"
          :default-active="activeMenu"
          :default-openeds="defaultOpeneds"
          :collapse="appStore.sidebarCollapsed"
          :collapse-transition="false"
          unique-opened
          @select="onSelectMenu"
        >
          <el-sub-menu v-for="group in menuTree" :key="group.label" :index="group.label">
            <template #title>
              <span>{{ group.label }}</span>
            </template>

            <el-sub-menu
              v-for="secondLevel in group.children"
              :key="`${group.label}-${secondLevel.label}`"
              :index="`${group.label}-${secondLevel.label}`"
            >
              <template #title>
                <span>{{ secondLevel.label }}</span>
              </template>

              <el-menu-item v-for="leaf in secondLevel.children" :key="leaf.path" :index="leaf.path">
                {{ leaf.label }}
              </el-menu-item>
            </el-sub-menu>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="top-header">
        <div class="header-left">
          <el-button class="collapse-btn" circle plain @click="appStore.toggleSidebar">
            <el-icon>
              <Fold v-if="!appStore.sidebarCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>

          <div class="system-meta">
            <div class="system-title">{{ appStore.systemTitle }}</div>
            <div class="system-subtitle">环保与低碳监管系统框架</div>
          </div>
        </div>

        <div class="header-right">
          <el-tag class="status-tag" effect="dark">监管模式</el-tag>
          <el-avatar :size="36" class="avatar-icon">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <div class="user-block">
            <div class="user-name">{{ appStore.username || '系统用户' }}</div>
            <div class="user-role">{{ appStore.roleLabel }}</div>
          </div>
          <el-button class="logout-btn" text @click="onLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-shell {
  height: 100%;
}

.side-panel {
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, #0d3236 0%, #125850 62%, #198369 100%);
}

.brand-area {
  height: 66px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  color: #eef7f6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(130deg, #34d5bf, #90f0b1);
  box-shadow: 0 0 0 6px rgba(73, 193, 153, 0.15);
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.6px;
}

.menu-scrollbar {
  height: calc(100vh - 66px);
}

.side-menu {
  border-right: none;
  background: transparent;
}

.side-menu :deep(.el-menu) {
  background: transparent;
  border-right: none;
}

.side-menu :deep(.el-sub-menu__title),
.side-menu :deep(.el-menu-item) {
  color: rgba(235, 248, 247, 0.87);
}

.side-menu :deep(.el-sub-menu__title:hover),
.side-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
}

.side-menu :deep(.el-menu-item.is-active) {
  color: #ffffff;
  background: rgba(38, 204, 162, 0.34);
}

.top-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: linear-gradient(90deg, #17363a 0%, #1e4d49 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.collapse-btn {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #ecf7f4;
}

.collapse-btn:hover {
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.14);
  color: #ecf7f4;
}

.system-meta {
  color: #f0fbf6;
}

.system-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.system-subtitle {
  font-size: 12px;
  opacity: 0.78;
  margin-top: 3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout-btn {
  color: #e8faf2;
  padding: 0 6px;
}

.logout-btn:hover {
  color: #ffffff;
}

.status-tag {
  background: linear-gradient(120deg, #18a99a, #42c977);
  border: none;
  color: #ffffff;
}

.avatar-icon {
  color: #1f4748;
  background: linear-gradient(120deg, #d8fbef 0%, #e8f4fb 100%);
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: #f0fbf6;
}

.user-role {
  font-size: 12px;
  color: rgba(240, 251, 246, 0.75);
  margin-top: 2px;
}

.main-content {
  min-height: calc(100vh - 70px);
}

@media (max-width: 992px) {
  .top-header {
    height: 78px;
    padding: 10px 14px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .system-title {
    font-size: 16px;
  }

  .system-subtitle {
    display: none;
  }

  .user-role {
    display: none;
  }

  .main-content {
    min-height: calc(100vh - 78px);
  }
}
</style>
