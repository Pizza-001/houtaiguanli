<template>
  <div class="login-container">
    <div class="login-bg"></div>
    <div class="login-box glass-card">
      <div class="login-header">
        <div class="logo-wrapper">
          <el-icon class="logo-icon"><FirstAidKit /></el-icon>
        </div>
        <h1>宠物医院 HIS</h1>
        <p>专业、协作、关爱 - HIS 管理系统</p>
      </div>
      
      <el-form :model="loginForm" :rules="loginRules" ref="loginRef" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名" 
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码" 
            :prefix-icon="Lock"
            show-password
            class="custom-input"
          />
        </el-form-item>
        
        <el-form-item prop="code" v-if="captchaEnabled">
          <div class="captcha-wrapper">
            <el-input 
              v-model="loginForm.code" 
              placeholder="动态验证码" 
              :prefix-icon="Key"
              class="captcha-input custom-input"
            />
            <div class="captcha-img" @click="getCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
              <div v-else class="captcha-placeholder">加载中...</div>
            </div>
          </div>
        </el-form-item>
        
        <el-button 
          type="primary" 
          class="login-btn" 
          :loading="loading" 
          @click="handleLogin"
        >
          立即进入系统
        </el-button>
      </el-form>
      
      <div class="login-footer">
        © 2026 PetHospital HIS. All Rights Reserved.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { FirstAidKit, User, Lock, Key } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loginRef = ref()
const loading = ref(false)
const captchaUrl = ref('')
const captchaEnabled = ref(true)

const loginForm = ref({
  username: '',
  password: '',
  code: '',
  uuid: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入', trigger: 'blur' }],
  password: [{ required: true, message: '请输入', trigger: 'blur' }],
  code: [{ required: true, message: '请输入', trigger: 'blur' }]
}

const getCaptcha = async () => {
  try {
    const res = await request({
      url: '/captchaImage',
      method: 'get'
    })
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      captchaUrl.value = 'data:image/jpeg;base64,' + res.img
      loginForm.value.uuid = res.uuid
    }
  } catch (err) {
    console.error('获取验证码失败:', err)
    captchaUrl.value = ''
    ElMessage.error('无法连接后端服务，请检查后端是否已启动')
  }
}

const handleLogin = () => {
  loginRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm.value)
        ElMessage.success('欢迎回来')
        router.push('/')
      } catch (err) {
        getCaptcha()
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  getCaptcha()
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 10% 20%, rgba(94, 92, 230, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 90% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 40%);
  background-color: #f8fafc;
  z-index: 0;
}

.login-box {
  width: 440px;
  padding: 50px;
  z-index: 1;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  width: 64px;
  height: 64px;
  background: var(--grad-primary);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 20px;
  color: #fff;
  font-size: 32px;
  box-shadow: 0 4px 12px rgba(94, 92, 230, 0.3);
}

.login-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 1px;
}

.login-header p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 8px;
}

.custom-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.5) !important;
  border-radius: 10px !important;
  height: 48px;
  box-shadow: none !important;
  border: 1px solid rgba(229, 229, 234, 0.8) !important;
}

.custom-input :deep(.el-input__wrapper):hover {
  border-color: var(--primary) !important;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-img {
  width: 130px;
  height: 48px;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(229, 229, 234, 0.8);
  background: #fff;
}

.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  letter-spacing: 2px;
  margin-top: 20px;
  box-shadow: 0 4px 12px rgba(94, 92, 230, 0.2);
}

.login-footer {
  margin-top: 40px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>

