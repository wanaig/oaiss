<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../store'
import { ROLE, ROLE_HOME } from '../config/menu'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const LOGIN_FORM_STORAGE_KEY = 'carbon-admin-login-form'

const formRef = ref()

const form = reactive({
  account: '',
  password: '',
  captchaInput: '',
  rememberPassword: true,
})

const captchaCode = ref('')

const formRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaInput: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const inferRoleByAccount = (account) => {
  const lower = account.toLowerCase()
  if (lower.startsWith('admin')) {
    return ROLE.ADMIN
  }
  if (lower.startsWith('auditor')) {
    return ROLE.AUDITOR
  }
  return ROLE.ENTERPRISE
}

const randomCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let text = ''
  for (let i = 0; i < 4; i += 1) {
    text += chars[Math.floor(Math.random() * chars.length)]
  }
  return text
}

const refreshCaptcha = () => {
  captchaCode.value = randomCaptcha()
}

const captchaImage = computed(() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='40'>
<defs>
<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0%' stop-color='#e7f8f6'/>
<stop offset='100%' stop-color='#d6efe8'/>
</linearGradient>
</defs>
<rect width='110' height='40' rx='8' ry='8' fill='url(#g)'/>
<text x='55' y='27' text-anchor='middle' font-size='22' font-weight='700' fill='#1d5d56' letter-spacing='4'>${captchaCode.value}</text>
<line x1='8' y1='31' x2='102' y2='10' stroke='#67b7a9' stroke-width='1.2'/>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
})

const persistLoginForm = () => {
  if (!form.rememberPassword) {
    localStorage.removeItem(LOGIN_FORM_STORAGE_KEY)
    return
  }

  localStorage.setItem(
    LOGIN_FORM_STORAGE_KEY,
    JSON.stringify({
      account: form.account,
      password: form.password,
      rememberPassword: form.rememberPassword,
    }),
  )
}

onMounted(() => {
  refreshCaptcha()

  try {
    const raw = localStorage.getItem(LOGIN_FORM_STORAGE_KEY)
    if (!raw) {
      return
    }

    const parsed = JSON.parse(raw)
    form.account = parsed.account || ''
    form.password = parsed.password || ''
    form.rememberPassword = Boolean(parsed.rememberPassword)
  } catch {
    localStorage.removeItem(LOGIN_FORM_STORAGE_KEY)
  }
})

const onSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完整填写登录信息')
    return
  }

  if (form.captchaInput.trim().toUpperCase() !== captchaCode.value) {
    ElMessage.error('验证码错误，请重试')
    refreshCaptcha()
    form.captchaInput = ''
    return
  }

  const role = inferRoleByAccount(form.account)
  appStore.login({
    username: form.account || '系统用户',
    role,
  })

  persistLoginForm()

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  const target = redirect || ROLE_HOME[role]

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
          <p>请输入账号、密码与验证码登录系统</p>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" @submit.prevent>
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" clearable />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>

        <el-form-item label="验证码" prop="captchaInput">
          <div class="captcha-row">
            <el-input v-model="form.captchaInput" placeholder="请输入验证码" />
            <img :src="captchaImage" class="captcha-image" alt="验证码" @click="refreshCaptcha" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.rememberPassword">记住密码</el-checkbox>
        </el-form-item>

        <div class="login-tips">提示：账号前缀可区分角色，如 admin、auditor，其余默认企业用户。</div>

        <el-button class="submit-btn" type="primary" size="large" @click="onSubmit">
          登录
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

.captcha-row {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 10px;
}

.captcha-image {
  width: 110px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #c3dfd7;
  cursor: pointer;
}

.login-tips {
  margin-top: -4px;
  margin-bottom: 8px;
  color: #668185;
  font-size: 12px;
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

  .captcha-row {
    grid-template-columns: 1fr;
  }
}
</style>
