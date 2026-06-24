<template>
  <div class="item-card" @click="goToDetail">
    <div class="item-image">
      <img 
        :src="item.images && item.images.length > 0 ? item.images[0] : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2240%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E📦%3C/text%3E%3C/svg%3E'" 
        :alt="item.title"
      />
      <span class="item-category">{{ getCategoryIcon(item.category) }} {{ item.category }}</span>
    </div>
    <div class="item-info">
      <h3 class="item-title">{{ item.title }}</h3>
      <p class="item-price">{{ formatPrice(item.price) }}</p>
      <div class="item-meta">
        <span class="item-seller">{{ item.seller_name }}</span>
        <span class="item-time">{{ formatDate(item.created_at) }}</span>
      </div>
      <div class="item-stats" v-if="item.favorite_count !== undefined">
        <span class="stat">❤️ {{ item.favorite_count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { formatPrice, formatDate, getCategoryIcon } from '@/utils/helpers'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToDetail = () => {
  router.push(`/item/${props.item.id}`)
}
</script>

<style scoped>
.item-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
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

.item-category {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.item-info {
  padding: 12px;
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
}

.item-stats {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
