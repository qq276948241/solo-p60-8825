<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <span class="logo-icon">🏘️</span>
          <span class="logo-text">邻里闲置</span>
        </router-link>
        <nav class="nav" v-if="isLoggedIn">
          <router-link to="/" class="nav-link" exact-active-class="active">首页</router-link>
          <router-link to="/publish" class="nav-link" active-class="active">发布闲置</router-link>
          <router-link to="/my-items" class="nav-link" active-class="active">我发布的</router-link>
          <router-link to="/messages" class="nav-link" active-class="active">
            消息
            <span class="badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
          </router-link>
        </nav>
        <div class="user-actions">
          <template v-if="isLoggedIn">
            <span class="user-name">{{ user?.nickname }}</span>
            <button class="btn btn-logout" @click="logout">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-login">登录</router-link>
            <router-link to="/register" class="btn btn-register">注册</router-link>
          </template>
        </div>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <p>© 2024 邻里闲置 - 让小区闲置物品流动起来</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

const isLoggedIn = ref(false)
const user = ref(null)
const unreadCount = ref(0)

const checkAuth = () => {
  isLoggedIn.value = userStore.isLoggedIn
  user.value = userStore.user
}

const fetchUnreadCount = async () => {
  if (isLoggedIn.value) {
    try {
      const res = await messageStore.getUnreadCount()
      unreadCount.value = res.count
    } catch (e) {}
  }
}

checkAuth()

watch(() => userStore.isLoggedIn, () => {
  checkAuth()
  fetchUnreadCount()
})

watch(() => route.fullPath, () => {
  if (isLoggedIn.value) {
    fetchUnreadCount()
  }
}, { immediate: true })

onMounted(() => {
  if (isLoggedIn.value) {
    fetchUnreadCount()
  }
})

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>
