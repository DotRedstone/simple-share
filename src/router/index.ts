import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores'

const LandingPage = () => import('../views/LandingPage.vue')
const UserDashboard = () => import('../views/UserDashboard.vue')
const AdminDashboard = () => import('../views/AdminDashboard.vue')
const ExtractPage = () => import('../views/ExtractPage.vue')

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: LandingPage,
        meta: { title: 'SimpleShare - 安全文件传输' }
    },
    {
        path: '/dashboard',
        name: 'UserDashboard',
        component: UserDashboard,
        meta: { requiresAuth: true, role: 'user' }
    },
    {
        path: '/admin',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/extract/:code',
        name: 'ExtractPage',
        component: ExtractPage,
        meta: { title: '提取文件 - SimpleShare' }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, _from, next) => {
    try {
        const authStore = useAuthStore()
        
        // 确保在每次路由跳转前尝试从本地存储恢复认证状态
        if (!authStore.user && authStore.token) {
            authStore.initAuth()
        }

        document.title = (to.meta.title as string) || 'SimpleShare'

        if (to.meta.requiresAuth) {
            if (!authStore.isAuthenticated) {
                next('/')
                return
            }
            
            if (to.meta.role && authStore.user && to.meta.role !== authStore.user.role) {
                const target = authStore.user.role === 'admin' ? '/admin' : '/dashboard'
                if (to.path !== target) {
                    next(target)
                    return
                }
            }
            next()
        } else {
            // 非认证要求的页面，如果已登录，不再强制重定向
            // 这样用户可以访问首页（LandingPage）来提取文件而不必登出
            next()
        }
    } catch (error) {
        console.error('路由守卫错误:', error)
        next('/')
    }
})

export default router