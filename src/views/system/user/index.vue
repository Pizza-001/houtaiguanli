<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- Side Dept Tree -->
      <el-col :span="4" :xs="24">
        <el-card shadow="hover" class="side-card">
          <template #header>
            <div class="card-header">
              <span>部门机构</span>
            </div>
          </template>
          <el-tree
            :data="deptOptions"
            :props="defaultProps"
            :expand-on-click-node="false"
            ref="deptTreeRef"
            default-expand-all
            highlight-current
            @node-click="handleNodeClick"
          />
        </el-card>
      </el-col>

      <!-- User List -->
      <el-col :span="20" :xs="24">
        <el-card shadow="hover">
          <el-form :model="queryParams" ref="queryRef" :inline="true">
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-header mt-10">
            <el-button type="primary" plain icon="Plus" @click="handleAdd">新增用户</el-button>
          </div>

          <el-table v-loading="loading" :data="userList" class="mt-10">
            <el-table-column label="用户编号" prop="userId" width="100" />
            <el-table-column label="用户名称" prop="userName" />
            <el-table-column label="用户昵称" prop="nickName" />
            <el-table-column label="部门" prop="dept.deptName" />
            <el-table-column label="手机号码" prop="phonenumber" width="120" />
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
      </el-col>
    </el-row>

    <!-- User Dialog -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="userRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="deptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }"
                value-key="id"
                placeholder="请选择归属部门"
                check-strictly
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择">
                <el-option label="男" value="0" />
                <el-option label="女" value="1" />
                <el-option label="未知" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
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
import { ref, onMounted } from 'vue'
import { listUser, getUser, delUser, addUser, updateUser } from '@/api/user'
import { listDept } from '@/api/dept'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const userList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)
const deptOptions = ref([])

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  userName: undefined,
  phonenumber: undefined,
  deptId: undefined
})

const form = ref({})
const rules = {
  userName: [{ required: true, message: '用户名称不能为空', trigger: 'blur' }],
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '用户密码不能为空', trigger: 'blur' }],
  deptId: [{ required: true, message: '归属部门不能为空', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listUser(queryParams.value)
    userList.value = res.rows
    total.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const getDeptTree = async () => {
  try {
    const res = await listDept()
    // Convert to tree format if necessary, assume backend returns flat or structured list
    // This is a simplified version
    deptOptions.value = res.data || []
  } catch (err) {
    console.log(err)
  }
}

const handleNodeClick = (data) => {
  queryParams.value.deptId = data.id
  handleQuery()
}

const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    userName: undefined,
    phonenumber: undefined,
    deptId: undefined
  }
  handleQuery()
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = '添加用户'
}

const handleUpdate = async (row) => {
  reset()
  const res = await getUser(row.userId)
  form.value = res.data
  open.value = true
  title.value = '修改用户'
}

const submitForm = async () => {
  if (form.value.userId) {
    await updateUser(form.value)
    ElMessage.success('修改成功')
  } else {
    await addUser(form.value)
    ElMessage.success('添加成功')
  }
  open.value = false
  getList()
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该用户？', '提示', { type: 'warning' }).then(async () => {
    await delUser(row.userId)
    ElMessage.success('删除成功')
    getList()
  })
}

const handleStatusChange = (row) => {
  const text = row.status === '0' ? '启用' : '停用'
  ElMessageBox.confirm('确认要"' + text + '""' + row.userName + '"用户吗？').then(() => {
    return updateUser({ userId: row.userId, status: row.status })
  }).then(() => {
    ElMessage.success(text + '成功')
  }).catch(() => {
    row.status = row.status === '0' ? '1' : '0'
  })
}

const reset = () => {
  form.value = {
    userId: undefined,
    userName: '',
    nickName: '',
    password: '',
    deptId: undefined,
    sex: '0',
    status: '0'
  }
}

const cancel = () => {
  open.value = false
}

onMounted(() => {
  getList()
  getDeptTree()
})
</script>

<style scoped>
.side-card {
  min-height: calc(100vh - 120px);
}

.mt-10 {
  margin-top: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
