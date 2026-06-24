<template>
  <div class="my-items-page">
    <div class="page-header">
      <h1 class="page-title">📦 我发布的</h1>
      <div class="tab-switch">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'published' }"
          @click="activeTab = 'published'"
        >
          发布的物品
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'favorites' }"
          @click="activeTab = 'favorites'"
        >
          我的收藏
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="items.length === 0" class="empty-state">
      <div class="empty-state-icon">{{ activeTab === 'published' ? '📦' : '❤️' }}</div>
      <p class="empty-state-text">
        {{ activeTab === 'published' ? '你还没有发布任何闲置' : '你还没有收藏任何物品' }}
      </p>
      <router-link 
        v-if="activeTab === 'published'" 
        to="/publish" 
        class="btn btn-primary"
      >
        发布第一件闲置
      </router-link>
      <router-link 
        v-else
        to="/" 
        class="btn btn-primary"
      >
        去逛逛
      </router-link>
    </div>
    
    <div v-else>
      <div class="items-grid">
        <div 
          v-for="item in items" 
          :key="item.id" 
          class="my-item-card card"
          @click="goToDetail(item)"
        >
          <div class="item-image">
            <img 
              :src="item.images && item.images.length > 0 ? item.images[0] : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2240%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E📦%3C/text%3E%3C/svg%3E'" 
              :alt="item.title"
            />
            <span 
              class="item-status" 
              :class="item.status === 1 ? 'status-active' : 'status-sold'"
              v-if="activeTab === 'published'"
            >
              {{ item.status === 1 ? '在售' : '已售出' }}
            </span>
            <span class="item-category">{{ getCategoryIcon(item.category) }}</span>
          </div>
          <div class="item-info">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-price">{{ formatPrice(item.price) }}</p>
            <div class="item-meta">
              <span class="item-time">{{ formatDate(item.created_at) }}</span>
              <span class="item-favorites" v-if="item.favorite_count !== undefined">
                ❤️ {{ item.favorite_count }}
              </span>
            </div>
            <div class="item-actions" v-if="activeTab === 'published'" @click.stop>
              <button 
                class="action-btn edit-btn"
                @click="editItem(item)"
              >
                编辑
              </button>
              <button 
                class="action-btn delete-btn"
                @click="deleteItem(item)"
              >
                删除
              </button>
            </div>
            <div class="item-actions" v-else @click.stop>
              <button 
                class="action-btn cancel-btn"
                @click="removeFavorite(item)"
              >
                取消收藏
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          class="page-btn" 
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        <span class="page-info">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 页
        </span>
        <button 
          class="page-btn" 
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { showToast, formatPrice, formatDate, getCategoryIcon } from '@/utils/helpers'

const router = useRouter()
const itemStore = useItemStore()

const loading = ref(false)
const items = ref([])
const activeTab = ref('published')
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0
})

const fetchItems = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    let res
    if (activeTab.value === 'published') {
      res = await itemStore.getMyItems(params)
    } else {
      res = await itemStore.getFavorites(params)
    }
    
    items.value = res.items
    Object.assign(pagination, res.pagination)
  } catch (err) {
    showToast('获取列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const goToDetail = (item) => {
  router.push(`/item/${item.id}`)
}

const editItem = (item) => {
  router.push(`/publish?edit=${item.id}`)
}

const deleteItem = async (item) => {
  if (!confirm(`确定要删除「${item.title}」吗？`)) return
  
  try {
    await itemStore.deleteItem(item.id)
    showToast('删除成功')
    fetchItems()
  } catch (err) {
    showToast(err.message || '删除失败', 'error')
  }
}

const removeFavorite = async (item) => {
  if (!confirm(`确定要取消收藏「${item.title}」吗？`)) return
  
  try {
    await itemStore.removeFavorite(item.id)
    showToast('已取消收藏')
    fetchItems()
  } catch (err) {
    showToast(err.message || '操作失败', 'error')
  }
}

const changePage = (page) => {
  pagination.page = page
  fetchItems()
}

watch(activeTab, () => {
  pagination.page = 1
  fetchItems()
})

onMounted(() => {
  fetchItems()
})
</script>

<style scoped>
.my-items-page {
  min-height: calc(100vh - 200px);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.tab-switch {
  display: flex;
  gap: 8px;
}

.tab-switch .tab-btn {
  padding: 10px 24px;
  border-radius: 8px;
  background: white;
  border: 1px solid #ddd;
  color: #666;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-switch .tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-switch .tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.my-item-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.my-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.item-image {
  position: relative;
  width: 100%;
  padding-top: 75%;
  overflow: hidden;
  background: #f8f8f8;
}

.item-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-status {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.status-active {
  background: rgba(46, 213, 115, 0.9);
  color: white;
}

.status-sold {
  background: rgba(255, 71, 87, 0.9);
  color: white;
}

.item-category {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 20px;
}

.item-info {
  padding: 16px;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 42px;
}

.item-price {
  font-size: 20px;
  font-weight: 600;
  color: #ff4757;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.item-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.edit-btn {
  background: #f0f0f0;
  color: #666;
}

.edit-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.delete-btn {
  background: #fff0f0;
  color: #ff4757;
}

.delete-btn:hover {
  background: #ffe0e0;
}

.cancel-btn {
  width: 100%;
  background: #fff0f0;
  color: #ff4757;
}

.cancel-btn:hover {
  background: #ffe0e0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.page-btn {
  padding: 8px 20px;
  border-radius: 6px;
  background: white;
  border: 1px solid #ddd;
  color: #333;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #667eea;
  color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .item-info {
    padding: 12px;
  }
}
</style>
