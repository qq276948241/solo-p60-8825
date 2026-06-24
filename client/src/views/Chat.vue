<template>
  <div class="chat-page">
    <div class="chat-header card">
      <button class="back-btn" @click="router.back()">
        ← 返回
      </button>
      <div class="chat-user-info">
        <div class="chat-avatar">
          {{ otherUserName?.charAt(0) || '用' }}
        </div>
        <div>
          <div class="chat-name">{{ otherUserName || '用户' }}</div>
          <div class="chat-item-title" v-if="currentItem">
            关于：{{ currentItem.title }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="messages.length === 0" class="empty-state">
        <div class="empty-state-icon">💬</div>
        <p class="empty-state-text">开始聊天吧</p>
      </div>
      
      <div v-else class="messages-list">
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          class="message-item"
          :class="{ 'message-self': isSelf(msg) }"
        >
          <div class="message-avatar" v-if="!isSelf(msg)">
            {{ msg.sender_name?.charAt(0) || '用' }}
          </div>
          <div class="message-content">
            <div class="message-item-link" v-if="msg.item_id && msg.item_title">
              <router-link :to="`/item/${msg.item_id}`" class="item-link">
                📦 {{ msg.item_title }}
              </router-link>
            </div>
            <div class="message-bubble" :class="{ 'bubble-self': isSelf(msg) }">
              {{ msg.content }}
            </div>
            <div class="message-time">{{ formatDate(msg.created_at) }}</div>
          </div>
          <div class="message-avatar" v-if="isSelf(msg)">
            {{ currentUser?.nickname?.charAt(0) || '我' }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input-area card">
      <textarea 
        v-model="inputMessage"
        class="chat-input"
        placeholder="输入消息..."
        rows="2"
        @keydown.enter.exact.prevent="sendMessage"
      ></textarea>
      <button 
        class="btn btn-primary send-btn"
        @click="sendMessage"
        :disabled="!inputMessage.trim() || sending"
      >
        {{ sending ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessageStore } from '@/stores/message'
import { useItemStore } from '@/stores/item'
import { useUserStore } from '@/stores/user'
import { showToast, formatDate } from '@/utils/helpers'

const route = useRoute()
const router = useRouter()
const messageStore = useMessageStore()
const itemStore = useItemStore()
const userStore = useUserStore()

const loading = ref(false)
const sending = ref(false)
const messages = ref([])
const inputMessage = ref('')
const otherUserId = ref(route.params.userId)
const otherUserName = ref('')
const currentItem = ref(null)
const messagesContainer = ref(null)

const currentUser = userStore.user

const isSelf = (msg) => {
  return msg.sender_id === currentUser?.id
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const fetchMessages = async () => {
  try {
    loading.value = true
    const params = {}
    if (route.query.itemId) {
      params.itemId = route.query.itemId
    }
    
    const res = await messageStore.getMessages(otherUserId.value, params)
    messages.value = res.messages
    
    if (messages.value.length > 0) {
      const firstMsg = messages.value[0]
      if (firstMsg.sender_id === currentUser?.id) {
        otherUserName.value = firstMsg.receiver_name
      } else {
        otherUserName.value = firstMsg.sender_name
      }
    }
    
    scrollToBottom()
  } catch (err) {
    showToast('获取消息失败', 'error')
  } finally {
    loading.value = false
  }
}

const fetchItemInfo = async () => {
  if (route.query.itemId) {
    try {
      const res = await itemStore.getItemDetail(route.query.itemId)
      currentItem.value = res.item
    } catch (e) {}
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  try {
    sending.value = true
    const data = {
      receiverId: otherUserId.value,
      content: inputMessage.value.trim()
    }
    if (route.query.itemId) {
      data.itemId = route.query.itemId
    }
    
    const res = await messageStore.sendMessage(data)
    messages.value.push(res.data)
    inputMessage.value = ''
    scrollToBottom()
    
    if (res.data.sender_id === currentUser?.id) {
      otherUserName.value = res.data.receiver_name
    } else {
      otherUserName.value = res.data.sender_name
    }
  } catch (err) {
    showToast(err.message || '发送失败', 'error')
  } finally {
    sending.value = false
  }
}

watch(() => route.query.itemId, () => {
  fetchMessages()
  fetchItemInfo()
})

onMounted(() => {
  fetchMessages()
  fetchItemInfo()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 160px);
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 0;
}

.back-btn {
  color: #667eea;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #f0f0f0;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.chat-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.chat-item-title {
  font-size: 12px;
  color: #667eea;
  margin-top: 2px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 70%;
}

.message-item.message-self {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.message-self .message-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-self .message-content {
  align-items: flex-end;
}

.message-item-link {
  margin-bottom: 4px;
}

.item-link {
  display: inline-block;
  padding: 6px 12px;
  background: #fff3e0;
  color: #ff9800;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.item-link:hover {
  background: #ffe0b2;
}

.message-bubble {
  background: white;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
}

.message-bubble.bubble-self {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.chat-input-area {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  border-radius: 0;
  background: white;
}

.chat-input {
  flex: 1;
  resize: none;
  padding: 10px 12px;
  font-size: 14px;
  max-height: 100px;
}

.send-btn {
  align-self: flex-end;
  padding: 10px 24px;
}

@media (max-width: 768px) {
  .chat-page {
    height: calc(100vh - 120px);
    border-radius: 0;
  }
  
  .message-item {
    max-width: 85%;
  }
}
</style>
