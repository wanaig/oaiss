<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import { truncateHash, copyText } from '../utils/blockchain'

const props = defineProps({
  hash: { type: String, default: '' },
  prefixLen: { type: Number, default: 6 },
  suffixLen: { type: Number, default: 4 },
  showCopy: { type: Boolean, default: true },
})

const display = computed(() => truncateHash(props.hash, props.prefixLen, props.suffixLen))

const onCopy = async () => {
  const ok = await copyText(props.hash)
  if (ok) {
    ElMessage.success('已复制到剪贴板')
  } else {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <span class="blockchain-hash" v-if="hash">
    <el-tooltip :content="hash" placement="top" :show-after="300">
      <span class="hash-text">{{ display }}</span>
    </el-tooltip>
    <el-button v-if="showCopy" link type="primary" size="small" :icon="CopyDocument" class="copy-btn" @click.stop="onCopy" />
  </span>
  <span v-else class="blockchain-hash text-muted">-</span>
</template>

<style scoped>
.blockchain-hash {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hash-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  cursor: default;
}

.copy-btn {
  padding: 0 2px;
}

.text-muted {
  color: var(--text-secondary);
}
</style>
