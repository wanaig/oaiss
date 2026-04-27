<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'

const searchForm = reactive({
  txHash: '',
  blockHeight: '',
  txType: '',
  dateRange: [],
})

const txTypeOptions = ['转账', '合约调用', '合约创建', '质押', '解质押', '投票', '其他']

const txList = ref([
  {
    id: 1,
    txHash: '0x8f1eea2ba9c4a78d9e51f0b12c3d6e7a8901b23c45d678e90123456789abcde',
    blockHeight: 18472653,
    blockHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
    txType: '转账',
    fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bD18',
    toAddress: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
    amount: 1250.5,
    gasFee: 0.0023,
    status: '成功',
    timestamp: '2026-04-26 14:32:18',
    signature: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    contractAddress: '',
    inputData: '0xa9059cbb0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba720000000000000000000000000000000000000000000000000000000002540be4',
    confirmations: 128,
  },
  {
    id: 2,
    txHash: '0x3a4b5c6d7e8f9012abcdef3456789012abcdef3456789012abcdef34567890',
    blockHeight: 18472698,
    blockHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
    txType: '合约调用',
    fromAddress: '0x1f2E3d4C5b6A7f8e9D0c1B2a3F4d5E6c7B8a9F0d',
    toAddress: '0x9c2d4E6f8A0b1C3d5E7f9A0b2C4d6E8f0A1b3C5d',
    amount: 0,
    gasFee: 0.0156,
    status: '成功',
    timestamp: '2026-04-26 14:28:55',
    signature: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    contractAddress: '0x9c2d4E6f8A0b1C3d5E7f9A0b2C4d6E8f0A1b3C5d',
    inputData: '0x6a6278420000000000000000000000001f2e3d4c5b6a7f8e9d0c1b2a3f4d5e6c7b8a9f0d',
    confirmations: 92,
  },
  {
    id: 3,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    blockHeight: 18472712,
    blockHash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    txType: '合约创建',
    fromAddress: '0x4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B',
    toAddress: '',
    amount: 0,
    gasFee: 0.0453,
    status: '失败',
    timestamp: '2026-04-26 14:20:03',
    signature: '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    contractAddress: '0xD1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0',
    inputData: '0x608060405234801561001057600080fd5b50610c8e806100206000396000f3fe608060405234801561001057600080fd5b50600436106100',
    confirmations: 0,
  },
  {
    id: 4,
    txHash: '0x9e8f7a6b5c4d3e2f1089abcdef0123456789abcdef0123456789abcdef01',
    blockHeight: 18472756,
    blockHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef123456789012',
    txType: '质押',
    fromAddress: '0x3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C',
    toAddress: '0x7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A',
    amount: 5000,
    gasFee: 0.0031,
    status: '成功',
    timestamp: '2026-04-25 09:45:12',
    signature: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    contractAddress: '0x7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A',
    inputData: '0xd0e30db0',
    confirmations: 452,
  },
  {
    id: 5,
    txHash: '0x2d4e6f8a0b1c3d5e7f9a0b2c4d6e8f0a1b3c5d7e9fa0b1c3d5e7f9a0b2c4d6e8f',
    blockHeight: 18472801,
    blockHash: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890123456',
    txType: '解质押',
    fromAddress: '0x2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D',
    toAddress: '0x6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B',
    amount: 2000,
    gasFee: 0.0028,
    status: '处理中',
    timestamp: '2026-04-25 08:12:44',
    signature: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123',
    contractAddress: '0x6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B',
    inputData: '0x2e1a7d4d00000000000000000000000000000000000000000000000006f05b59d3b20000',
    confirmations: 8,
  },
  {
    id: 6,
    txHash: '0x5c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
    blockHeight: 18472889,
    blockHash: '0x6f7890abcdef1234567890abcdef1234567890abcdef123456789012345678',
    txType: '转账',
    fromAddress: '0x8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E',
    toAddress: '0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0',
    amount: 88.88,
    gasFee: 0.0011,
    status: '成功',
    timestamp: '2026-04-24 22:08:33',
    signature: '0x90abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345',
    contractAddress: '',
    inputData: '0x',
    confirmations: 1087,
  },
  {
    id: 7,
    txHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    blockHeight: 18472934,
    blockHash: '0x7890abcdef1234567890abcdef1234567890abcdef12345678901234567890',
    txType: '投票',
    fromAddress: '0xB2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1',
    toAddress: '0xC3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2',
    amount: 0,
    gasFee: 0.0008,
    status: '成功',
    timestamp: '2026-04-24 16:55:01',
    signature: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    contractAddress: '0xC3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2',
    inputData: '0x15373e3d0000000000000000000000000000000000000000000000000000000000000001',
    confirmations: 2011,
  },
])

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const detailDialogVisible = ref(false)
const currentDetailTx = ref(null)

const inDateRange = (dateText, range) => {
  if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
    return true
  }
  const current = new Date(dateText).getTime()
  const start = new Date(range[0]).getTime()
  const end = new Date(range[1]).getTime()
  return current >= start && current <= end
}

const filteredTxList = computed(() => {
  const txHash = searchForm.txHash.trim().toLowerCase()
  const blockHeight = searchForm.blockHeight.trim()
  const txType = searchForm.txType
  const range = searchForm.dateRange

  return txList.value.filter((item) => {
    const hashMatch = !txHash || item.txHash.toLowerCase().includes(txHash)
    const heightMatch = !blockHeight || String(item.blockHeight).includes(blockHeight)
    const typeMatch = !txType || item.txType === txType
    const rangeMatch = inDateRange(item.timestamp, range)
    return hashMatch && heightMatch && typeMatch && rangeMatch
  })
})

const total = computed(() => filteredTxList.value.length)

const pagedTxList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTxList.value.slice(start, end)
})

const onQuery = () => {
  currentPage.value = 1
  ElMessage.success('查询完成')
}

const onSelectionChange = (rows) => {
  selectedRows.value = rows
}

const onSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const onCurrentChange = (page) => {
  currentPage.value = page
}

const openDetail = (row) => {
  currentDetailTx.value = row
  detailDialogVisible.value = true
}

const truncateHash = (hash) => {
  if (!hash) return '-'
  if (hash.length <= 14) return hash
  return hash.slice(0, 6) + '...' + hash.slice(-4)
}

const copyText = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<template>
  <section class="blockchain-tx-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>区块链交易</el-breadcrumb-item>
        <el-breadcrumb-item>交易信息</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="交易哈希">
          <el-input v-model="searchForm.txHash" placeholder="请输入交易哈希值" clearable style="width: 280px" />
        </el-form-item>

        <el-form-item label="区块高度">
          <el-input v-model="searchForm.blockHeight" placeholder="请输入区块高度" clearable style="width: 180px" />
        </el-form-item>

        <el-form-item label="交易类型">
          <el-select v-model="searchForm.txType" placeholder="全部类型" clearable style="width: 140px">
            <el-option v-for="item in txTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">已选择 {{ selectedRows.length }} 条记录，区块数据基于链上账本生成，不可篡改。</div>
      <el-table :data="pagedTxList" border @selection-change="onSelectionChange" style="width: 100%">
        <el-table-column type="selection" width="56" />
        <el-table-column label="序号" width="68" align="center">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="交易哈希值" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.txHash" placement="top">
              <span class="hash-text">{{ truncateHash(row.txHash) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="blockHeight" label="区块高度" min-width="110" align="right" sortable />
        <el-table-column label="区块哈希" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.blockHash" placement="top">
              <span class="hash-text">{{ truncateHash(row.blockHash) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="txType" label="交易类型" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.txType === '转账' ? '' : row.txType === '合约调用' ? 'success' : row.txType === '合约创建' ? 'warning' : row.txType === '质押' ? 'info' : row.txType === '解质押' ? 'danger' : row.txType === '投票' ? 'primary' : ''"
              size="small"
            >
              {{ row.txType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发送方地址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.fromAddress" placement="top">
              <span class="hash-text">{{ truncateHash(row.fromAddress) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="接收方地址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.toAddress || '-'" placement="top">
              <span class="hash-text">{{ row.toAddress ? truncateHash(row.toAddress) : '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="交易金额" min-width="110" align="right">
          <template #default="{ row }">
            <span v-if="row.amount > 0">{{ row.amount.toLocaleString() }} ETH</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="Gas费用" min-width="100" align="right">
          <template #default="{ row }">
            {{ row.gasFee }} ETH
          </template>
        </el-table-column>
        <el-table-column prop="status" label="交易状态" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === '成功' ? 'success' : row.status === '失败' ? 'danger' : 'warning'"
              size="small"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间戳" min-width="170" sortable />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          background
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="onSizeChange"
          @current-change="onCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="交易详情" width="800px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentDetailTx" label-width="120px">
        <el-descriptions-item label="交易哈希值" :span="2">
          <div class="copyable-field">
            <span class="field-value hash-value">{{ currentDetailTx.txHash }}</span>
            <el-button link type="primary" size="small" :icon="CopyDocument" @click="copyText(currentDetailTx.txHash)" />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="区块哈希" :span="2">
          <div class="copyable-field">
            <span class="field-value hash-value">{{ currentDetailTx.blockHash }}</span>
            <el-button link type="primary" size="small" :icon="CopyDocument" @click="copyText(currentDetailTx.blockHash)" />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="区块高度">{{ currentDetailTx.blockHeight.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="确认数">{{ currentDetailTx.confirmations.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="交易时间" :span="2">{{ currentDetailTx.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="发送方地址" :span="2">
          <div class="copyable-field">
            <span class="field-value hash-value">{{ currentDetailTx.fromAddress }}</span>
            <el-button link type="primary" size="small" :icon="CopyDocument" @click="copyText(currentDetailTx.fromAddress)" />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="接收方地址" :span="2">
          <div class="copyable-field" v-if="currentDetailTx.toAddress">
            <span class="field-value hash-value">{{ currentDetailTx.toAddress }}</span>
            <el-button link type="primary" size="small" :icon="CopyDocument" @click="copyText(currentDetailTx.toAddress)" />
          </div>
          <span v-else class="text-muted">-（合约创建交易，无接收方）</span>
        </el-descriptions-item>
        <el-descriptions-item label="交易金额">
          <span v-if="currentDetailTx.amount > 0">{{ currentDetailTx.amount.toLocaleString() }} ETH</span>
          <span v-else class="text-muted">0 ETH</span>
        </el-descriptions-item>
        <el-descriptions-item label="手续费">{{ currentDetailTx.gasFee }} ETH</el-descriptions-item>
        <el-descriptions-item label="交易类型">{{ currentDetailTx.txType }}</el-descriptions-item>
        <el-descriptions-item label="交易状态">
          <el-tag
            :type="currentDetailTx.status === '成功' ? 'success' : currentDetailTx.status === '失败' ? 'danger' : 'warning'"
            size="small"
          >
            {{ currentDetailTx.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="签名信息" :span="2">
          <div class="copyable-field">
            <span class="field-value hash-value signature-value">{{ currentDetailTx.signature }}</span>
            <el-button link type="primary" size="small" :icon="CopyDocument" @click="copyText(currentDetailTx.signature)" />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="智能合约地址" :span="2">
          <div class="copyable-field" v-if="currentDetailTx.contractAddress">
            <span class="field-value hash-value">{{ currentDetailTx.contractAddress }}</span>
            <el-button link type="primary" size="small" :icon="CopyDocument" @click="copyText(currentDetailTx.contractAddress)" />
          </div>
          <span v-else class="text-muted">-（非合约交易）</span>
        </el-descriptions-item>
        <el-descriptions-item label="输入数据（Input Data）" :span="2">
          <div class="copyable-field input-data-field">
            <pre class="input-data-value">{{ currentDetailTx.inputData }}</pre>
            <el-button link type="primary" class="copy-input-btn" size="small" :icon="CopyDocument" @click="copyText(currentDetailTx.inputData)" />
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </section>
</template>

<style scoped>
.blockchain-tx-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.table-tip {
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.hash-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: var(--text-primary);
}

.text-muted {
  color: var(--text-secondary);
}

.pagination-row {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.copyable-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.field-value {
  word-break: break-all;
}

.hash-value {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.signature-value {
  font-size: 12px;
}

.input-data-field {
  position: relative;
}

.input-data-value {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--bg-page);
  padding: 8px 12px;
  border-radius: 6px;
  flex: 1;
}

.copy-input-btn {
  align-self: flex-start;
  margin-top: 4px;
}
</style>
