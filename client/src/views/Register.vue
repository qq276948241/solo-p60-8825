<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">🏘️</div>
        <h1 class="auth-title">邻里闲置</h1>
        <p class="auth-subtitle">创建新账号</p>
      </div>
      
      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            class="form-control" 
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input 
            v-model="form.nickname" 
            type="text" 
            class="form-control" 
            placeholder="请输入昵称（选填）"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">联系电话</label>
          <input 
            v-model="form.phone" 
            type="tel" 
            class="form-control" 
            placeholder="请输入手机号（选填）"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password" 
            type="password" 
            class="form-control" 
            placeholder="请输入密码（至少6位）"
            required
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input 
            v-model="form.confirmPassword" 
            type="password" 
            class="form-control" 
            placeholder="请再次输入密码"
            required
          />
          <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary btn-block" 
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-inline"></span>
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="auth-footer">
        已有账号？
        <router-link to="/login" class="auth-link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast } from '@/utils/helpers'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const form = reactive({
  username: '',
  nickname: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const passwordError = computed(() => {
  if (form.confirmPassword && form.password !== form.confirmPassword) {
    return '两次输入的密码不一致'
  }
  return ''
})

const handleRegister = async () => {
  if (!form.username || !form.password) {
    showToast('请填写用户名和密码', 'error')
    return
  }
  
  if (form.password.length < 6) {
    showToast('密码至少6位', 'error')
    return
  }
  
  if (form.password !== form.confirmPassword) {
    showToast('两次输入的密码不一致', 'error')
    return
  }
  
  try {
    loading.value = true
    const { confirmPassword, ...registerData } = form
    await userStore.register(registerData)
    showToast('注册成功')
    router.push('/')
  } catch (err) {
    showToast(err.message || '注册失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  font-size: 48px;
  margin-bottom: 12px;
}

.auth-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: #999;
}

.auth-form {
  margin-bottom: 24px;
}

.btn-block {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 8px;
}

.spinner-inline {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.auth-link {
  color: #667eea;
  font-weight: 500;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
