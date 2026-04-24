<template>
  <div class="soap-container">
    <!-- 顶部状态与全局操作 -->
    <div class="page-header-actions">
       <div class="header-left">
          <span class="page-title">结构化病历工作站</span>
          <el-tag effect="plain" type="info" class="m-l-10">专业 SOAP 诊断模式</el-tag>
       </div>
       <div class="header-right">
          <el-button @click="handleHistory">
             <el-icon class="m-r-5"><Clock /></el-icon>历史记录
          </el-button>
          <el-button type="primary" size="large" @click="submitForm" :loading="submitLoading" class="save-btn">
             <el-icon class="m-r-5"><Checked /></el-icon>签发保存病历
          </el-button>
       </div>
    </div>

    <el-row :gutter="16">
      <!-- 1. 今日就诊清单 -->
      <el-col :span="5">
        <el-card class="queue-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">今日待诊</span>
              <el-badge :value="queueList.length" :max="99" class="m-l-10" />
            </div>
          </template>
          <div class="queue-list scroller">
            <div 
              v-for="item in queueList" 
              :key="item.petId" 
              class="queue-item" 
              :class="{ active: currentPet && currentPet.petId === item.petId }"
              @click="handleSelectPet(item)"
            >
              <div class="item-main">
                <span class="pet-name">{{ item.name }}</span>
                <el-tag size="mini" :type="getStatusType(item.treatmentStatus)">{{ item.treatmentStatus || '就诊中' }}</el-tag>
              </div>
              <div class="item-sub">
                 <span class="owner">主: {{ item.ownerName || '用户' + item.userId }}</span>
                 <span class="time">{{ formatTime(item.lastVisitTime) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 2. SOAP 编辑区 -->
      <el-col :span="13">
        <el-card v-if="currentPet" class="diagnosis-card" shadow="never">
          <!-- 患宠档案条 -->
          <div class="pet-banner">
             <div class="banner-top">
                <div class="pet-core">
                   <span class="name">{{ currentPet.name }}</span>
                   <span class="species">({{ currentPet.type || '犬' }})</span>
                   <el-tag size="mini" type="warning" effect="dark" class="m-l-10">复诊</el-tag>
                </div>
                <div class="pet-id-box">
                   <span class="label">档案号:</span>
                   <span class="id">{{ currentPet.petId }}</span>
                </div>
             </div>
             <div class="banner-bottom">
                 <div class="info-group weight-input-group">
                   <span class="label">当日患宠体重:</span>
                   <div class="weight-ctrl">
                      <el-input-number v-model="form.weightAtVisit" :precision="2" :step="0.1" size="small" />
                      <span class="unit">KG</span>
                   </div>
                 </div>
             </div>
          </div>

          <!-- SOAP 表单 -->
          <div class="soap-body">
            <div class="section-title">
               <el-icon><EditPen /></el-icon> 标准 SOAP 临床记录
            </div>
            
            <div class="soap-item subjective">
               <div class="field-label">S (Subjective) 主观叙述 <span>- 现病史/精神状态</span></div>
               <el-input v-model="form.subjective" type="textarea" :rows="4" placeholder="连续呕吐两天，精神萎靡，食欲不振..." />
            </div>

            <div class="soap-item objective">
               <div class="field-label">O (Objective) 客观检查 <span>- 临床体检/TPR数据</span></div>
               <el-input v-model="form.objective" type="textarea" :rows="4" placeholder="T 39.5℃, P 120次/分, R 40次/分, CRT < 2s..." />
            </div>

            <div class="soap-item assessment">
               <div class="field-label">A (Assessment) 分析评估 <span>- 临床最终诊断</span></div>
               <el-input v-model="form.assessment" type="textarea" :rows="3" placeholder="初步诊断建议..." />
            </div>

            <div class="soap-item plan">
               <div class="field-label">P (Plan) 治疗计划 <span>- 后续医嘱</span></div>
               <el-input v-model="form.plan" type="textarea" :rows="3" placeholder="后续治疗方案及家庭指导建议..." />
            </div>
          </div>
        </el-card>
        <div v-else class="empty-diagnosis">
           <el-empty description="请从左侧列表选择宠物开始坐诊" />
        </div>
      </el-col>

      <!-- 3. 电子处方区 -->
      <el-col :span="6">
        <el-card class="prescription-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">💊 电子处方单</span>
              <el-button link type="primary" size="small" @click="clearPrescription">清空</el-button>
            </div>
          </template>

          <div class="pres-content">
             <div class="smart-engine-tag">
                <span class="label">药量智算引擎: 开通</span>
                <span class="val">W: {{ form.weightAtVisit }}kg</span>
             </div>

             <!-- 改进后的添加药品按钮 -->
             <div class="add-medicine-trigger" @click="showMedList = true">
                <el-icon><Plus /></el-icon>
                <span>点击列出并选择药品</span>
             </div>

             <div class="medicine-list scroller" v-if="prescriptionItems.length > 0">
                <div v-for="(m, i) in prescriptionItems" :key="i" class="medicine-row">
                   <div class="m-top">
                      <span class="m-name">{{ m.name }}</span>
                      <el-icon @click="removeMedicine(i)" class="m-del"><Close /></el-icon>
                   </div>
                   <div class="m-bottom">
                      <span class="m-unit">¥{{ m.price }}/{{ m.unit }}</span>
                      <div class="m-count-ctrl">
                         <el-input-number v-model="m.count" :min="1" size="mini" @change="calcTotal" />
                         <span class="m-subtotal">¥{{ (m.price * m.count).toFixed(2) }}</span>
                      </div>
                   </div>
                </div>
             </div>
             <div class="medicine-list empty" v-else>
                <span>暂未添加处方药品</span>
             </div>

             <div class="pres-total">
                <span class="label">合计处方金额:</span>
                <span class="val">¥ {{ totalAmount.toFixed(2) }}</span>
             </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 药品选择弹窗 (直接列出所有药品) -->
    <el-dialog
      v-model="showMedList"
      title="选择处方药品"
      width="500px"
      append-to-body
      class="med-dialog"
    >
      <el-input
        v-model="medSearch"
        placeholder="搜索药品名称..."
        @input="filterMed"
        prefix-icon="Search"
        class="m-b-15"
      />
      <div class="med-list-container scroller">
         <div 
           v-for="item in filteredMeds" 
           :key="item.medicineId" 
           class="med-list-item"
           @click="selectAddedMed(item)"
         >
            <div class="item-left">
              <span class="name">{{ item.name }}</span>
              <span class="spec">{{ item.specification || '通用规格' }}</span>
            </div>
            <div class="item-right">
              <span class="price">¥{{ item.price }}</span>
              <span class="unit">/{{ item.unit }}</span>
            </div>
         </div>
         <div v-if="filteredMeds.length === 0" class="empty-tips">未找到匹配药品</div>
      </div>
      <template #footer>
        <el-button @click="showMedList = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { listPet } from '@/api/hospital/pet'
import { addRecord, updateRecord } from '@/api/hospital/record'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const BASE_URL = import.meta.env.VITE_APP_BASE_API
const queueList = ref([])
const currentPet = ref(null)
const submitLoading = ref(false)

// 药品弹窗逻辑
const showMedList = ref(false)
const medSearch = ref('')
const allMeds = ref([])
const filteredMeds = ref([])
const prescriptionItems = ref([])
const totalAmount = ref(0)

const form = ref({
  recordId: null,
  petId: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
  weightAtVisit: 5.0,
  visitType: '初诊'
})

const getQueue = async () => {
  const res = await listPet({ treatmentStatus: '就诊中' })
  queueList.value = res.rows || []
  if (queueList.value.length > 0 && !currentPet.value) {
    handleSelectPet(queueList.value[0])
  }
}

const handleSelectPet = (pet) => {
  currentPet.value = pet
  resetForm()
  form.value.petId = pet.petId
  form.value.weightAtVisit = pet.weight || 5.0
}

const resetForm = () => {
  form.value = {
    recordId: null,
    petId: currentPet.value ? currentPet.value.petId : '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    weightAtVisit: currentPet.value ? (currentPet.value.weight || 5.0) : 5.0,
    visitType: '初诊'
  }
  prescriptionItems.value = []
  totalAmount.value = 0
}

// 药品库加载与过滤
const loadAllMeds = async () => {
  const res = await request({ url: '/hospital/medicine/list', method: 'get' })
  allMeds.value = res.rows || []
  filteredMeds.value = allMeds.value
}

const filterMed = () => {
  filteredMeds.value = allMeds.value.filter(m => m.name.includes(medSearch.value))
}

const selectAddedMed = (item) => {
  const existing = prescriptionItems.value.find(i => i.medicineId === item.medicineId)
  if (existing) {
    existing.count++
  } else {
    prescriptionItems.value.push({ ...item, count: 1 })
  }
  calcTotal()
  ElMessage.success(`已添加: ${item.name}`)
}

const removeMedicine = (index) => {
  prescriptionItems.value.splice(index, 1)
  calcTotal()
}

const clearPrescription = () => {
  prescriptionItems.value = []
  calcTotal()
}

const calcTotal = () => {
  totalAmount.value = prescriptionItems.value.reduce((acc, cur) => acc + (cur.price * cur.count), 0)
}

const submitForm = async () => {
  if (!form.value.subjective && !form.value.assessment) {
    ElMessage.warning('病历主要信息不能为空')
    return
  }
  submitLoading.value = true
  try {
    const apiCall = form.value.recordId ? updateRecord : addRecord
    await apiCall(form.value)
    ElMessage.success('病历已保存并签发成功')
  } catch (e) {
    ElMessage.error('保存失败，请检查后端接口')
  } finally {
    submitLoading.value = false
  }
}

const getStatusType = (status) => {
  const map = { '就诊中': 'primary', '观察中': 'warning', '已康复': 'success' }
  return map[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return '11:45'
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const handleHistory = () => {
  ElMessage.info('历史查询功能建设中')
}

onMounted(() => {
  getQueue()
  loadAllMeds()
})
</script>

<style scoped lang="scss">
.soap-container {
  padding: 16px; background-color: #f0f4f7; min-height: calc(100vh - 84px);
}

// 全局操作栏
.page-header-actions {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 20px; background: #fff; border-radius: 12px; margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  .page-title { font-size: 20px; font-weight: 800; color: #333; }
  .save-btn { padding: 12px 30px; font-weight: 700; border-radius: 10px; }
}

.queue-card, .diagnosis-card, .prescription-card {
  height: calc(100vh - 180px); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;
}

.queue-list {
  margin: -15px;
  .queue-item {
    padding: 15px 20px; border-bottom: 1px solid #f0f3f6; cursor: pointer; transition: 0.2s;
    &:hover { background: #f8f9fb; }
    &.active { background: #eef5ff; border-left: 5px solid #3b82f6; }
    .item-main { display: flex; justify-content: space-between; align-items: center; .pet-name { font-weight: 700; } }
    .item-sub { display: flex; justify-content: space-between; font-size: 11px; color: #99a; margin-top: 4px; }
  }
}

// 档案 Banner
.pet-banner {
  background: #f8fbff; border: 1px solid #e1e9f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;
  .banner-top {
     display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
     .name { font-size: 26px; font-weight: 900; color: #2d3436; }
     .species { color: #64748b; font-size: 15px; margin-left: 6px; }
     .pet-id-box { color: #94a3b8; font-size: 14px; .id { color: #2d3436; font-weight: 700; margin-left: 6px; } }
  }
  .banner-bottom {
     .info-group {
        display: flex; align-items: center; gap: 15px;
        .label { font-weight: 700; color: #64748b; font-size: 14px; }
        .weight-ctrl {
           display: flex; align-items: center; gap: 10px; background: #fff; padding: 5px 15px; border-radius: 10px; border: 1px solid #dcdfe6;
           .unit { font-weight: 800; color: #3b82f6; }
        }
     }
  }
}

.soap-body {
  .section-title { font-size: 18px; font-weight: 800; margin-bottom: 20px; color: #1e293b; display: flex; align-items: center; gap: 8px; }
  .soap-item {
    margin-bottom: 20px;
    .field-label {
       font-weight: 700; font-size: 14px; margin-bottom: 8px; padding-left: 10px;
       &.subjective { border-left: 4px solid #3b82f6; }
       &.objective { border-left: 4px solid #10b981; }
       &.assessment { border-left: 4px solid #f59e0b; }
       &.plan { border-left: 4px solid #8c7ae6; }
       span { font-weight: 400; color: #94a3b8; font-size: 12px; margin-left: 5px; }
    }
  }
}

.pres-content {
  display: flex; flex-direction: column; height: 100%;
  .smart-engine-tag {
     background: #eff6ff; color: #2563eb; padding: 12px; border-radius: 10px; font-size: 12px; font-weight: 800;
     display: flex; justify-content: space-between; margin-bottom: 20px;
  }
  .add-medicine-trigger {
     height: 70px; border: 2px dashed #cbd5e1; border-radius: 12px; cursor: pointer; transition: 0.2s;
     display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b;
     &:hover { border-color: #3b82f6; color: #3b82f6; background: #f0f7ff; }
     span { font-size: 13px; font-weight: 700; margin-top: 4px; }
  }
}

.medicine-list {
  flex: 1; overflow-y: auto; margin-top: 20px;
  &.empty { display: flex; justify-content: center; align-items: center; color: #cbd5e1; font-size: 14px; }
  .medicine-row {
     background: #f8fafc; border: 1px solid #eef2f7; padding: 12px; border-radius: 12px; margin-bottom: 12px;
     .m-top { display: flex; justify-content: space-between; .m-name { font-weight: 700; color: #1e293b; } .m-del { cursor: pointer; color: #bbb; &:hover { color: #f55; } } }
     .m-bottom {
        display: flex; justify-content: space-between; align-items: center; margin-top: 8px;
        .m-unit { font-size: 12px; color: #94a3b8; }
        .m-count-ctrl { display: flex; align-items: center; gap: 10px; .m-subtotal { font-weight: 900; color: #2d3436; } }
     }
  }
}

.pres-total {
  border-top: 2px dashed #eef2f7; padding-top: 20px; text-align: right;
  .label { font-size: 14px; color: #64748b; }
  .val { color: #ef4444; font-size: 32px; font-weight: 900; margin-left: 10px; }
}

// 弹窗样式
.med-list-container {
  height: 400px;
  .med-list-item {
     padding: 15px; border-bottom: 1px solid #f1f2f6; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
     &:hover { background: #f8fafc; }
     .item-left { display: flex; flex-direction: column; gap: 4px; .name { font-weight: 700; font-size: 15px; } .spec { font-size: 12px; color: #94a3b8; } }
     .item-right { .price { color: #ef4444; font-weight: 800; font-size: 16px; } .unit { font-size: 12px; color: #94a3b8; } }
  }
  .empty-tips { text-align: center; color: #99a; margin-top: 100px; }
}

.scroller {
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 10px; }
}

.m-l-10 { margin-left: 10px; }
.m-r-5 { margin-right: 5px; }
.m-b-15 { margin-bottom: 15px; }
</style>
