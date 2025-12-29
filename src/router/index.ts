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
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
        authStore.initAuth()
    }

    document.title = (to.meta.title as string) || 'SimpleShare'

    if (to.meta.requiresAuth) {
        if (!authStore.isAuthenticated) {
            next('/')
        } else if (to.meta.role && to.meta.role !== authStore.user?.role) {
            next(authStore.user?.role === 'admin' ? '/admin' : '/dashboard')
        } else {
            next()
        }
    } else {
        // 非认证要求的页面，如果已登录，不再强制重定向
        // 这样用户可以访问首页（LandingPage）来提取文件而不必登出
        next()
    }
})

export default router