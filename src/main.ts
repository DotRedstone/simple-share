import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css' // 引入上面的样式文件
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')