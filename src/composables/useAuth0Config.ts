import { ref, onMounted } from 'vue'

interface Auth0Config {
  domain: string
  clientId: string
}

const auth0Config = ref<Auth0Config | null>(null)
const isLoading = ref(true)

export function useAuth0Config() {
  const loadConfig = async () => {
    if (auth0Config.value) {
      return auth0Config.value
    }

    try {
      const response = await fetch('/api/auth/auth0/config')
      const data = await response.json()
      
      if (data.success && data.configured) {
        auth0Config.value = {
          domain: data.domain,
          clientId: data.clientId
        }
      }
    } catch (error) {
      console.error('Failed to load Auth0 config:', error)
    } finally {
      isLoading.value = false
    }

    return auth0Config.value
  }

  onMounted(() => {
    loadConfig()
  })

  return {
    config: auth0Config,
    isLoading,
    loadConfig
  }
}

