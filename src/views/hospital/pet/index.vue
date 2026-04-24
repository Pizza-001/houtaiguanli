<template>
  <div class="app-container">
    <div class="search-bar-container">
      <el-input 
        v-model="queryParams.name" 
        placeholder="全局搜索宠物或主人姓名..." 
        prefix-icon="Search"
        class="global-search"
        @keyup.enter="getList"
        clearable
      ></el-input>
    </div>

    <el-card class="box-card modern-card">
      <template #header>
        <div class="card-header">
          <div class="header-titles">
            <span class="title-text">全部宠物档案 ({{ total }})</span>
            <span class="sub-text">管理医院内部所有注册的宠物健康及归属人信息。</span>
          </div>
          <div class="action-btn-group">
            <el-button class="btn-refresh" :icon="Refresh" @click="getList">刷新数据</el-button>
            <el-button type="primary" class="btn-add" :icon="Plus" @click="handleAdd">新增档案</el-button>
          </div>
        </div>
      </template>

      <!-- 树形展示比例：主用户 -> 旗下宠物 -->
      <el-table 
        v-loading="loading" 
        :data="treePetList" 
        class="sleek-table" 
        row-key="id"
        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
        default-expand-all
      >
        <el-table-column label="归属主体与宠物" min-width="280">
          <template #default="scope">
            <div v-if="scope.row.isGroup" class="owner-group-row">
               <el-icon class="owner-icon"><UserFilled /></el-icon>
               <span class="owner-label">宠物主:</span>
               <span class="owner-name text-primary">{{ scope.row.name }}</span>
               <el-tag size="small" round effect="plain" class="pet-count-tag">{{ scope.row.children.length }} 只宠物</el-tag>
            </div>
            <div v-else class="pet-item-row">
              <el-avatar class="pet-avatar" :size="36" :src="scope.row.avatar ? (baseUrl + scope.row.avatar) : ''">
                {{ scope.row.name ? scope.row.name.charAt(0) : '宠' }}
              </el-avatar>
              <div class="info-text">
                <div class="pet-name">{{ scope.row.name || '未知宠物' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="联系电话" min-width="150" align="left">
          <template #default="scope">
            <span class="phone-text">{{ scope.row.phone || (scope.row.children?.[0]?.phone) || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="种类/品种" min-width="160" align="left">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="species-tag">
              <span v-if="scope.row.type === '犬类' || scope.row.type === '狗'">🐶</span>
              <span v-else-if="scope.row.type === '鸟类'">🕊️</span>
              <span v-else-if="scope.row.type === '异宠'">🦎</span>
              <span v-else-if="scope.row.type === '猫类'">🐱</span>
              {{ scope.row.type }} - {{ scope.row.breed || '基础' }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="档案状态" min-width="150" align="left">
          <template #default="scope">
            <div v-if="!scope.row.isGroup"
              class="status-pill"
              :class="{'status-observing': scope.row.treatmentStatus === '观察中', 'status-recovered': scope.row.treatmentStatus === '已康复'}"
            >
              <span class="dot"></span>
              {{ scope.row.treatmentStatus || '正常' }}
            </div>
            <span v-else class="text-muted" style="font-size: 12px;">已实名归属</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="op-buttons">
              <div class="icon-btn edit-btn" @click="handleUpdate(scope.row)">
                <el-icon><EditPen /></el-icon>
              </div>
              <div class="icon-btn delete-btn" @click="handleDelete(scope.row)">
                <el-icon><Delete /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList"/>
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body class="premium-dialog">
      <el-form ref="petRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24" class="avatar-col">
            <el-form-item label="萌宠影像" prop="avatar">
              <el-upload
                class="avatar-uploader"
                :action="uploadImgUrl"
                :show-file-list="false"
                :on-success="handleUploadSuccess"
                :before-upload="beforeUpload"
                :headers="headers"
              >
                <img v-if="form.avatar" :src="baseUrl + form.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
          
          <el-col :span="24">
            <el-divider content-position="left">基础信息</el-divider>
          </el-col>

          <el-col :span="12">
            <el-form-item label="宠物名字" prop="name">
              <el-input v-model="form.name" placeholder="请输入名字" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主人姓名" prop="ownerName">
              <el-input v-model="form.ownerName" placeholder="如: 张三" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="电话号码" />
            </el-form-item>
          </el-col>
           <el-col :span="12">
            <el-form-item label="绑定账户" prop="userId">
              <el-select
                v-model="form.userId"
                filterable
                remote
                reserve-keyword
                placeholder="搜索会员手机号"
                :remote-method="remoteSearchMember"
                :loading="memberLoading"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in memberOptions"
                  :key="item.userId"
                  :label="item.userId + ' - ' + (item.level === '0' ? '普通' : 'VIP')"
                  :value="item.userId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="主分类" prop="type">
              <el-select v-model="form.type" placeholder="如: 犬类" style="width: 100%">
                <el-option label="猫类" value="猫类" />
                <el-option label="犬类" value="犬类" />
                <el-option label="鸟类" value="鸟类" />
                <el-option label="异宠" value="异宠" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="治疗状态" prop="treatmentStatus">
               <el-select v-model="form.treatmentStatus" placeholder="当前状态" style="width: 100%">
                <el-option label="观察中" value="观察中" />
                <el-option label="已康复" value="已康复" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="最后就诊" prop="lastVisitTime">
              <el-date-picker clearable v-model="form.lastVisitTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择就诊时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="特征备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="填写宠物的特殊性格、过敏史等..." />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel" round>取 消</el-button>
          <el-button type="primary" @click="submitForm" round>同步并保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, EditPen, Delete, UserFilled } from '@element-plus/icons-vue'
import { listPet, getPet, delPet, addPet, updatePet } from "@/api/hospital/pet";
import { listMember } from "@/api/hospital/member";
import { getToken } from '@/utils/auth';

const baseUrl = import.meta.env.VITE_APP_BASE_API;
const uploadImgUrl = ref(import.meta.env.VITE_APP_BASE_API + "/common/upload");
const headers = ref({ Authorization: 'Bearer ' + getToken() });

const petList = ref([]);
const open = ref(false);
const loading = ref(true);
const memberLoading = ref(false);
const memberOptions = ref([]);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
  },
  rules: {
    name: [{ required: true, message: "宠物昵称不能为空", trigger: "blur" }],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 计算属性：将列表转换为树形结构（按主人分组） */
const treePetList = computed(() => {
  const groups = {};
  const ungrouped = [];

  petList.value.forEach(pet => {
    // 优先使用 userId 作为分组标识，如果没有则使用 ownerName + phone
    const groupKey = pet.userId ? `user_${pet.userId}` : (pet.ownerName ? `owner_${pet.ownerName}_${pet.phone}` : null);
    
    if (groupKey) {
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          name: pet.ownerName || '神秘主人',
          phone: pet.phone,
          isGroup: true,
          children: []
        };
      }
      // 给宠物数据也加一个 id (Tree 要求 row-key 统一)
      groups[groupKey].children.push({ ...pet, id: pet.petId });
    } else {
      ungrouped.push({ ...pet, id: pet.petId });
    }
  });

  return [...Object.values(groups), ...ungrouped];
});

/** 远程搜索会员 */
function remoteSearchMember(query) {
  if (query !== "") {
    memberLoading.value = true;
    listMember({ phoneNumber: query }).then(response => {
      memberOptions.value = response.data || [];
      memberLoading.value = false;
    });
  } else {
    memberOptions.value = [];
  }
}

function getList() {
  loading.value = true;
  listPet(queryParams.value).then(response => {
    petList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function cancel() {
  open.value = false;
  reset();
}

function reset() {
  form.value = {
    petId: null, userId: null, name: null, avatar: null, type: null, breed: null, gender: '0', birthday: null, weight: 0, healthStatus: '健康', remark: null,
    ownerName: null, phone: null, treatmentStatus: '观察中', lastVisitTime: null
  };
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增档案";
}

function handleUpdate(row) {
  reset();
  const petId = row.petId;
  getPet(petId).then(response => {
    form.value = response.data;
    if (form.value.userId) {
       // Pre-fill member options for the select
       memberOptions.value = [{ userId: form.value.userId }];
    }
    open.value = true;
    title.value = "修编宠物资料";
  });
}

function submitForm() {
  if (form.value.petId != null) {
    updatePet(form.value).then(response => {
      ElMessage.success("修改成功");
      open.value = false;
      getList();
    });
  } else {
    addPet(form.value).then(response => {
      ElMessage.success("新增成功");
      open.value = false;
      getList();
    });
  }
}

function handleDelete(row) {
  const petIds = row.petId;
  ElMessageBox.confirm('是否确认移除该宠物档案?', "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(function() {
      return delPet(petIds);
    }).then(() => {
      getList();
      ElMessage.success("删除成功");
    })
}

function handleUploadSuccess(res, file) {
  if (res.code === 200) {
    form.value.avatar = res.fileName;
  } else {
    ElMessage.error(res.msg);
  }
}
function beforeUpload(file) {
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) ElMessage.error('上传头像大小不能超过 5MB!');
  return isLt5M;
}

function parseTime(time, pattern) {
  if (arguments.length === 0 || !time) return null;
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}';
  let date;
  if (typeof time === 'object') {
    date = time;
  } else {
    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
      time = parseInt(time);
    } else if (typeof time === 'string') {
      time = time.replace(new RegExp(/-/gm), '/').replace('T', ' ').replace(new RegExp(/\.[\d]{3}/gm), '');
    }
    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000;
    }
    date = new Date(time);
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  };
  return format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key];
    if (key === 'a') return ['日', '一', '二', '三', '四', '五', '六'][value];
    if (result.length > 0 && value < 10) value = '0' + value;
    return value || 0;
  });
}

onMounted(() => {
  getList();
})
</script>

<style scoped>
.app-container {
  padding: 30px;
  background: #FAFBFC;
  min-height: calc(100vh - 84px);
  position: relative;
}

.search-bar-container {
  margin-bottom: 24px;
}

.global-search {
  width: 400px;
}
.global-search :deep(.el-input__wrapper) {
  background-color: #F0F2F5;
  border-radius: 20px;
  box-shadow: none !important;
  padding: 0 20px;
  height: 40px;
}
.global-search :deep(.el-input__inner) {
  font-size: 14px;
}

.modern-card {
  background: #FFFFFF;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 10px;
}
.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.title-text {
  font-size: 18px;
  font-weight: 700;
  color: #1f2f3d;
}
.sub-text {
  font-size: 13px;
  color: #8c939d;
}

.action-btn-group {
  display: flex;
  gap: 12px;
}
.btn-refresh {
  border-radius: 8px;
}
.btn-add {
  border-radius: 8px;
  background-color: #5D5FEF;
  border-color: #5D5FEF;
}
.btn-add:hover {
  background-color: #4a4cb8;
  border-color: #4a4cb8;
}

/* Table resets */
.sleek-table {
  width: 100%;
}
.sleek-table :deep(th.el-table__cell) {
  background-color: transparent;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}
.sleek-table :deep(td.el-table__cell) {
  border-bottom: 1px dashed #ebeef5;
}

/* Pet Info Column */
.pet-master-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.pet-avatar {
  background: #f0f2f5;
  border-radius: 12px;
}
.info-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pet-name {
  font-weight: 700;
  color: #303133;
  font-size: 15px;
}
.master-name {
  font-size: 12px;
  color: #909399;
}

/* Texts */
.phone-text, .date-text, .species-tag {
  color: #606266;
  font-size: 14px;
}

/* Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-observing {
  background-color: #FFF8E6;
  color: #FAAD14;
}
.status-observing .dot {
  background-color: #FAAD14;
}
.status-recovered {
  background-color: #F4F4F5;
  color: #909399;
}
.status-recovered .dot {
  background-color: #909399;
}

/* Action Buttons */
.op-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #F4F4F5;
}
.edit-btn {
  color: #E6A23C;
}
.edit-btn:hover {
  background-color: #FDF6EC;
}
.delete-btn {
  color: #F56C6C;
}
.delete-btn:hover {
  background-color: #FEF0F0;
}

/* Form Styles */
.avatar-uploader .el-upload { border: 1px dashed #d9d9d9; border-radius: 8px; cursor: pointer; position: relative; overflow: hidden; }
.avatar-uploader .el-upload:hover { border-color: #409EFF; }
.avatar-uploader-icon { font-size: 28px; color: #8c939d; width: 120px; height: 120px; line-height: 120px; text-align: center; }
.avatar { width: 120px; height: 120px; display: block; object-fit: cover; }
/* Tree Styles */
.owner-group-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #303133;
}
.owner-icon {
  font-size: 18px;
  color: #5D5FEF;
}
.owner-name {
  margin-right: 8px;
}
.pet-count-tag {
  background-color: #F0F2FF !important;
  color: #5D5FEF !important;
  border: none !important;
}
.pet-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 20px;
}
.pet-name {
  font-weight: 700;
  color: #606266;
}
.text-muted { color: #909399; }
.text-primary { color: #5D5FEF; }
</style>
