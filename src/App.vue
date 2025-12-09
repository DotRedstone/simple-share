<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- 全局路由视图容器 -->
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>