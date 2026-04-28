<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="saas-page">
    <div class="page-head" v-if="title">
      <h2 class="page-head-title">{{ title }}</h2>
      <p class="page-head-desc" v-if="description">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.saas-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.page-head { margin-bottom: 4px; }
.page-head-title { margin: 0; font-size: 22px; font-weight: 700; color: var(--saas-text); }
.page-head-desc { margin: 6px 0 0; font-size: 14px; color: var(--saas-text-secondary); }
</style>
