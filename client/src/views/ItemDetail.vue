<template>
  <div class="item-detail-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="!item" class="empty-state">
      <div class="empty-state-icon">😕</div>
      <p class="empty-state-text">物品不存在或已下架</p>
      <router-link to="/" class="btn btn-primary">返回首页</router-link>
    </div>
    
    <div v-else class="detail-container">
      <div class="image-section card">
        <div class="main-image">
          <img 
            :src="currentImage || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2260%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E📦%3C/text%3E%3C/svg%3E'" 
            :alt="item.title"
          />
        </div>
        <div v-if="item.images && item.images.length > 1" class="thumbnail-list">
          <div 
            v-for="(img, index) in item.images" 
            :key="index"
            class="thumbnail"
            :class="{ active: currentImage === img }"
            @click="currentImage = img"
          >
            <img :src="img" :alt="`图片${index + 1}`" />
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <div class="item-header card">
          <div class="item-category-badge">
            {{ getCategoryIcon(item.category) }} {{ item.category }}
          </div>
          <h1 class="item-title">{{ item.title }}</h1>
          <div class="item-price-row">
            <span class="item-price">{{ formatPrice(item.price) }}</span>
            <span class="item-favorites">❤️ {{ item.favorite_count }}人收藏</span>
          </div>
          <div class="item-meta-row">
            <span class="item-time">发布于 {{ formatDate(item.created_at) }}</span>
            <span class="item-status" :class="item.status === 1 ? 'status-active' : 'status-sold'">
              {{ item.status === 1 ? '在售' : '已售出' }}
            </span>
          </div>
        </div>
        
        <div class="seller-info card">
          <div class="seller-avatar">
            {{ item.seller_name?.charAt(0) || '用' }}
          </div>
          <div class="seller-details">
            <div class="seller-name">{{ item.seller_name }}</div>
            <div class="seller-label">卖家</div>
          </div>
        </div>
        
        <div class="item-description card">
          <h3 class="section-title">物品描述</h3>
          <p class="description-text">{{ item.description || '暂无描述' }}</p>
        </div>
        
        <div class="action-buttons" v-if="!isOwner">
          <button 
            class="btn btn-favorite" 
            :class="{ favorited: isFavorited }"
            @click="toggleFavorite"
            :disabled="actionLoading"
          >
            {{ isFavorited ? '❤️ 已收藏' : '🤍 收藏' }}
          </button>
          <button 
            class="btn btn-primary btn-contact"
            @click="showChatModal = true"
            :disabled="item.status !== 1"
          >
            💬 私信卖家
          </button>
        </div>
        
        <div class="owner-actions" v-else>
          <p class="owner-hint">这是你发布的物品</p>
          <div class="action-buttons">
            <router-link :to="`/publish?edit=${item.id}`" class="btn btn-secondary">
              ✏️ 编辑
            </router-link>
            <button 
              class="btn btn-danger"
              @click="handleDelete"
              :disabled="actionLoading"
            >
              🗑️ 删除
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showChatModal" class="modal-overlay" @click.self="showChatModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>私信卖家</h3>
          <button class="modal-close" @click="showChatModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="chat-item-preview">
            <img 
              :src="item.images && item.images[0]" 
              :alt="item.title"
              v-if="item.images && item.images[0]"
            />
            <div class="chat-item-info">
              <div class="chat-item-title">{{ item.title }}</div>
              <div class="chat-item-price">{{ formatPrice(item.price) }}</div>
            </div>
          </div>
          <textarea 
            v-model="messageContent"
            class="form-control message-input"
            placeholder="询问物品细节、价格、交易方式等..."
            rows="4"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showChatModal = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="sendMessage"
            :disabled="!messageContent.trim() || sending"
          >
            {{ sending ? '发送中...' : '发送消息' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { showToast, formatPrice, formatDate, getCategoryIcon } from '@/utils/helpers'

const route = useRoute()
const router = useRouter()
const itemStore = useItemStore()
const messageStore = useMessageStore()
const userStore = useUserStore()

const loading = ref(false)
const actionLoading = ref(false)
const sending = ref(false)
const item = ref(null)
const currentImage = ref('')
const isFavorited = ref(false)
const showChatModal = ref(false)
const messageContent = ref('')

const isOwner = computed(() => {
  return item.value && userStore.user && item.value.user_id === userStore.user.id
})

const fetchItemDetail = async () => {
  try {
    loading.value = true
    const res = await itemStore.getItemDetail(route.params.id)
    item.value = res.item
    if (res.item.images && res.item.images.length > 0) {
      currentImage.value = res.item.images[0]
    }
    
    if (userStore.isLoggedIn) {
      const favRes = await itemStore.checkFavorite(route.params.id)
      isFavorited.value = favRes.isFavorited
    }
  } catch (err) {
    showToast('获取物品详情失败', 'error')
  } finally {
    loading.value = false
  }
}

const toggleFavorite = async () => {
  try {
    actionLoading.value = true
    if (isFavorited.value) {
      await itemStore.removeFavorite(item.value.id)
      isFavorited.value = false
      item.value.favorite_count--
      showToast('已取消收藏')
    } else {
      await itemStore.addFavorite(item.value.id)
      isFavorited.value = true
      item.value.favorite_count++
      showToast('收藏成功')
    }
  } catch (err) {
    showToast(err.message || '操作失败', 'error')
  } finally {
    actionLoading.value = false
  }
}

const sendMessage = async () => {
  if (!messageContent.value.trim()) return
  
  try {
    sending.value = true
    await messageStore.sendMessage({
      receiverId: item.value.user_id,
      itemId: item.value.id,
      content: messageContent.value.trim()
    })
    showToast('消息发送成功')
    showChatModal.value = false
    messageContent.value = ''
    router.push(`/messages/${item.value.user_id}?itemId=${item.value.id}`)
  } catch (err) {
    showToast(err.message || '发送失败', 'error')
  } finally {
    sending.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('确定要删除这个物品吗？')) return
  
  try {
    actionLoading.value = true
    await itemStore.deleteItem(item.value.id)
    showToast('删除成功')
    router.push('/my-items')
  } catch (err) {
    showToast(err.message || '删除失败', 'error')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchItemDetail()
})
</script>

<style scoped>
.item-detail-page {
  min-height: calc(100vh - 200px);
}

.detail-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.image-section {
  padding: 24px;
}

.main-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  background: #f8f8f8;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  flex-shrink: 0;
  transition: border-color 0.2s;
}

.thumbnail.active {
  border-color: #667eea;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-header {
  padding: 24px;
}

.item-category-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 12px;
}

.item-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.4;
}

.item-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.item-price {
  font-size: 32px;
  font-weight: 700;
  color: #ff4757;
}

.item-favorites {
  color: #999;
  font-size: 14px;
}

.item-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  color: #999;
  font-size: 13px;
}

.item-status {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.status-active {
  background: #e8f5e9;
  color: #2ed573;
}

.status-sold {
  background: #ffebee;
  color: #ff4757;
}

.seller-info {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.seller-avatar {
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
}

.seller-details {
  flex: 1;
}

.seller-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.seller-label {
  font-size: 12px;
  color: #999;
}

.item-description {
  padding: 24px;
  flex: 1;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.description-text {
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-favorite {
  flex: 1;
  padding: 14px;
  font-size: 15px;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-favorite:hover {
  background: #f8f9ff;
}

.btn-favorite.favorited {
  background: #fff0f0;
  border-color: #ff4757;
  color: #ff4757;
}

.btn-contact {
  flex: 1;
  padding: 14px;
  font-size: 15px;
  border-radius: 8px;
}

.btn-contact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.owner-hint {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 12px;
}

.owner-actions .action-buttons .btn {
  flex: 1;
  padding: 14px;
  font-size: 15px;
  border-radius: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  font-size: 20px;
  color: #999;
  padding: 4px;
  cursor: pointer;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.chat-item-preview {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 16px;
}

.chat-item-preview img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
}

.chat-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.chat-item-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4757;
}

.message-input {
  resize: none;
  font-size: 14px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 968px) {
  .detail-container {
    grid-template-columns: 1fr;
  }
  
  .image-section {
    padding: 16px;
  }
  
  .item-header,
  .seller-info,
  .item-description {
    padding: 20px 16px;
  }
}
</style>
