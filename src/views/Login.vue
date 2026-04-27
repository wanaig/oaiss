<script setup>
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../store'
import { ROLE, ROLE_LABEL, ROLE_HOME } from '../config/menu'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const form = reactive({
  username: '',
  role: ROLE.ENTERPRISE,
})

const roleOptions = [
  { label: ROLE_LABEL[ROLE.ENTERPRISE], value: ROLE.ENTERPRISE },
  { label: ROLE_LABEL[ROLE.AUDITOR], value: ROLE.AUDITOR },
  { label: ROLE_LABEL[ROLE.ADMIN], value: ROLE.ADMIN },
]

const onSubmit = () => {
  appStore.login({
    username: form.username || '系统用户',
    role: form.role,
  })

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  const target = redirect || ROLE_HOME[form.role]

  ElMessage.success('登录成功')
  router.replace(target)
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg-layer" />

    <el-card class="login-card" shadow="never">
      <div class="login-header">
        <div class="logo-dot" />
        <div>
          <h1>碳资产监管后台</h1>
          <p>请选择角色进入系统框架</p>
        </div>
      </div>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="用户名（占位）">
          <el-input v-model="form.username" placeholder="例如：张三" clearable />
        </el-form-item>

        <el-form-item label="登录角色">
          <el-radio-group v-model="form.role" class="role-group">
            <el-radio-button v-for="item in roleOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-button class="submit-btn" type="primary" size="large" @click="onSubmit">
          进入后台
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

.login-bg-layer {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 22%, rgba(20, 167, 154, 0.3), transparent 42%),
    radial-gradient(circle at 82% 78%, rgba(69, 190, 117, 0.28), transparent 40%),
    linear-gradient(180deg, #163237 0%, #1f4a4d 100%);
}

.login-card {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 250, 249, 0.96));
  box-shadow: 0 24px 50px rgba(9, 34, 37, 0.24);
  position: relative;
  z-index: 2;
}

.login-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.logo-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(130deg, #23baa8, #6adf85);
  box-shadow: 0 0 0 6px rgba(35, 186, 168, 0.12);
}

.login-header h1 {
  margin: 0;
  font-size: 24px;
  color: #1a2c30;
}

.login-header p {
  margin: 8px 0 0;
  color: #607579;
  font-size: 14px;
}

.role-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.role-group :deep(.el-radio-button__inner) {
  width: 100%;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
  border: none;
  background: linear-gradient(120deg, #18a99a 0%, #42c977 100%);
}

@media (max-width: 600px) {
  .login-card {
    max-width: 100%;
  }

  .role-group {
    grid-template-columns: 1fr;
  }
}
</style>
