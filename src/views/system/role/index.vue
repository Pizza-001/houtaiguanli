<template>
  <div class="app-container">
    <el-card shadow="hover" class="query-card mb-20">
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="professional-form">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="角色权限" prop="roleKey">
          <el-input v-model="queryParams.roleKey" placeholder="请输入权限字符" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="角色状态" clearable style="width: 160px">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" class="premium-button">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header-flex">
          <div class="header-title">
            <el-icon><UserFilled /></el-icon>
            <span>系统角色管理</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" plain icon="Plus" @click="handleAdd">新增角色</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="roleList" stripe class="modern-table">
        <el-table-column label="角色编号" prop="roleId" width="100" align="center" />
        <el-table-column label="角色名称" prop="roleName" :show-overflow-tooltip="true" />
        <el-table-column label="权限字符" prop="roleKey" :show-overflow-tooltip="true" />
        <el-table-column label="显示顺序" prop="roleSort" width="100" align="center" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" align="center" width="180" />
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 角色弹窗 -->
    <el-dialog :title="title" v-model="open" width="550px" append-to-body class="premium-dialog">
      <el-form ref="roleRef" :model="form" :rules="rules" label-width="100px" class="mt-20">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="roleSort">
          <el-input-number v-model="form.roleSort" :min="0" class="w100" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单权限">
          <div class="tree-container">
            <el-input
              v-model="menuFilterText"
              placeholder="搜索菜单..."
              clearable
              prefix-icon="Search"
              class="mb-10"
            />
            <el-tree
              class="tree-border modern-tree"
              :data="menuOptions"
              show-checkbox
              ref="menuTreeRef"
              node-key="menuId"
              :props="{ label: 'menuName', children: 'children' }"
              :filter-node-method="filterNode"
              empty-text="加载中，请稍候"
            />
          </div>
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

<script>
export default {
  name: "Role"
}
</script>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { listRole, getRole, delRole, addRole, updateRole, listMenu } from '@/api/role'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'

const loading = ref(true)
const roleList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)
const menuOptions = ref([])
const menuTreeRef = ref()
const menuFilterText = ref('')

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  roleName: undefined,
  roleKey: undefined,
  status: undefined
})

const form = ref({})
const rules = {
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }]
}

watch(menuFilterText, (val) => {
  menuTreeRef.value?.filter(val)
})

const filterNode = (value, data) => {
  if (!value) return true
  return data.menuName.includes(value)
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listRole(queryParams.value)
    roleList.value = res.rows
    total.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const getMenuTreeselect = async () => {
  const res = await listMenu()
  menuOptions.value = res.data
}

const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    roleName: undefined,
    roleKey: undefined,
    status: undefined
  }
  handleQuery()
}

const handleAdd = () => {
  reset()
  getMenuTreeselect()
  open.value = true
  title.value = '添加角色'
}

const handleUpdate = async (row) => {
  reset()
  const res = await getRole(row.roleId)
  form.value = res.data
  open.value = true
  title.value = '修改角色'
  await getMenuTreeselect()
  // In real case, you might need nextTick to set checked keys
}

const submitForm = async () => {
  if (form.value.roleId) {
    await updateRole(form.value)
    ElMessage.success('修改成功')
  } else {
    await addRole(form.value)
    ElMessage.success('添加成功')
  }
  open.value = false
  getList()
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该角色？', '提示', { type: 'warning' }).then(async () => {
    await delRole(row.roleId)
    ElMessage.success('删除成功')
    getList()
  })
}

const handleStatusChange = (row) => {
  const text = row.status === '0' ? '启用' : '停用'
  ElMessageBox.confirm('确认要"' + text + '""' + row.roleName + '"角色吗？').then(() => {
    return updateRole({ roleId: row.roleId, status: row.status })
  }).then(() => {
    ElMessage.success(text + '成功')
  }).catch(() => {
    row.status = row.status === '0' ? '1' : '0'
  })
}

const reset = () => {
  form.value = {
    roleId: undefined,
    roleName: '',
    roleKey: '',
    roleSort: 0,
    status: '0'
  }
  menuFilterText.value = ''
}

const cancel = () => {
  open.value = false
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
}

.query-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.header-title .el-icon {
  color: #f59e0b;
}

.modern-table {
  border-radius: 8px;
  overflow: hidden;
}

.premium-button {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
}

.tree-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.modern-tree {
  max-height: 250px;
  overflow-y: auto;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.w100 { width: 100%; }
.mb-20 { margin-bottom: 20px; }
.mb-10 { margin-bottom: 10px; }
.mt-20 { margin-top: 20px; }
</style>
