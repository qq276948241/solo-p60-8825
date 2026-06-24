<template>
  <div class="messages-page">
    <div class="page-header">
      <h1 class="page-title">💬 消息</h1>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="conversations.length === 0" class="empty-state">
      <div class="empty-state-icon">💬</div>
      <p class="empty-state-text">暂无消息</p>
      <router-link to="/" class="btn btn-primary">
        去逛逛
      </router-link>
    </div>
    
    <div v-else class="conversation-list">
      <div 
        v-for="conv in conversations" 
        :key="`${conv.other_user_id}-${conv.item_id}`"
        class="conversation-item card"
        @click="goToChat(conv)"
      >
        <div class="conversation-avatar">
          {{ conv.other_user_name?.charAt(0) || '用' }}
        </div>
        <div class="conversation-info">
          <div class="conversation-header">
            <span class="conversation-name">{{ conv.other_user_name }}</span>
            <span class="conversation-time">{{ formatDate(conv.last_message_time) }}</span>
          </div>
          <div class="conversation-content">
            <span class="conversation-item-title" v-if="conv.item_title">
              【{{ conv.item_title }}】
            </span>
            <span class="conversation-last-msg">{{ conv.last_message }}</span>
          </div>
        </div>
        <div class="conversation-badge" v-if="conv.unread_count > 0">
          {{ conv.unread_count }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessageStore } from '@/stores/message'
import { showToast, formatDate } from '@/utils/helpers'

const router = useRouter()
const messageStore = useMessageStore()

const loading = ref(false)
const conversations = ref([])

const fetchConversations = async () => {
  try {
    loading.value = true
    const res = await messageStore.getConversations()
    conversations.value = res.conversations
  } catch (err) {
    showToast('获取消息列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const goToChat = (conv) => {
  const query = conv.item_id ? { itemId: conv.item_id } : {}
  router.push({
    name: 'Chat',
    params: { userId: conv.other_user_id },
    query
  })
}

onMounted(() => {
  fetchConversations()
})
</script>

<style scoped>
.messages-page {
  min-height: calc(100vh - 200px);
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.conversation-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.conversation-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.conversation-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.conversation-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.conversation-content {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-item-title {
  color: #667eea;
  margin-right: 4px;
}

.conversation-last-msg {
  color: #999;
}

.conversation-badge {
  background: #ff4757;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
}
</style>
