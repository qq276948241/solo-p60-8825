<template>
  <div class="home-page">
    <div class="search-section card">
      <div class="search-bar">
        <input 
          v-model="filters.keyword" 
          type="text" 
          class="search-input" 
          placeholder="搜索闲置物品..."
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary search-btn" @click="handleSearch">
          🔍 搜索
        </button>
      </div>
      
      <div class="filter-row">
        <div class="filter-group">
          <span class="filter-label">分类：</span>
          <div class="category-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: filters.category === 'all' }"
              @click="selectCategory('all')"
            >
              全部
            </button>
            <button 
              v-for="cat in categories" 
              :key="cat.id"
              class="tab-btn" 
              :class="{ active: filters.category === cat.name }"
              @click="selectCategory(cat.name)"
            >
              {{ getCategoryIcon(cat.name) }} {{ cat.name }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="filter-row">
        <div class="filter-group">
          <span class="filter-label">价格区间：</span>
          <input 
            v-model.number="filters.minPrice" 
            type="number" 
            class="price-input" 
            placeholder="最低价"
            min="0"
          />
          <span class="price-separator">-</span>
          <input 
            v-model.number="filters.maxPrice" 
            type="number" 
            class="price-input" 
            placeholder="最高价"
            min="0"
          />
          <button class="btn btn-secondary filter-btn" @click="handleSearch">
            筛选
          </button>
          <button class="btn btn-secondary reset-btn" @click="resetFilters">
            重置
          </button>
        </div>
      </div>
    </div>

    <div class="items-section">
      <div class="section-header">
        <h2 class="section-title">
          {{ filters.category === 'all' ? '全部闲置' : filters.category }}
          <span class="item-count">({{ pagination.total }}件)</span>
        </h2>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="items.length === 0" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p class="empty-state-text">暂无闲置物品</p>
        <router-link to="/publish" class="btn btn-primary">
          发布第一件闲置
        </router-link>
      </div>
      
      <div v-else class="items-grid">
        <ItemCard v-for="item in items" :key="item.id" :item="item" />
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
import { ref, reactive, onMounted } from 'vue'
import { useItemStore } from '@/stores/item'
import { showToast, getCategoryIcon, debounce } from '@/utils/helpers'
import ItemCard from '@/components/ItemCard.vue'

const itemStore = useItemStore()

const loading = ref(false)
const items = ref([])
const categories = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0
})

const filters = reactive({
  keyword: '',
  category: 'all',
  minPrice: null,
  maxPrice: null
})

const fetchCategories = async () => {
  try {
    const res = await itemStore.getCategories()
    categories.value = res.categories
  } catch (err) {
    showToast('获取分类失败', 'error')
  }
}

const fetchItems = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.category && filters.category !== 'all') params.category = filters.category
    if (filters.minPrice) params.minPrice = filters.minPrice
    if (filters.maxPrice) params.maxPrice = filters.maxPrice
    
    const res = await itemStore.getItems(params)
    items.value = res.items
    Object.assign(pagination, res.pagination)
  } catch (err) {
    showToast('获取物品列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchItems()
}

const selectCategory = (category) => {
  filters.category = category
  pagination.page = 1
  fetchItems()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.category = 'all'
  filters.minPrice = null
  filters.maxPrice = null
  pagination.page = 1
  fetchItems()
}

const changePage = (page) => {
  pagination.page = page
  fetchItems()
}

const debouncedSearch = debounce(() => {
  pagination.page = 1
  fetchItems()
}, 500)

onMounted(() => {
  fetchCategories()
  fetchItems()
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.search-section {
  padding: 24px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 15px;
}

.search-btn {
  padding: 12px 32px;
  font-size: 15px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.filter-row:first-of-type {
  border-top: none;
  padding-top: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 6px 16px;
  border-radius: 20px;
  background: #f5f5f5;
  color: #666;
  font-size: 13px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #e8e8e8;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.price-input {
  width: 100px;
  padding: 8px 12px;
}

.price-separator {
  color: #999;
}

.filter-btn, .reset-btn {
  padding: 8px 20px;
  font-size: 13px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.item-count {
  font-size: 14px;
  font-weight: 400;
  color: #999;
  margin-left: 8px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
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
  .search-section {
    padding: 16px;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
  }
  
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .price-input {
    width: 80px;
  }
}
</style>
