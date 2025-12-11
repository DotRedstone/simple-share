import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAuth0 } from '@auth0/auth0-vue'
import router from './router'
import './style.css' // 引入上面的样式文件
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 动态加载 Auth0 配置并初始化
async function initAuth0() {
  try {
    const response = await fetch('/api/auth/auth0/config')
    const data = await response.json()
    
    if (data.success && data.configured && data.domain && data.clientId) {
      app.use(
        createAuth0({
          domain: data.domain,
          clientId: data.clientId,
          authorizationParams: {
            redirect_uri: window.location.origin + '/callback',
          },
          useRefreshTokens: true,
          cacheLocation: 'localstorage',
        })
      )
    }
  } catch (error) {
    console.warn('Auth0 not configured or failed to load:', error)
  }
  
  app.mount('#app')
}

initAuth0()