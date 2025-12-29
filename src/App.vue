<script setup lang="ts">
import { RouterView } from 'vue-router'
import ServiceFooter from './components/ServiceFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- 全局路由视图容器 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 全局服务栏 -->
    <ServiceFooter />
  </div>
</template>
