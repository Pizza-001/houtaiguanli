<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="字典名称" prop="dictType">
          <el-select v-model="queryParams.dictType" style="width: 240px">
            <el-option
              v-for="item in typeOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="item.dictType"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input
            v-model="queryParams.dictLabel"
            placeholder="请输入字典标签"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="数据状态" clearable style="width: 240px">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="mb8">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
        >新增</el-button>
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
        <el-button
          type="warning"
          plain
          icon="Close"
          @click="handleClose"
        >关闭</el-button>
      </div>

      <el-table border v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="字典编码" align="center" prop="dictCode" />
        <el-table-column label="字典标签" align="center" prop="dictLabel">
          <template #default="scope">
            <span :class="scope.row.listClass === 'default' ? '' : 'text-' + scope.row.listClass">{{ scope.row.dictLabel }}</span>
          </template>
        </el-table-column>
        <el-table-column label="字典键值" align="center" prop="dictValue" />
        <el-table-column label="字典排序" align="center" prop="dictSort" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180"/>
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="dataRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="字典类型">
          <el-input v-model="form.dictType" :disabled="true" />
        </el-form-item>
        <el-form-item label="数据标签" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="请输入数据标签" />
        </el-form-item>
        <el-form-item label="数据键值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="请输入数据键值" />
        </el-form-item>
        <el-form-item label="回显样式" prop="listClass">
          <el-select v-model="form.listClass">
            <el-option label="默认" value="default" />
            <el-option label="主要" value="primary" />
            <el-option label="成功" value="success" />
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="form.dictSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listData, getData, delData, addData, updateData } from '@/api/dict/data'
import { getType, optionselect } from '@/api/dict/type'

const route = useRoute()
const router = useRouter()
const dataRef = ref(null)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)
const dataList = ref([])
const typeOptions = ref([])
const defaultDictType = ref('')

const dataState = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictName: undefined,
    dictType: undefined,
    status: undefined
  },
  rules: {
    dictLabel: [{ required: true, message: '数据标签不能为空', trigger: 'blur' }],
    dictValue: [{ required: true, message: '数据键值不能为空', trigger: 'blur' }],
    dictSort: [{ required: true, message: '数据顺序不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(dataState)

const getTypeList = async () => {
  const res = await optionselect()
  typeOptions.value = res.data
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listData(queryParams.value)
    dataList.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    dictType: defaultDictType.value,
    dictLabel: undefined,
    status: undefined
  }
  handleQuery()
}

const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.dictCode)
  multiple.value = !selection.length
}

const reset = () => {
  form.value = {
    dictCode: undefined,
    dictLabel: undefined,
    dictValue: undefined,
    listClass: 'default',
    dictSort: 0,
    status: '0',
    remark: undefined,
    dictType: defaultDictType.value
  }
  if (dataRef.value) dataRef.value.resetFields()
}

const cancel = () => {
  open.value = false
  reset()
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = '添加字典数据'
}

const handleUpdate = async (row) => {
  reset()
  const dictCode = row.dictCode || ids.value[0]
  const res = await getData(dictCode)
  form.value = res.data
  open.value = true
  title.value = '修改字典数据'
}

const submitForm = async () => {
  if (!dataRef.value) return
  await dataRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.dictCode) {
        await updateData(form.value)
        ElMessage.success('修改成功')
      } else {
        await addData(form.value)
        ElMessage.success('新增成功')
      }
      open.value = false
      getList()
    }
  })
}

const handleDelete = async (row) => {
  const dictCodes = row.dictCode || ids.value
  await ElMessageBox.confirm('是否确认删除字典编码为"' + dictCodes + '"的数据项？')
  await delData(dictCodes)
  getList()
  ElMessage.success('删除成功')
}

const handleClose = () => {
  router.push('/system/dict')
}

onMounted(async () => {
  const dictId = route.params && route.params.dictId
  if (dictId) {
    const res = await getType(dictId)
    queryParams.value.dictType = res.data.dictType
    defaultDictType.value = res.data.dictType
    getTypeList()
    getList()
  } else {
    // If not navigated via ID, just load everything or show error
    getTypeList()
    getList()
  }
})
</script>

<style scoped>
.search-card {
  margin-bottom: 20px;
}
.mb8 {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
