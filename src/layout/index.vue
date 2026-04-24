<template>
  <div class="app-wrapper">
    <div class="sidebar-container">
      <div class="logo">
        <img src="@/assets/silver_logo.png" alt="logo" />
        <span>宠物医院管理</span>
      </div>
      <Sidebar />
    </div>
    <div class="main-container">
      <Navbar />
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
</script>

<style scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar-container {
  width: 260px;
  height: 100%;
  background: #ffffff; 
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  z-index: 1001;
  transition: all 0.3s ease;
}

.logo {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 14px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
}

.logo img {
  width: 34px;
  height: 34px;
  filter: drop-shadow(0 4px 10px rgba(94, 92, 230, 0.15));
}

.logo span {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 0.5px;
  color: var(--primary);
  background: var(--grad-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: none;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-main);
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* fade-transform */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
