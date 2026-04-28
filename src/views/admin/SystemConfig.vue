<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()

const searchForm = reactive({ description: '', name: '' })
const dialogVisible = ref(false); const dialogMode = ref('add'); const editingId = ref(null); const formRef = ref()
const formModel = reactive({ description: '', name: '', configValue: '' })
const formRules = { configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }] }
const page = ref(1); const pageSize = ref(10); const selectedRows = ref([])

onMounted(() => { store.fetchAdminConfigs() })

const filteredData = computed(() => {
  const d = searchForm.description.trim().toLowerCase(); const n = searchForm.name.trim().toLowerCase()
  return store.adminConfigs.filter(item => (!d || (item.configName || '').toLowerCase().includes(d)) && (!n || (item.configKey || '').toLowerCase().includes(n)))
})
const pagedData = computed(() => { const s = (page.value - 1) * pageSize.value; return filteredData.value.slice(s, s + pageSize.value) })

const openEdit = (row) => { dialogMode.value = 'edit'; editingId.value = row.id; formModel.description = row.configName || ''; formModel.name = row.configKey || ''; formModel.configValue = row.configValue || ''; dialogVisible.value = true }
const onSave = async () => {
  if (!(await formRef.value.validate().catch(() => false))) { ElMessage.warning('请完善'); return }
  if (dialogMode.value === 'edit' && editingId.value) { await store.updateAdminConfig(editingId.value, { configValue: formModel.configValue.trim() }); ElMessage.success('修改成功') }
  dialogVisible.value = false; page.value = 1
}
const onReset = async (row) => {
  try { await ElMessageBox.confirm('确定重置此配置？', '确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await store.updateAdminConfig(row.id, { configValue: '' }); ElMessage.success('已重置') } catch { ElMessage.info('已取消') }
}
</script>

<template>
  <PageSaaSWrapper title="系统配置" description="管理碳交易系统全局配置项">
    <el-card shadow="never">
      <el-form :inline="true" class="search-bar">
        <el-form-item label="配置名称"><el-input v-model="searchForm.description" clearable /></el-form-item>
        <el-form-item label="配置键"><el-input v-model="searchForm.name" clearable /></el-form-item>
        <el-form-item><el-button type="primary" @click="page = 1">查询</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" border @selection-change="selectedRows = $event">
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (page - 1) * pageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column prop="configName" label="配置名称" min-width="140" />
        <el-table-column prop="configKey" label="配置键" min-width="140" />
        <el-table-column prop="configValue" label="配置值" min-width="180" show-overflow-tooltip />
        <el-table-column prop="updatedBy" label="修改人" min-width="100" />
        <el-table-column prop="updateTime" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="120" fixed="right"><template #default="{ row }"><el-button link size="small" @click="openEdit(row)">编辑</el-button><el-button link type="danger" size="small" @click="onReset(row)">重置</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="filteredData.length" /></div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑配置" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="80px">
        <el-form-item label="名称"><el-input v-model="formModel.description" disabled /></el-form-item>
        <el-form-item label="键"><el-input v-model="formModel.name" disabled /></el-form-item>
        <el-form-item label="值" prop="configValue"><el-input v-model="formModel.configValue" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="onSave">保存</el-button></template>
    </el-dialog>
  </PageSaaSWrapper>
</template>

<style scoped>
.search-bar { display: flex; flex-wrap: wrap; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
