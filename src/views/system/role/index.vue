<template>
  <div class="app-container">
    <el-card shadow="hover">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="角色权限" prop="roleKey">
          <el-input v-model="queryParams.roleKey" placeholder="请输入权限字符" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-header mt-10">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增角色</el-button>
      </div>

      <el-table v-loading="loading" :data="roleList" class="mt-10">
        <el-table-column label="角色编号" prop="roleId" width="120" />
        <el-table-column label="角色名称" prop="roleName" />
        <el-table-column label="权限字符" prop="roleKey" />
        <el-table-column label="显示顺序" prop="roleSort" width="100" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" />
        <el-table-column label="操作" width="180">
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
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- Role Dialog -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="roleRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
        </el-form-item>
        <el-form-item label="角色顺序" prop="roleSort">
          <el-input-number v-model="form.roleSort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')">展开/折叠</el-checkbox>
          <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event, 'menu')">全选/全不选</el-checkbox>
          <el-tree
            class="tree-border"
            :data="menuOptions"
            show-checkbox
            ref="menuTreeRef"
            node-key="id"
            :props="defaultProps"
            empty-text="加载中，请稍候"
          />
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
import { ref, onMounted } from 'vue'
import { listRole, getRole, delRole, addRole, updateRole } from '@/api/role'
import { treeselect as menuTreeselect } from '@/api/menu'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const roleList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)
const menuOptions = ref([])
const menuTreeRef = ref()
const menuExpand = ref(false)
const menuNodeAll = ref(false)

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  roleName: undefined,
  roleKey: undefined
})

const form = ref({})
const rules = {
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '权限角色顺序不能为空', trigger: 'blur' }]
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
  const res = await menuTreeselect()
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
    roleKey: undefined
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
  const roleId = row.roleId
  const res = await getRole(roleId)
  form.value = res.data
  open.value = true
  title.value = '修改角色'
  await getMenuTreeselect()
  // Set checked menus
  // menuTreeRef.value.setCheckedKeys(res.menuIds)
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
    status: '0',
    menuIds: []
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
.tree-border {
  margin-top: 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
