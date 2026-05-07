<template>
  <div class="app-container board-container">
    <!-- 头部统计大屏 -->
    <el-row :gutter="20" class="stat-panel">
      <el-col :span="6">
        <div class="stat-card blue-glow">
          <div class="stat-title">总床位数</div>
          <div class="stat-value">{{ boardData.totalBeds || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green-glow">
          <div class="stat-title">使用中床位</div>
          <div class="stat-value">{{ boardData.occupiedBeds || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card red-glow">
          <div class="stat-title">特级/重症看护</div>
          <div class="stat-value">{{ boardData.intensiveCareCount || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple-glow">
          <div class="stat-title">今日待手术/进行中</div>
          <div class="stat-value">{{ boardData.pendingSurgeryCount || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 主体区域 -->
    <el-row :gutter="20" class="main-panel">
      <!-- 左侧：床位矩阵看板 -->
      <el-col :span="16">
        <div class="panel-box">
          <div class="panel-header">
            <span class="title">病区床位实时白板</span>
            <div>
              <el-button type="primary" size="small" icon="Operation" @click="handleManageSurgery">手术排班管理</el-button>
              <el-button type="info" size="small" icon="Refresh" @click="fetchData" circle />
            </div>
          </div>
          <div class="bed-matrix">
            <div class="bed-card" 
                 v-for="bed in boardData.beds" :key="bed.bedId"
                 :class="{'is-occupied': bed.status === '1', 'is-alert': bed.inpatient && bed.inpatient.careLevel === '0'}">
              <div class="bed-header">
                <span class="bed-no">{{ bed.wardNo }} - {{ bed.bedNo }}</span>
                <el-tag size="small" :type="bed.status === '1' ? 'success' : 'info'">
                  {{ bed.status === '1' ? '占用' : '空闲' }}
                </el-tag>
              </div>
              <div class="bed-body" v-if="bed.inpatient">
                <div class="patient-name">
                  {{ bed.inpatient.petName }} ({{ bed.inpatient.ownerName }})
                  <!-- 出院结算按钮 -->
                  <el-button type="success" size="small" link class="fr" @click="handleDischarge(bed.inpatient)" title="办理出院并结算">出院</el-button>
                </div>
                <div class="info-line"><span>主治:</span> {{ bed.inpatient.doctorName }}</div>
                <div class="info-line"><span>护理:</span> {{ bed.inpatient.nurseName }}</div>
                <div class="vitals">
                  <span class="vital-item" title="心率">❤️ {{ bed.inpatient.heartRate }}</span>
                  <span class="vital-item" title="体温">🌡️ {{ bed.inpatient.temperature }}°C</span>
                </div>
                <div class="quick-actions">
                  <el-button type="primary" size="small" link icon="Document" @click="jumpToEMR(bed.inpatient)">病历(SOAP)</el-button>
                  <el-button type="warning" size="small" link icon="Picture" @click="jumpToPACS(bed.inpatient)">影像(PACS)</el-button>
                </div>
              </div>
              <div class="bed-body empty" v-else>
                <div class="empty-state">
                  <el-empty description="待收治" :image-size="30"></el-empty>
                  <el-button type="primary" plain size="small" @click="handleAddAdmit(bed)" style="margin-top: -10px;">办理入院</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：今日手术排班流 -->
      <el-col :span="8">
        <div class="panel-box">
          <div class="panel-header">
            <span class="title">今日手术流 (OR Schedule)</span>
          </div>
          <div class="surgery-timeline">
            <el-timeline v-if="boardData.todaySurgeries && boardData.todaySurgeries.length > 0">
              <el-timeline-item 
                v-for="surgery in boardData.todaySurgeries" 
                :key="surgery.surgeryId"
                :type="getSurgeryColor(surgery.status)"
                :timestamp="formatTime(surgery.startTime) + ' - ' + formatTime(surgery.endTime)"
                placement="top">
                <el-card class="surgery-card">
                  <h4>{{ surgery.surgeryName }}</h4>
                  <p><strong>患者:</strong> {{ surgery.petName || '未知' }}</p>
                  <p><strong>手术室:</strong> {{ surgery.roomNo }}</p>
                  <p><strong>主刀:</strong> {{ surgery.surgeon }} | <strong>麻醉:</strong> {{ surgery.anesthesiologist }}</p>
                  <div class="tags">
                    <el-tag size="small" :type="getRiskColor(surgery.riskLevel)">风险: {{ surgery.riskLevel }}级</el-tag>
                    <el-tag size="small" effect="dark" :type="getSurgeryColor(surgery.status)">{{ getStatusText(surgery.status) }}</el-tag>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="今日无手术安排"></el-empty>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 手术管理弹窗 (CRUD) -->
    <el-dialog title="手术排班管理" v-model="surgeryOpen" width="1000px" append-to-body>
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAddSurgery" v-hasPermi="['hospital:surgery:add']">新增手术</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="surgeryLoading" :data="surgeryList" @selection-change="handleSurgerySelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="手术名称" align="center" prop="surgeryName" />
        <el-table-column label="患者(宠物)" align="center" prop="petName">
          <template #default="scope">
            <span>{{ scope.row.petName || '未知(ID:'+scope.row.inpatientId+')' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手术室" align="center" prop="roomNo" />
        <el-table-column label="主刀医生" align="center" prop="surgeon" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <el-tag :type="getSurgeryColor(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预计开始" align="center" prop="startTime" width="160">
          <template #default="scope">
            <span>{{ scope.row.startTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button size="small" type="primary" link icon="Edit" @click="handleUpdateSurgery(scope.row)" v-hasPermi="['hospital:surgery:edit']">修改</el-button>
            <el-button size="small" type="danger" link icon="Delete" @click="handleDeleteSurgery(scope.row)" v-hasPermi="['hospital:surgery:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="surgeryTotal>0" :total="surgeryTotal" v-model:page="surgeryQueryParams.pageNum" v-model:limit="surgeryQueryParams.pageSize" @pagination="getSurgeryList"/>
    </el-dialog>

    <!-- 添加或修改手术对话框 -->
    <el-dialog :title="formTitle" v-model="formOpen" width="600px" append-to-body>
      <el-form ref="surgeryRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="关联住院ID" prop="inpatientId">
          <el-input v-model="form.inpatientId" placeholder="请输入患者住院记录ID" maxlength="18" />
        </el-form-item>
        <el-form-item label="手术名称" prop="surgeryName">
          <el-input v-model="form.surgeryName" placeholder="例如: 绝育术、骨折内固定术" />
        </el-form-item>
        <el-form-item label="手术室编号" prop="roomNo">
          <el-input v-model="form.roomNo" placeholder="如: OR-1" />
        </el-form-item>
        <el-form-item label="主刀医生" prop="surgeon">
          <el-input v-model="form.surgeon" placeholder="请输入医生姓名" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="风险等级" prop="riskLevel">
              <el-select v-model="form.riskLevel" placeholder="请选择">
                <el-option label="I级 (低风险)" value="1"></el-option>
                <el-option label="II级 (中等)" value="2"></el-option>
                <el-option label="III级 (高风险)" value="3"></el-option>
                <el-option label="IV级 (极高危)" value="4"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择">
                <el-option label="待手术" value="0"></el-option>
                <el-option label="进行中" value="1"></el-option>
                <el-option label="术后复苏" value="2"></el-option>
                <el-option label="已完成" value="3"></el-option>
                <el-option label="已取消" value="4"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="起止时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="例如：备血200ml" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 办理入院对话框 -->
    <el-dialog title="办理入院 (收治患者)" v-model="admitOpen" width="500px" append-to-body>
      <el-form ref="admitRef" :model="admitForm" :rules="admitRules" label-width="100px">
        <el-form-item label="床位编号">
          <el-input v-model="admitForm.wardAndBed" disabled />
        </el-form-item>
        <el-form-item label="选择患宠" prop="petName">
          <el-select 
            v-model="admitForm.petName" 
            filterable 
            placeholder="搜索并选择就诊宠物" 
            @change="handlePetChange"
            style="width: 100%"
          >
            <el-option
              v-for="pet in petList"
              :key="pet.petId"
              :label="pet.name + ' (' + (pet.type || '未知品种') + ')'"
              :value="pet.name"
            >
              <span style="float: left">{{ pet.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">主: {{ pet.ownerName || pet.userId || '未知' }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="主人姓名" prop="ownerName">
          <el-input v-model="admitForm.ownerName" placeholder="自动带出或手动输入" />
        </el-form-item>
        <el-form-item label="主治医生" prop="doctorName">
          <el-input v-model="admitForm.doctorName" placeholder="请输入医生姓名" />
        </el-form-item>
        <el-form-item label="责任护士" prop="nurseName">
          <el-input v-model="admitForm.nurseName" placeholder="请输入护士姓名" />
        </el-form-item>
        <el-form-item label="护理级别" prop="careLevel">
          <el-select v-model="admitForm.careLevel" placeholder="请选择">
            <el-option label="特级护理 (ICU)" value="0"></el-option>
            <el-option label="一级护理" value="1"></el-option>
            <el-option label="二级护理" value="2"></el-option>
            <el-option label="三级护理" value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="饮食要求" prop="dietReq">
          <el-input v-model="admitForm.dietReq" placeholder="如: 术前禁食禁水12h" />
        </el-form-item>
        <el-form-item label="入院备注" prop="remark">
          <el-input v-model="admitForm.remark" type="textarea" placeholder="例如：车祸骨折，准备手术" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitAdmit">办理入院</el-button>
          <el-button @click="admitOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { getBoardData, listSurgery, getSurgery, addSurgery, updateSurgery, delSurgery } from '@/api/hospital/surgery'
import { dischargeInpatient, admitInpatient } from '@/api/hospital/inpatient'
import { listPet } from '@/api/hospital/pet'
import { ElMessage, ElMessageBox } from 'element-plus'

const { proxy } = getCurrentInstance()
const router = useRouter()

const boardData = ref({
  beds: [],
  todaySurgeries: [],
  totalBeds: 0,
  occupiedBeds: 0,
  intensiveCareCount: 0,
  pendingSurgeryCount: 0
})

// === 白板与出院/入院逻辑 ===
const admitOpen = ref(false)
const admitForm = ref({})
const petList = ref([])

const admitRules = {
  petName: [{ required: true, message: "患宠昵称不能为空", trigger: "change" }],
  ownerName: [{ required: true, message: "主人姓名不能为空", trigger: "blur" }],
  doctorName: [{ required: true, message: "主治医生不能为空", trigger: "blur" }]
}

const loadPets = () => {
  listPet({ pageSize: 1000 }).then(res => {
    petList.value = res.rows || []
  })
}

const handlePetChange = (val) => {
  const selectedPet = petList.value.find(p => p.name === val)
  if (selectedPet) {
    admitForm.value.ownerName = selectedPet.ownerName || ('用户 ' + selectedPet.userId)
  }
}

const handleAddAdmit = (bed) => {
  admitForm.value = {
    bedId: bed.bedId,
    wardAndBed: bed.wardNo + ' - ' + bed.bedNo,
    petName: '',
    ownerName: '',
    doctorName: '',
    nurseName: '',
    careLevel: '2',
    dietReq: '',
    remark: ''
  }
  loadPets()
  admitOpen.value = true
}

const submitAdmit = () => {
  proxy.$refs["admitRef"].validate(valid => {
    if (valid) {
      admitInpatient(admitForm.value).then(res => {
        ElMessage.success("办理入院成功！")
        admitOpen.value = false
        fetchData()
      })
    }
  })
}

const jumpToEMR = (inpatient) => {
  router.push({ path: '/hospital/record', query: { petId: inpatient.inpatientId } })
}

const jumpToPACS = (inpatient) => {
  router.push({ path: '/hospital/pacs', query: { petId: inpatient.inpatientId } })
}

const fetchData = () => {
  getBoardData().then(res => {
    boardData.value = res.data
  })
}

const handleDischarge = (inpatient) => {
  ElMessageBox.confirm(
    `是否确认给患宠 [${inpatient.petName}] 办理出院？系统将自动核算住院与手术费用并生成账单。`,
    '出院结算确认',
    {
      confirmButtonText: '确定结算',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    dischargeInpatient(inpatient.inpatientId).then(res => {
      ElMessage.success(res.msg || '出院成功并已生成账单！')
      fetchData() // 刷新看板，病床将变为空闲
    })
  }).catch(() => {})
}

// === 手术管理逻辑 (CRUD) ===
const surgeryOpen = ref(false)
const surgeryLoading = ref(false)
const surgeryList = ref([])
const surgeryTotal = ref(0)
const surgeryQueryParams = ref({
  pageNum: 1,
  pageSize: 10,
  surgeryName: undefined,
  status: undefined
})
const surgeryIds = ref([])

const formOpen = ref(false)
const formTitle = ref('')
const form = ref({})
const dateRange = ref([])

const rules = ref({
  inpatientId: [{ required: true, message: "关联住院ID不能为空", trigger: "blur" }],
  surgeryName: [{ required: true, message: "手术名称不能为空", trigger: "blur" }],
  roomNo: [{ required: true, message: "手术室编号不能为空", trigger: "blur" }],
  surgeon: [{ required: true, message: "主刀医生不能为空", trigger: "blur" }]
})

const handleManageSurgery = () => {
  surgeryOpen.value = true
  getSurgeryList()
}

const getSurgeryList = () => {
  surgeryLoading.value = true
  listSurgery(surgeryQueryParams.value).then(response => {
    surgeryList.value = response.rows
    surgeryTotal.value = response.total
    surgeryLoading.value = false
  })
}

const handleSurgerySelectionChange = (selection) => {
  surgeryIds.value = selection.map(item => item.surgeryId)
}

const reset = () => {
  form.value = {
    surgeryId: undefined,
    inpatientId: undefined,
    surgeryName: undefined,
    roomNo: undefined,
    surgeon: undefined,
    riskLevel: '2',
    status: '0',
    remark: undefined
  }
  dateRange.value = []
}

const cancel = () => {
  formOpen.value = false
  reset()
}

const handleAddSurgery = () => {
  reset()
  formTitle.value = "新增手术排班"
  formOpen.value = true
}

const handleUpdateSurgery = (row) => {
  reset()
  getSurgery(row.surgeryId).then(response => {
    form.value = response.data
    dateRange.value = [form.value.startTime, form.value.endTime]
    formTitle.value = "修改手术排班"
    formOpen.value = true
  })
}

const submitForm = () => {
  proxy.$refs["surgeryRef"].validate(valid => {
    if (valid) {
      if (dateRange.value && dateRange.value.length === 2) {
        form.value.startTime = dateRange.value[0]
        form.value.endTime = dateRange.value[1]
      } else {
        ElMessage.error("请选择起止时间")
        return
      }
      if (form.value.surgeryId != undefined) {
        updateSurgery(form.value).then(response => {
          ElMessage.success("修改成功")
          formOpen.value = false
          getSurgeryList()
          fetchData() // 刷新看板同步状态
        })
      } else {
        addSurgery(form.value).then(response => {
          ElMessage.success("新增成功")
          formOpen.value = false
          getSurgeryList()
          fetchData() // 刷新看板同步状态
        })
      }
    } else {
      ElMessage.error("请完善表单必填项")
    }
  })
}

const handleDeleteSurgery = (row) => {
  const ids = row.surgeryId || surgeryIds.value
  ElMessageBox.confirm('是否确认删除所选手术数据项？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(function() {
    return delSurgery(ids)
  }).then(() => {
    getSurgeryList()
    fetchData()
    ElMessage.success("删除成功")
  }).catch(() => {})
}

// === 格式化辅助方法 ===
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.substring(11, 16)
}

const getSurgeryColor = (status) => {
  const map = { '0': 'info', '1': 'warning', '2': 'primary', '3': 'success', '4': 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { '0': '待手术', '1': '进行中', '2': '术后复苏', '3': '已完成', '4': '已取消' }
  return map[status] || '未知'
}

const getRiskColor = (level) => {
  if (level === '4' || level === '3') return 'danger'
  if (level === '2') return 'warning'
  return 'info'
}

onMounted(() => {
  fetchData()
  setInterval(() => {
    if(!surgeryOpen.value) fetchData() // 只有没打开弹窗时才自动刷新
  }, 30000)
})
</script>

<style scoped lang="scss">
.board-container {
  padding: 20px;
  background-color: #f4f7f9;
  min-height: calc(100vh - 84px);
}

.stat-panel {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
  }

  .stat-title {
    font-size: 14px;
    color: #606266;
    margin-bottom: 10px;
    font-weight: bold;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 900;
    color: #303133;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
  }
}

.blue-glow::after { background: #409EFF; }
.green-glow::after { background: #67C23A; }
.red-glow::after { background: #F56C6C; }
.purple-glow::after { background: #909399; }

.panel-box {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  height: calc(100vh - 220px);
  overflow-y: auto;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 15px;

    .title {
      font-size: 18px;
      font-weight: bold;
      color: #303133;
      border-left: 4px solid #409EFF;
      padding-left: 10px;
    }
  }
}

.bed-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 15px;
}

.bed-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;

  &.is-occupied {
    background: #fff;
    border-color: #a0cfff;
    box-shadow: 0 2px 12px rgba(64,158,255,0.1);
  }

  &.is-alert {
    border-color: #f56c6c;
    box-shadow: 0 2px 12px rgba(245,108,108,0.2);
    animation: blinkBorder 2s infinite;
  }

  .bed-header {
    padding: 10px 15px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0,0,0,0.02);

    .bed-no {
      font-weight: bold;
      font-size: 14px;
      color: #303133;
    }
  }

  .bed-body {
    padding: 15px;
    min-height: 140px;

    &.empty {
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0.8;
      
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    }

    .patient-name {
      font-size: 16px;
      font-weight: bold;
      color: #409EFF;
      margin-bottom: 8px;
    }
    
    .fr {
      float: right;
    }

    .info-line {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
      span {
        color: #909399;
      }
    }

    .vitals {
      margin-top: 10px;
      display: flex;
      gap: 10px;
      .vital-item {
        background: #fdf6ec;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: #e6a23c;
      }
    }

    .quick-actions {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed #e4e7ed;
      display: flex;
      justify-content: flex-start;
      gap: 15px;
    }
  }
}

@keyframes blinkBorder {
  0% { border-color: #f56c6c; }
  50% { border-color: #fef0f0; }
  100% { border-color: #f56c6c; }
}

.surgery-timeline {
  padding-right: 10px;
}

.surgery-card {
  h4 {
    margin: 0 0 10px 0;
    color: #303133;
  }
  p {
    margin: 5px 0;
    font-size: 13px;
    color: #606266;
  }
  .tags {
    margin-top: 10px;
    display: flex;
    gap: 8px;
  }
}
</style>
