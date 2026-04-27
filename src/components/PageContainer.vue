<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="page-container">
    <el-card shadow="never" class="page-card">
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-description">{{ description || `这是${title}页面` }}</p>
    </el-card>
  </section>
</template>

<style scoped>
.page-container {
  min-height: calc(100vh - 112px);
}

.page-card {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfb 100%);
  box-shadow: var(--shadow-soft);
}

.page-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.page-description {
  margin: 14px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .page-container {
    min-height: calc(100vh - 128px);
  }

  .page-title {
    font-size: 20px;
  }
}
</style>
