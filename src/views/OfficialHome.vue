<script setup>
import {
  Connection,
  DataAnalysis,
  EditPen,
  Link,
  Lock,
  Message,
  Monitor,
  Notification,
  OfficeBuilding,
  Operation,
  SetUp,
  Share,
  User,
  CircleCheck,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

const navItems = [
  { key: 'hero', label: 'OAISS' },
  { key: 'build', label: '构建' },
  { key: 'join', label: '参与' },
  { key: 'research', label: '研究' },
  { key: 'platform', label: '平台' },
  { key: 'country', label: '国家' },
  { key: 'about', label: '关于' },
]

const featureCards = [
  {
    title: 'P2P双向交易',
    description: '通过可信交易机制，实现企业间碳资产供需撮合与快速结算。',
    icon: Connection,
    route: '/enterprise/trading/p2p',
  },
  {
    title: '区域链智能合约',
    description: '采用可审计的链上合约流程，确保交易规则透明、可追踪。',
    icon: Link,
    route: '/enterprise/trading/market',
  },
  {
    title: 'AI预测分析',
    description: '基于排放历史与行业特征，提供趋势预测与限额建议能力。',
    icon: DataAnalysis,
    route: '/enterprise/company/dashboard',
  },
  {
    title: '数字签名',
    description: '通过签名确认关键业务动作，强化数据可信与责任闭环。',
    icon: EditPen,
    route: '/admin/system/carbon',
  },
]

const roleCards = [
  {
    title: '企业用户',
    description: '上传核算、发起交易、查看可视化数据与履约状态。',
    icon: OfficeBuilding,
    route: '/enterprise/carbon/upload',
  },
  {
    title: '管理员',
    description: '统筹用户、配置、核算与平台规则，维护系统稳定运行。',
    icon: SetUp,
    route: '/admin/system/users',
  },
  {
    title: '审核员',
    description: '执行材料核查、异常识别和报告审核，保障数据真实性。',
    icon: CircleCheck,
    route: '/auditor/audit/list',
  },
  {
    title: '第三方监管机构',
    description: '独立查看关键监管指标与证据链，形成协同治理机制。',
    icon: Monitor,
    route: '/admin/data/statistics',
  },
]

const metricItems = [
  { label: '分布式', value: '99.96%' },
  { label: '集中式指标', value: 'A+' },
  { label: '节点数量', value: '3,248' },
  { label: '延迟', value: '11ms' },
  { label: '最大延时', value: '49ms' },
]

const galleryImages = [
  'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
]

const bottomIcons = [Operation, DataAnalysis, Connection, Link, Lock, Notification]

const onNavClick = (key) => {
  const el = document.getElementById(key)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const jumpToRoute = (path) => {
  router.push(path)
}

const onSocialClick = () => {
  ElMessage.success('社交入口已触发')
}
</script>

<template>
  <div class="site-page">
    <header class="top-nav">
      <div class="brand" @click="onNavClick('hero')">OAISS</div>
      <nav class="nav-menu">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          type="button"
          @click="onNavClick(item.key)"
        >
          {{ item.label }}
        </button>
      </nav>
      <div class="social-links">
        <button type="button" class="social-btn" @click="onSocialClick"><el-icon><Message /></el-icon></button>
        <button type="button" class="social-btn" @click="onSocialClick"><el-icon><Share /></el-icon></button>
        <button type="button" class="social-btn" @click="onSocialClick"><el-icon><Link /></el-icon></button>
      </div>
    </header>

    <section id="hero" class="hero">
      <div class="hero-overlay">
        <div class="hero-logo">OAISS</div>
        <h1 class="hero-title">开放智能可持续系统平台</h1>
        <p class="hero-description">
          面向碳资产流转、可信核算与跨域监管的企业级数字生态基础设施。
        </p>
      </div>
    </section>

    <section id="build" class="section-wrap">
      <div class="section-title-wrap">
        <h2 class="section-title">核心功能</h2>
        <p class="section-subtitle">以可审计、可扩展、可协作为目标构建绿色治理能力。</p>
      </div>
      <div class="feature-grid">
        <article v-for="item in featureCards" :key="item.title" class="feature-card">
          <div class="feature-icon"><el-icon><component :is="item.icon" /></el-icon></div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <el-button type="primary" plain @click="jumpToRoute(item.route)">点击进入</el-button>
        </article>
      </div>
    </section>

    <section id="research" class="section-wrap intro-section">
      <div class="intro-left">
        <h2 class="section-title">系统介绍</h2>
        <p class="intro-text">
          OAISS 以企业级治理为核心，连接碳核算、交易、签名与监管流程，形成端到端的数据可信闭环。
          通过区域链与 AI 分析能力，平台可在保障安全性的同时提升协作效率。
        </p>
        <div class="metrics-grid">
          <div v-for="item in metricItems" :key="item.label" class="metric-card">
            <div class="metric-value">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
      <div class="intro-image" />
    </section>

    <section id="platform" class="section-wrap">
      <div class="section-title-wrap">
        <h2 class="section-title">用户角色</h2>
        <p class="section-subtitle">四类角色协同运作，覆盖碳资产管理全生命周期。</p>
      </div>
      <div class="roles-grid">
        <article v-for="role in roleCards" :key="role.title" class="role-card">
          <div class="role-icon"><el-icon><component :is="role.icon" /></el-icon></div>
          <h3>{{ role.title }}</h3>
          <p>{{ role.description }}</p>
          <el-button text type="primary" @click="jumpToRoute(role.route)">访问角色功能</el-button>
        </article>
      </div>
    </section>

    <section id="country" class="section-wrap">
      <div class="section-title-wrap">
        <h2 class="section-title">生态图集</h2>
        <p class="section-subtitle">面向低碳未来的自然与环境主题视觉呈现。</p>
      </div>
      <div class="gallery-grid">
        <img v-for="url in galleryImages" :key="url" :src="url" alt="生态主题图片" />
      </div>
    </section>

    <section id="join" class="bottom-icon-strip">
      <div v-for="(icon, idx) in bottomIcons" :key="idx" class="strip-icon">
        <el-icon><component :is="icon" /></el-icon>
      </div>
    </section>

    <footer id="about" class="footer">
      <div class="footer-columns">
        <div>
          <h4>更多链接</h4>
          <a href="javascript:void(0)">平台白皮书</a>
          <a href="javascript:void(0)">开发者文档</a>
          <a href="javascript:void(0)">治理公示</a>
        </div>
        <div>
          <h4>信息链接</h4>
          <a href="javascript:void(0)">新闻动态</a>
          <a href="javascript:void(0)">系统公告</a>
          <a href="javascript:void(0)">隐私与合规</a>
        </div>
        <div>
          <h4>关注我们</h4>
          <a href="javascript:void(0)">微信公众号</a>
          <a href="javascript:void(0)">视频号</a>
          <a href="javascript:void(0)">企业社群</a>
        </div>
      </div>
      <div class="copyright">© 2026 OAISS. All rights reserved.</div>
    </footer>
  </div>
</template>

<style scoped>
.site-page {
  min-height: 100vh;
  background: var(--saas-bg);
  color: var(--saas-text);
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: var(--saas-sidebar);
  color: #fff;
}

.brand {
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  cursor: pointer;
}

.nav-menu { display: flex; gap: 20px; }

.nav-item {
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.7);
  font-size: 14px;
  cursor: pointer;
  padding: 6px 4px;
  transition: color .2s;
}

.nav-item:hover { color: #fff; }

.social-links { display: flex; gap: 8px; }

.social-btn {
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
  width: 34px; height: 34px;
  border-radius: 8px;
  cursor: pointer;
  transition: all .2s;
}

.social-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

.hero {
  height: 72vh;
  min-height: 480px;
  background-image:
    linear-gradient(rgba(26, 31, 46, 0.7), rgba(26, 31, 46, 0.75)),
    url('https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2200&q=80');
  background-size: cover;
  background-position: center;
}

.hero-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 20px;
}

.hero-logo {
  width: 90px; height: 90px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.6);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  background: rgba(67, 97, 238, 0.25);
}

.hero-title {
  margin: 24px 0 8px;
  color: #fff;
  font-size: 40px;
}

.hero-description {
  margin: 0;
  color: rgba(255,255,255,0.75);
  font-size: 16px;
  max-width: 640px;
}

.section-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 20px;
}

.section-title-wrap { margin-bottom: 24px; }

.section-title {
  margin: 0;
  font-size: 28px;
  color: var(--saas-text);
}

.section-subtitle {
  margin: 6px 0 0;
  color: var(--saas-text-secondary);
}

.feature-grid,
.roles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.feature-card,
.role-card {
  background: var(--saas-surface);
  border-radius: var(--saas-radius);
  box-shadow: var(--saas-shadow);
  padding: 24px 20px;
  transition: box-shadow .25s;
}

.feature-card:hover,
.role-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.feature-icon,
.role-icon {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #4361ee, #2ec4b6);
  color: #fff;
  font-size: 18px;
}

.feature-card h3, .role-card h3 { margin: 16px 0 8px; font-size: 16px; }
.feature-card p, .role-card p { margin: 0 0 16px; color: var(--saas-text-secondary); line-height: 1.7; font-size: 13px; }

.intro-section {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
}

.intro-left {
  background: var(--saas-surface);
  border-radius: var(--saas-radius);
  box-shadow: var(--saas-shadow);
  padding: 24px;
}

.intro-text {
  color: var(--saas-text-secondary);
  line-height: 1.9;
  margin: 12px 0 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.metric-card {
  background: var(--saas-sidebar);
  color: #fff;
  border-radius: var(--saas-radius);
  padding: 12px 8px;
  text-align: center;
}

.metric-value { font-size: 18px; font-weight: 700; }
.metric-label { font-size: 12px; margin-top: 4px; opacity: .75; }

.intro-image {
  border-radius: var(--saas-radius);
  min-height: 320px;
  background-image: url('https://images.unsplash.com/photo-1433477194723-29c0d6a29478?auto=format&fit=crop&w=1400&q=80');
  background-size: cover;
  background-position: center;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.gallery-grid img {
  width: 100%;
  height: 190px;
  object-fit: cover;
  border-radius: var(--saas-radius);
}

.bottom-icon-strip {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 24px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.strip-icon {
  height: 54px;
  border-radius: var(--saas-radius);
  border: 1px dashed var(--saas-border);
  color: var(--saas-primary);
  background: var(--saas-surface);
  display: grid;
  place-items: center;
  font-size: 22px;
}

.footer {
  background: var(--saas-sidebar);
  color: rgba(255,255,255,0.7);
  padding: 40px 20px 24px;
}

.footer-columns {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.footer h4 { margin: 0 0 12px; color: #fff; }

.footer a {
  display: block;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  margin-bottom: 8px;
  font-size: 13px;
  transition: color .2s;
}

.footer a:hover { color: #fff; }

.copyright {
  max-width: 1200px;
  margin: 24px auto 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 14px;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  text-align: center;
}

@media (max-width: 1024px) {
  .nav-menu { display: none; }
  .feature-grid, .roles-grid { grid-template-columns: repeat(2, 1fr); }
  .intro-section { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .hero-title { font-size: 28px; }
  .feature-grid, .roles-grid, .gallery-grid, .footer-columns { grid-template-columns: 1fr; }
  .bottom-icon-strip { grid-template-columns: repeat(3, 1fr); }
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
