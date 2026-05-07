<template>
  <div class="chat-container">
    <div class="session-list">
      <div class="list-header">人工服务请求</div>
      <div 
        v-for="session in sessions" 
        :key="session.sessionId" 
        class="session-item"
        :class="{ active: currentSession?.sessionId === session.sessionId }"
        @click="selectSession(session)"
      >
        <div class="user-avatar">
          <img :src="session.avatar || '/static/images/default-avatar.png'" />
        </div>
        <div class="session-info">
          <div class="user-name">{{ session.nickName || '用户 ' + session.userId }}</div>
          <div class="last-msg">{{ session.status === 1 ? '等待接入' : '服务中...' }}</div>
        </div>
        <div class="status-tag" :class="'status-' + session.status">
          {{ getStatusText(session.status) }}
        </div>
      </div>
    </div>

    <div class="chat-main" v-if="currentSession">
      <div class="chat-header">
        <div class="header-left">
          正在与 <span class="highlight">{{ currentSession.nickName || '用户 ' + currentSession.userId }}</span> 对话
        </div>
        <div class="header-right">
          <el-button type="success" size="small" v-if="currentSession.status === 1" @click="handleJoin">接入会话</el-button>
          <el-button type="warning" size="small" plain v-if="currentSession.status === 2" @click="handleEndSession">结束服务</el-button>
          <el-button type="danger" size="small" plain @click="handleDeleteSession">彻底删除</el-button>
        </div>
      </div>
      
      <div class="message-list" ref="messageList">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          class="message-item"
          :class="msg.role"
        >
          <div class="msg-bubble">{{ msg.content }}</div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="inputMsg"
          type="textarea"
          :rows="3"
          placeholder="请输入回复内容..."
          @keyup.enter="handleSend"
        />
        <div class="actions">
          <span class="hint">Enter 发送</span>
          <el-button type="primary" @click="handleSend">发送回复</el-button>
        </div>
      </div>
    </div>
    
    <div class="chat-empty" v-else>
      <el-empty description="请从左侧选择一个会话开始交流" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getToken } from '@/utils/auth'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const sessions = ref([])
const currentSession = ref(null)
const messages = ref([])
const inputMsg = ref('')
const socket = ref(null)
const messageList = ref(null)

const apiBase = import.meta.env.VITE_APP_BASE_API || '/dev-api'

const connectWebSocket = () => {
  const token = getToken()
  if (!token) return

  const wsUrl = `ws://localhost:8088/websocket/chat?token=${token}`
  socket.value = new WebSocket(wsUrl)
  
  socket.value.onopen = () => {
    console.log('管理端 WebSocket 连接成功')
  }

  socket.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'new_request') {
      fetchSessions()
      ElMessage.info('有新的服务请求')
    } else if (data.type === 'text') {
      if (currentSession.value && data.userId === currentSession.value.userId) {
        messages.value.push({ role: 'user', content: data.content })
        scrollToBottom()
      } else {
        fetchSessions()
      }
    }
  }
}

const fetchSessions = async () => {
  try {
    const res = await axios.get(`${apiBase}/ai/chat/sessions`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
    if (res.data.code === 200) {
      sessions.value = res.data.data
      if (currentSession.value && !sessions.value.find(s => s.sessionId === currentSession.value.sessionId)) {
        currentSession.value = null
        messages.value = []
      }
    }
  } catch (err) {
    console.error('获取列表失败:', err)
  }
}

const selectSession = (session) => {
  currentSession.value = session
  messages.value = []
}

const handleJoin = () => {
  if (socket.value && currentSession.value) {
    socket.value.send(JSON.stringify({
      type: 'cmd',
      action: 'join_session',
      sessionId: currentSession.value.sessionId
    }))
    currentSession.value.status = 2
    ElMessage.success('已接入会话')
  }
}

const handleEndSession = () => {
  ElMessageBox.confirm('确定要结束本次人工服务吗？结束后用户将切回AI模式。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({
        type: 'cmd',
        action: 'admin_end_session',
        sessionId: currentSession.value.sessionId,
        userId: currentSession.value.userId
      }))
      currentSession.value.status = 3
      ElMessage.success('服务已结束')
      fetchSessions()
    } else {
      ElMessage.error('WebSocket 连接已断开，请刷新页面重试')
    }
  })
}

const handleDeleteSession = () => {
  ElMessageBox.confirm('确定要删除该会话及其所有历史记录吗？此操作不可恢复。', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(async () => {
    try {
      await axios.delete(`${apiBase}/ai/chat/sessions/${currentSession.value.sessionId}`, {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      })
      ElMessage.success('会话已删除')
      fetchSessions()
    } catch (err) {
      ElMessage.error('删除失败')
    }
  })
}

const handleSend = () => {
  if (!inputMsg.value.trim() || !currentSession.value) return
  
  const content = inputMsg.value.trim()
  socket.value.send(JSON.stringify({
    type: 'text',
    toUserId: currentSession.value.userId,
    content: content
  }))
  
  messages.value.push({ role: 'admin', content: content })
  inputMsg.value = ''
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

const getStatusText = (status) => {
  const map = { 1: '等待接入', 2: '进行中', 3: '已结束' }
  return map[status] || '未知'
}

onMounted(() => {
  connectWebSocket()
  fetchSessions()
})
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  height: calc(100vh - 120px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.session-list {
  width: 300px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #fff;
  
  .list-header {
    padding: 20px;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
    color: #333;
  }
  
  .session-item {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
    border-bottom: 1px solid #f9f9f9;
    transition: all 0.2s;
    
    &:hover { background: #f5f7fa; }
    &.active { background: #ecf5ff; border-left: 4px solid #409eff; padding-left: 16px; }
    
    .user-avatar {
      width: 44px;
      height: 44px;
      margin-right: 12px;
      img { width: 100%; border-radius: 8px; border: 1px solid #eee; }
    }
    
    .session-info {
      flex: 1;
      overflow: hidden;
      .user-name { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
      .last-msg { font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    }
    
    .status-tag {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      &.status-1 { background: #fef0f0; color: #f56c6c; }
      &.status-2 { background: #f0f9eb; color: #67c23a; }
      &.status-3 { background: #f4f4f5; color: #909399; }
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  
  .chat-header {
    padding: 0 25px;
    height: 64px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;

    .header-left {
      font-size: 15px;
      color: #666;
      .highlight { color: #333; font-weight: 600; margin: 0 4px; }
    }

    .header-right {
      display: flex;
      gap: 10px;
    }
  }
  
  .message-list {
    flex: 1;
    padding: 25px;
    overflow-y: auto;
    background: #f9fbff;
    
    .message-item {
      margin-bottom: 20px;
      display: flex;
      
      .msg-bubble {
        padding: 12px 18px;
        border-radius: 12px;
        max-width: 65%;
        font-size: 14px;
        line-height: 1.6;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);
      }
      
      &.user {
        justify-content: flex-start;
        .msg-bubble { 
          background: #fff; 
          color: #333;
          border-bottom-left-radius: 2px;
        }
      }
      
      &.admin {
        justify-content: flex-end;
        .msg-bubble { 
          background: #409eff; 
          color: #fff;
          border-bottom-right-radius: 2px;
        }
      }
    }
  }
  
  .input-area {
    padding: 20px 25px;
    border-top: 1px solid #f0f0f0;
    background: #fff;

    .actions {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .hint { font-size: 12px; color: #999; }
    }
  }
}

.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fbff;
}
</style>
