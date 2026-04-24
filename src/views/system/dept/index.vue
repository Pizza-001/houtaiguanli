<template>
  <div class="app-container">
    <el-card shadow="hover">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="queryParams.deptName" placeholder="请输入部门名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="部门状态" clearable mode="default">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-header mt-10">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增部门</el-button>
        <el-button type="info" plain icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
      </div>

      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="deptList"
        row-key="deptId"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        class="mt-10"
      >
        <el-table-column prop="deptName" label="部门名称" width="260" />
        <el-table-column prop="orderNum" label="排序" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)">新增子部门</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dept Dialog -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="deptRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="上级部门" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="deptOptions"
                :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
                value-key="deptId"
                placeholder="选择上级部门"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="form.deptName" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门状态">
              <el-radio-group v-model="form.status">
                <el-radio label="0">正常</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
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
import { ref, onMounted, nextTick } from 'vue'
import { listDept, getDept, delDept, addDept, updateDept } from '@/api/dept'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const deptList = ref([])
const deptOptions = ref([])
const open = ref(false)
const title = ref('')
const isExpandAll = ref(true)
const refreshTable = ref(true)

const queryParams = ref({
  deptName: undefined,
  status: undefined
})

const form = ref({})
const rules = {
  deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
  orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listDept(queryParams.value)
    deptList.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  getList()
}

const resetQuery = () => {
  queryParams.value = {
    deptName: undefined,
    status: undefined
  }
  handleQuery()
}

const toggleExpandAll = () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
}

const handleAdd = async (row) => {
  reset()
  await getTreeselect()
  if (row != undefined) {
    form.value.parentId = row.deptId
  }
  open.value = true
  title.value = '添加部门'
}

const handleUpdate = async (row) => {
  reset()
  await getTreeselect()
  const res = await getDept(row.deptId)
  form.value = res.data
  open.value = true
  title.value = '修改部门'
}

const getTreeselect = async () => {
  const res = await listDept()
  deptOptions.value = res.data
}

const submitForm = async () => {
  if (form.value.deptId) {
    await updateDept(form.value)
    ElMessage.success('修改成功')
  } else {
    await addDept(form.value)
    ElMessage.success('添加成功')
  }
  open.value = false
  getList()
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该部门及其子部门？', '提示', { type: 'warning' }).then(async () => {
    await delDept(row.deptId)
    ElMessage.success('删除成功')
    getList()
  })
}

const reset = () => {
  form.value = {
    deptId: undefined,
    parentId: undefined,
    deptName: '',
    orderNum: 0,
    leader: '',
    phone: '',
    status: '0'
  }
}

const cancel = () => {
  open.value = false
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.mt-10 {
  margin-top: 10px;
}
</style>
