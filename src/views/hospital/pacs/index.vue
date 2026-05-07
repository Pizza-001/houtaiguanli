<template>
  <div class="pacs-universe">
    <el-container class="pacs-container">
      <!-- 1. 左侧报告列表 (Report Sidebar) -->
      <el-aside width="380px" class="report-aside">
        <div class="aside-header">
          <div class="mode-switcher">
            <div 
              class="mode-btn" 
              :class="{ active: viewMode === 'lab' }"
              @click="viewMode = 'lab'"
            >
              <el-icon><DataLine /></el-icon> 实验室报告
            </div>
            <div 
              class="mode-btn" 
              :class="{ active: viewMode === 'imaging' }"
              @click="viewMode = 'imaging'"
            >
              <el-icon><Picture /></el-icon> 影像工作站
            </div>
          </div>
          <div class="search-bar">
            <el-input
              v-model="queryParams.petName"
              placeholder="搜索宠物姓名/主诉..."
              prefix-icon="Search"
              clearable
              @input="handleQuery"
              style="width: 200px"
            />
            <el-button type="primary" icon="Plus" circle @click="handleAdd" />
          </div>
        </div>

        <div class="report-list" v-loading="loading">
          <div 
            v-for="report in list" 
            :key="report.id"
            class="report-card"
            :class="{ active: currentReport?.id === report.id, abnormal: viewMode === 'lab' && report.hasAbnormal }"
            @click="handleSelectReport(report)"
          >
            <div class="card-header">
              <span class="report-type">{{ report.category || report.imagingType }}</span>
              <el-tag size="small" :type="getStatusType(report.status)">
                {{ getStatusLabel(report.status) }}
              </el-tag>
              <div class="card-actions">
                <el-button link type="primary" icon="Edit" @click.stop="handleUpdate(report)" />
                <el-button link type="danger" icon="Delete" @click.stop="handleDelete(report)" />
              </div>
            </div>
            <div class="card-body">
              <div class="p-info">
                <span class="p-name">{{ report.petName }}</span>
                <span class="p-owner">{{ report.ownerName }}</span>
              </div>
              <div class="time-info">{{ report.createTime }}</div>
            </div>
            <div class="card-footer" v-if="viewMode === 'lab' && report.hasAbnormal">
              <el-icon color="#EF4444"><WarningFilled /></el-icon>
              <span>发现 {{ report.abnormalCount }} 项异常指标</span>
            </div>
          </div>
          <el-empty v-if="!list.length" description="暂无报告记录" />
        </div>
      </el-aside>

      <!-- 2. 右侧详情视图 (Main Report View) -->
      <el-main class="report-main">
        <div v-if="currentReport" class="report-viewport animate-fade-in">
          <!-- 报告顶部信息 -->
          <div class="report-header">
            <div class="hospital-brand">
              <el-icon size="24" color="#3B82F6"><Monitor /></el-icon>
              <h3>华彩宠物医院 • {{ viewMode === 'lab' ? '化学实验室报告' : 'PACS 影像室诊断书' }}</h3>
            </div>
            <div class="report-meta-grid">
              <div class="meta-item"><span class="label">宠物姓名：</span>{{ currentReport.petName }}</div>
              <div class="meta-item"><span class="label">主诉/类别：</span>{{ currentReport.category || currentReport.imagingType }}</div>
              <div class="meta-item"><span class="label">送检医生：</span>{{ currentReport.doctorName || '系统默认' }}</div>
              <div class="meta-item"><span class="label">报告时间：</span>{{ currentReport.createTime }}</div>
            </div>
          </div>

          <!-- 化验详情 (LIS View) -->
          <div v-if="viewMode === 'lab'" class="lab-content section-card">
            <div class="section-title">化验明细结果</div>
            <el-table :data="currentReport.items" class="professional-table">
              <el-table-column label="项目名称" prop="itemName" min-width="150" />
              <el-table-column label="结果值" prop="resultValue" width="120">
                <template #default="scope">
                  <span :class="['result-val', getFlagClass(scope.row.resultFlag)]">
                    {{ scope.row.resultValue }}
                    <el-icon v-if="scope.row.resultFlag === '1'"><Top /></el-icon>
                    <el-icon v-if="scope.row.resultFlag === '2'"><Bottom /></el-icon>
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="单位" prop="unit" width="100" />
              <el-table-column label="提示" width="80">
                <template #default="scope">
                  <el-tag v-if="scope.row.resultFlag !== '0'" :type="scope.row.resultFlag === '1' ? 'danger' : 'warning'" size="small">
                    {{ scope.row.resultFlag === '1' ? '偏高' : '偏低' }}
                  </el-tag>
                  <span v-else class="normal-flag">正常</span>
                </template>
              </el-table-column>
              <el-table-column label="参考范围" prop="refRange" width="180" />
            </el-table>
            
            <div class="medical-opinion">
              <div class="opinion-title">临床见解与诊断建议</div>
              <p>{{ currentReport.finding || '临床数据正常，建议保持观察。' }}</p>
            </div>
          </div>

          <!-- 影像详情 (PACS View) -->
          <div v-if="viewMode === 'imaging'" class="imaging-content">
            <div class="pacs-layout">
              <div class="viewer-gallary section-card">
                <div class="section-title">数字影像存档 (DICOM Snapshot)</div>
                <div class="image-grid">
                  <div v-for="(url, index) in parseImages(currentReport.imageUrls)" :key="index" class="image-wrapper">
                    <el-image 
                      :src="url" 
                      :preview-src-list="parseImages(currentReport.imageUrls)"
                      fit="cover"
                      class="pacs-img"
                    />
                    <div class="img-zoom"><el-icon><ZoomIn /></el-icon></div>
                  </div>
                </div>
              </div>
              
              <div class="diagnosis-pane section-card">
                <div class="section-title">影像学报告</div>
                <div class="diag-group">
                  <span class="diag-label">【影像描述】</span>
                  <p>{{ currentReport.findings || '影像显示清晰，未见明显占位或异常阴影。' }}</p>
                </div>
                <div class="diag-group">
                  <span class="diag-label">【诊断结论】</span>
                  <p class="conclusion-text">{{ currentReport.conclusion || '未见明显影像学异常。' }}</p>
                </div>
                <div class="diag-footer">
                  <el-button type="primary" plain icon="Printer">打印报告</el-button>
                  <el-button type="success" plain icon="Share" @click="handleSendToOwner(currentReport)">发送给宠主</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <el-icon size="64" color="#E2E8F0"><Document /></el-icon>
          <h3>请在左侧选择一份化验或影像报告</h3>
          <p>支持 DICOM 网络影像查看与 LIS 实验室数据同步</p>
        </div>
      </el-main>
    </el-container>

    <el-dialog :title="title" v-model="open" width="800px" append-to-body destroy-on-close>
      <el-form ref="reportRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择宠物" prop="petId">
              <el-select v-model="form.petId" placeholder="请选择宠物" filterable style="width: 100%">
                <el-option
                  v-for="item in petOptions"
                  :key="item.petId"
                  :label="item.name + ' (' + item.ownerName + ')'"
                  :value="item.petId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="viewMode === 'lab'" label="报告类型" prop="categoryType">
              <el-input v-model="form.categoryType" placeholder="如：生化、血常规" />
            </el-form-item>
            <el-form-item v-else label="影像类型" prop="categoryType">
              <el-input v-model="form.categoryType" placeholder="如：DR、B超" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 化验报告特有字段 -->
        <div v-if="viewMode === 'lab'">
          <div class="form-section-title">化验明细项目</div>
          <el-table :data="form.items" border style="margin-bottom: 20px">
            <el-table-column label="项目名称" width="180">
              <template #default="scope">
                <el-input v-model="scope.row.itemName" size="small" placeholder="名称" />
              </template>
            </el-table-column>
            <el-table-column label="结果值" width="100">
              <template #default="scope">
                <el-input v-model="scope.row.resultValue" size="small" placeholder="结果" />
              </template>
            </el-table-column>
            <el-table-column label="单位" width="80">
              <template #default="scope">
                <el-input v-model="scope.row.unit" size="small" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column label="参考范围" width="140">
              <template #default="scope">
                <el-input v-model="scope.row.refRange" size="small" placeholder="范围" />
              </template>
            </el-table-column>
            <el-table-column label="异常" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.resultFlag" size="small">
                  <el-option label="正常" value="0" />
                  <el-option label="偏高" value="1" />
                  <el-option label="偏低" value="2" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center">
              <template #default="scope">
                <el-button link type="danger" icon="Delete" @click="removeLabItem(scope.$index)" />
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" plain icon="Plus" size="small" @click="addLabItem" style="margin-bottom: 20px">添加项目</el-button>
          
          <el-form-item label="临床见解" prop="finding">
            <el-input v-model="form.finding" type="textarea" rows="3" placeholder="请输入医生诊断见解..." />
          </el-form-item>
        </div>

        <!-- 影像报告特有字段 -->
        <div v-else>
          <el-form-item label="检查部位" prop="imagingPart">
            <el-input v-model="form.imagingPart" placeholder="请输入检查部位" />
          </el-form-item>
          <el-form-item label="影像描述" prop="findings">
            <el-input v-model="form.findings" type="textarea" rows="3" placeholder="请输入影像表现描述..." />
          </el-form-item>
          <el-form-item label="诊断结论" prop="conclusion">
            <el-input v-model="form.conclusion" type="textarea" rows="3" placeholder="请输入最终诊断结论..." />
          </el-form-item>
          <el-form-item label="图片链接" prop="imageUrls">
            <el-input v-model="form.imageUrls" type="textarea" rows="2" placeholder='请输入图片URL JSON, 如: ["/url1", "/url2"]' />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="open = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'Pacs' })
import { ref, onMounted, watch } from 'vue'
import { 
  Picture, DataLine, Search, WarningFilled, Monitor, ZoomIn, Printer, Share, Document, Top, Bottom, Plus, Edit, Delete 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  listLabReport, getLabReport, addLabReport, updateLabReport, delLabReport,
  listImagingReport, getImagingReport, addImagingReport, updateImagingReport, delImagingReport,
  sendImagingReport
} from '@/api/hospital/pacs'
import { listPet } from '@/api/hospital/pet'

const viewMode = ref('lab') // lab, imaging
const loading = ref(false)
const list = ref([])
const currentReport = ref(null)
const queryParams = ref({
  petName: '',
  pageNum: 1,
  pageSize: 20
})

// 表单相关变量
const open = ref(false)
const title = ref("")
const reportRef = ref(null)
const petOptions = ref([])
const form = ref({
  id: undefined,
  petId: undefined,
  categoryType: "", // 适配 lab.category 或 imaging.imagingType
  status: "1",
  finding: "",
  findings: "",
  conclusion: "",
  imagingPart: "",
  imageUrls: "[]",
  items: []
})

const rules = ref({
  petId: [{ required: true, message: "宠物不能为空", trigger: "change" }],
  categoryType: [{ required: true, message: "类别不能为空", trigger: "blur" }]
})

// 监听视图切换
watch(viewMode, () => {
  currentReport.value = null
  handleQuery()
})

const handleQuery = () => {
  loading.value = true
  const api = viewMode.value === 'lab' ? listLabReport : listImagingReport
  api(queryParams.value).then(res => {
    list.value = res.rows
    // 如果没有数据，且当前是初次加载，可以保持空状态
  }).finally(() => {
    loading.value = false
  })
}

/** 查询宠物列表用于下拉框 */
const getPetOptions = () => {
  listPet({ pageNum: 1, pageSize: 100 }).then(res => {
    petOptions.value = res.rows
  })
}

/** 重置表单 */
const reset = () => {
  form.value = {
    id: undefined,
    petId: undefined,
    categoryType: "",
    status: "1",
    finding: "",
    findings: "",
    conclusion: "",
    imagingPart: "",
    imageUrls: "[]",
    items: []
  }
  if (reportRef.value) reportRef.value.resetFields()
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  getPetOptions()
  open.value = true
  title.value = viewMode.value === 'lab' ? "新增实验室报告" : "新增影像报告"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  getPetOptions()
  const id = row.id
  const api = viewMode.value === 'lab' ? getLabReport : getImagingReport
  api(id).then(res => {
    form.value = res.data
    // 适配字段名
    if (viewMode.value === 'lab') {
      form.value.categoryType = res.data.category
    } else {
      form.value.categoryType = res.data.imagingType
    }
    open.value = true
    title.value = viewMode.value === 'lab' ? "修改实验室报告" : "修改影像报告"
  })
}

/** 提交按钮 */
const submitForm = () => {
  reportRef.value.validate(valid => {
    if (valid) {
      // 适配字段名回传
      const data = { ...form.value }
      if (viewMode.value === 'lab') {
        data.category = data.categoryType
      } else {
        data.imagingType = data.categoryType
      }

      if (form.value.id != undefined) {
        const api = viewMode.value === 'lab' ? updateLabReport : updateImagingReport
        api(data).then(response => {
          ElMessage.success("修改成功")
          open.value = false
          handleQuery()
        })
      } else {
        const api = viewMode.value === 'lab' ? addLabReport : addImagingReport
        api(data).then(response => {
          ElMessage.success("新增成功")
          open.value = false
          handleQuery()
        })
      }
    }
  })
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const id = row.id
  ElMessageBox.confirm('是否确认删除报告编号为"' + id + '"的数据项？', "系统提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    const api = viewMode.value === 'lab' ? delLabReport : delImagingReport
    return api(id)
  }).then(() => {
    handleQuery()
    ElMessage.success("删除成功")
    if (currentReport.value?.id === id) currentReport.value = null
  }).catch(() => {})
}

/** 添加化验明细项 */
const addLabItem = () => {
  if (!form.value.items) form.value.items = []
  form.value.items.push({
    itemName: "",
    resultValue: "",
    unit: "",
    refRange: "",
    resultFlag: "0"
  })
}

/** 移除化验明细项 */
const removeLabItem = (index) => {
  form.value.items.splice(index, 1)
}

const handleSelectReport = (report) => {
  currentReport.value = report
}

/** 发送给宠主 */
const handleSendToOwner = (report) => {
  if (!report || !report.id) return
  ElMessageBox.confirm('是否确认将这份影像报告发送给宠物主人查看？', "系统提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "info"
  }).then(() => {
    return sendImagingReport(report.id)
  }).then(() => {
    ElMessage.success("报告已发送至宠主移动端")
  }).catch(() => {})
}

const getStatusType = (status) => {
  const map = { '0': 'info', '1': 'success', '2': 'primary' }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = { '0': '待检', '1': '已出结果', '2': '已审核' }
  return map[status] || '未知'
}

const getFlagClass = (flag) => {
  if (flag === '1') return 'high'
  if (flag === '2') return 'low'
  return 'normal'
}

const parseImages = (json) => {
  try {
    return JSON.parse(json) || []
  } catch (e) {
    return [json] // fallback
  }
}

onMounted(() => {
  handleQuery()
})

// 专业医疗 Mock 数据发生器
const getMockData = () => {
  if (viewMode.value === 'lab') {
    return [
      {
        id: 101, petId: 1, petName: '坦克', ownerName: '张先生', category: '犬血常规（五分类）', 
        status: '1', createTime: '2026-04-27 10:30', hasAbnormal: true, abnormalCount: 2,
        items: [
          { itemName: '白细胞 count (WBC)', resultValue: '18.5', unit: '10^9/L', refRange: '6.0-17.0', resultFlag: '1' },
          { itemName: '红细胞 count (RBC)', resultValue: '6.5', unit: '10^12/L', refRange: '5.5-8.5', resultFlag: '0' },
          { itemName: '血红蛋白 (HGB)', resultValue: '90', unit: 'g/L', refRange: '120-180', resultFlag: '2' },
          { itemName: '血小板 count (PLT)', resultValue: '350', unit: '10^9/L', refRange: '200-500', resultFlag: '0' }
        ],
        finding: '白细胞显著升高，提示体内存在严重炎症反应；血红蛋白偏低，建议检查是否有内出血或贫血。'
      },
      {
        id: 102, petId: 2, petName: '雪球', ownerName: '李女士', category: '生化 12 项', 
        status: '2', createTime: '2026-04-26 15:45', hasAbnormal: false, abnormalCount: 0,
        items: [
          { itemName: '谷丙转氨酶 (ALT)', resultValue: '45', unit: 'U/L', refRange: '10-100', resultFlag: '0' },
          { itemName: '肌酐 (CREA)', resultValue: '85', unit: 'umol/L', refRange: '44-159', resultFlag: '0' }
        ]
      }
    ]
  } else {
    return [
      {
        id: 201, petId: 3, petName: '大黄', ownerName: '王大伯', imagingType: '数字 X 射线 (DR)', 
        status: '1', createTime: '2026-04-27 09:15', imagingPart: '腹部正侧位',
        imageUrls: JSON.stringify([
          'https://images.unsplash.com/photo-1549468057-5b7fa1a41d7a?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=800'
        ]),
        findings: '胃部可见明显异物阴影，形态不规则，初步判断为金属材质，肠道伴有轻度气体积聚。',
        conclusion: '腹部异物 (疑似误食钥匙)，建议立即进行手术或内窥镜取出。'
      }
    ]
  }
}
</script>

<style scoped>
.pacs-universe {
  height: calc(100vh - 100px);
  background: #F8FAFC;
  padding: 20px;
}

.pacs-container {
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

/* Sidebar Styling */
.report-aside {
  background: #FFF;
  border-right: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
}

.aside-header {
  padding: 20px;
  background: #FFF;
  border-bottom: 1px solid #F1F5F9;
}

.mode-switcher {
  display: flex;
  background: #F1F5F9;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: 0.3s;
}

.mode-btn.active {
  background: #FFF;
  color: #3B82F6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.report-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.report-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #F1F5F9;
  margin-bottom: 12px;
  cursor: pointer;
  transition: 0.3s;
  background: #FDFDFD;
}

.report-card:hover { Border-color: #3B82F6; transform: translateY(-2px); }
.report-card.active { border-color: #3B82F6; background: #EFF6FF; }
.report-card.abnormal { border-left: 4px solid #EF4444; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.report-type { font-weight: 800; color: #1E293B; font-size: 14px; }

.card-actions {
  display: none;
}

.report-card:hover .card-actions {
  display: flex;
  gap: 4px;
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.p-info {
  display: flex;
  flex-direction: column;
}

.p-name { font-weight: 700; color: #334155; }
.p-owner { font-size: 12px; color: #94A3B8; }
.time-info { font-size: 12px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; }

.card-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #E2E8F0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #EF4444;
  font-weight: 700;
}

/* Main View Styling */
.report-main {
  background: #F8FAFC;
  padding: 0;
}

.report-viewport {
  padding: 30px;
  max-width: 1100px;
  margin: 0 auto;
}

.report-header {
  background: #FFF;
  padding: 30px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.hospital-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #F1F5F9;
}

.hospital-brand h3 { font-size: 20px; font-weight: 900; color: #1E293B; letter-spacing: 1px; }

.report-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.meta-item { font-size: 14px; color: #475569; font-weight: 700; }
.meta-item .label { color: #94A3B8; font-weight: 500; }

.section-card {
  background: #FFF;
  padding: 30px;
  border-radius: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #1E293B;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title::before { content: ''; width: 4px; height: 16px; background: #3B82F6; border-radius: 4px; }

/* Lab Table Styling */
.professional-table {
  --el-table-header-bg-color: #F8FAFC;
}

.result-val { font-weight: 900; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 4px; }
.result-val.high { color: #EF4444; }
.result-val.low { color: #F59E0B; }
.normal-flag { color: #10B981; font-weight: 700; }

.medical-opinion {
  margin-top: 30px;
  padding: 20px;
  background: #F1F5F9;
  border-radius: 16px;
}

.opinion-title { font-weight: 800; color: #334155; margin-bottom: 10px; font-size: 14px; }
.medical-opinion p { line-height: 1.6; color: #475569; font-size: 14px; }

/* Imaging Layout */
.pacs-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.image-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  aspect-ratio: 4/3;
  cursor: pointer;
}

.pacs-img { width: 100%; height: 100%; transition: 0.5s; opacity: 0.9; }
.image-wrapper:hover .pacs-img { transform: scale(1.05); opacity: 1; }

.img-zoom {
  position: absolute; bottom: 12px; right: 12px;
  background: rgba(255,255,255,0.2); backdrop-filter: blur(10px);
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #FFF; pointer-events: none;
}

.diag-group { margin-bottom: 24px; }
.diag-label { font-size: 13px; font-weight: 800; color: #3B82F6; display: block; margin-bottom: 10px; }
.diag-group p { font-size: 14px; line-height: 1.8; color: #334155; }
.conclusion-text { font-weight: 800; border-left: 4px solid #10B981; padding-left: 12px; color: #10B981 !important; }

.diag-footer {
  margin-top: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
}

.empty-state h3 { margin: 20px 0 10px; color: #64748B; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

:deep(.el-table) { border-radius: 16px; overflow: hidden; }

.form-section-title {
  font-size: 14px;
  font-weight: 800;
  color: #64748B;
  margin: 20px 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-section-title::before { content: ''; width: 3px; height: 12px; background: #3B82F6; border-radius: 2px; }
</style>
