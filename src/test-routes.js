import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'

console.log(router.getRoutes().map(r => ({ path: r.path, name: r.name, component: r.component !== undefined })))
