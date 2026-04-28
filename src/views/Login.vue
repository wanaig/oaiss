<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../store'
import { ROLE_HOME } from '../config/menu'

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

  persistLoginForm()

  try {
    const { role } = await appStore.login({
      username: form.account,
      password: form.password,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const target = redirect || ROLE_HOME[role]

    ElMessage.success('登录成功')
    router.replace(target)
  } catch (e) {
    refreshCaptcha()
    form.captchaInput = ''
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg" />

    <el-card class="login-card" shadow="never">
      <div class="login-header">
        <div class="brand-mark">C</div>
        <div>
          <h1>碳链监管</h1>
          <p>登录您的账号以访问系统</p>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" @submit.prevent>
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
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
        <el-button class="submit-btn" type="primary" size="large" @click="onSubmit">登录</el-button>
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
  background: var(--saas-bg);
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(67, 97, 238, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(46, 196, 182, 0.06) 0%, transparent 50%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px !important;
  padding: 36px 32px;
  position: relative;
  z-index: 2;
}

.login-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.brand-mark {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4361ee, #2ec4b6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  flex-shrink: 0;
}

.login-header h1 {
  margin: 0;
  font-size: 22px;
  color: var(--saas-text);
}

.login-header p {
  margin: 6px 0 0;
  color: var(--saas-text-secondary);
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
  border: 1px solid var(--saas-border);
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
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
