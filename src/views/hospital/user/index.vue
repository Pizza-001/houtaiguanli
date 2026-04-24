<template>
  <div class="app-container">
    <!-- 用户列表 -->
    <el-card shadow="hover" class="query-card mb-20">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="用户名称" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phonenumber">
          <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
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
            <span>系统用户管理</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" plain icon="Plus" @click="handleAdd">新增用户</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="userList" stripe class="modern-table">
        <el-table-column label="编号" prop="userId" width="80" align="center" />
        <el-table-column label="用户名称" prop="userName" :show-overflow-tooltip="true" />
        <el-table-column label="昵称" prop="nickName" :show-overflow-tooltip="true" />
        <el-table-column label="手机" prop="phonenumber" width="150" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="180" align="center" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="success" icon="Gift" @click="handleGrantCoupon(scope.row)">发券</el-button>
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

    <!-- 用户弹窗 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body class="premium-dialog">
      <el-form ref="userRef" :model="form" :rules="rules" label-width="90px" class="mt-20">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.userId == undefined">
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="用户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.userId == undefined">
            <el-form-item label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="用户密码" type="password" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择" class="w100">
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

    <!-- 发放优惠券弹窗 -->
    <el-dialog title="发放优惠券" v-model="grantCouponOpen" width="500px" append-to-body class="premium-dialog">
      <el-form label-width="100px" class="mt-20">
        <el-form-item label="受众用户">
          <el-input :value="currentGrantUser.userName" disabled />
        </el-form-item>
        <el-form-item label="优惠券模版">
          <el-select v-model="selectedCouponId" placeholder="请选择优惠券模板" class="w100">
            <el-option
              v-for="item in couponOptions"
              :key="item.couponId"
              :label="`${item.title} (满${item.minSpend}减${item.amount})`"
              :value="item.couponId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="confirmGrantCoupon" :loading="grantLoading">确 定</el-button>
          <el-button @click="grantCouponOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "User"
}
</script>

<script setup>
import { ref, onMounted } from 'vue'
import { listUser, getUser, delUser, addUser, updateUser } from '@/api/user'
import { listCoupon, grantCoupon } from '@/api/hospital/billing'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const userList = ref([])
const total = ref(0)
const title = ref('')
const open = ref(false)

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  userName: undefined,
  phonenumber: undefined
})

const form = ref({})
const rules = {
  userName: [{ required: true, message: '用户名称不能为空', trigger: 'blur' }],
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '用户密码不能为空', trigger: 'blur' }]
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

const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    userName: undefined,
    phonenumber: undefined
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

// 发放优惠券相关
const grantCouponOpen = ref(false)
const grantLoading = ref(false)
const currentGrantUser = ref({})
const selectedCouponId = ref(undefined)
const couponOptions = ref([])

const handleGrantCoupon = async (row) => {
  currentGrantUser.value = row
  selectedCouponId.value = undefined
  grantCouponOpen.value = true
  // 加载优惠券列表
  const res = await listCoupon({ status: '0' })
  couponOptions.value = res.data
}

const confirmGrantCoupon = async () => {
  if (!selectedCouponId.value) {
    return ElMessage.warning('请选择优惠券')
  }
  grantLoading.value = true
  try {
    await grantCoupon(currentGrantUser.value.userId, selectedCouponId.value)
    ElMessage.success('优惠券发放成功')
    grantCouponOpen.value = false
  } catch (err) {
    console.error(err)
  } finally {
    grantLoading.value = false
  }
}

const reset = () => {
  form.value = {
    userId: undefined,
    userName: '',
    nickName: '',
    password: '',
    sex: '0',
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
  color: #10b981;
}

.modern-table {
  border-radius: 8px;
  overflow: hidden;
}

.premium-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.w100 { width: 100%; }
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
</style>
