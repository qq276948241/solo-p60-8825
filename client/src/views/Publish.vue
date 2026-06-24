<template>
  <div class="publish-page">
    <div class="card publish-card">
      <div class="publish-header">
        <h1 class="page-title">
          {{ isEdit ? '✏️ 编辑闲置' : '📦 发布闲置' }}
        </h1>
        <p class="page-subtitle">
          {{ isEdit ? '修改物品信息' : '让闲置物品流动起来' }}
        </p>
      </div>
      
      <form class="publish-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">物品标题 <span class="required">*</span></label>
          <input 
            v-model="form.title" 
            type="text" 
            class="form-control" 
            placeholder="请输入物品标题，简洁明了"
            maxlength="50"
            required
          />
          <p class="hint">最多50个字符</p>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">物品分类 <span class="required">*</span></label>
            <select v-model="form.category" class="form-control" required>
              <option value="">请选择分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                {{ getCategoryIcon(cat.name) }} {{ cat.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">物品价格 <span class="required">*</span></label>
            <div class="price-input-wrapper">
              <span class="price-symbol">¥</span>
              <input 
                v-model.number="form.price" 
                type="number" 
                class="form-control price-input" 
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">物品描述</label>
          <textarea 
            v-model="form.description" 
            class="form-control" 
            placeholder="详细描述物品的新旧程度、使用情况、尺寸等信息，让买家更了解..."
            rows="5"
            maxlength="500"
          ></textarea>
          <p class="hint">最多500个字符</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">物品图片 <span class="required">*</span></label>
          <div class="image-upload-area">
            <div class="image-preview-list">
              <div 
                v-for="(img, index) in previewImages" 
                :key="index"
                class="image-preview-item"
              >
                <img :src="img" alt="预览" />
                <button 
                  type="button" 
                  class="remove-image"
                  @click="removeImage(index)"
                >
                  ✕
                </button>
              </div>
              <label 
                v-if="previewImages.length < 5"
                class="image-upload-btn"
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  @change="handleImageUpload"
                  style="display: none;"
                />
                <div class="upload-icon">📷</div>
                <div class="upload-text">添加图片</div>
                <div class="upload-hint">最多5张</div>
              </label>
            </div>
          </div>
          <p class="hint">支持 JPG、PNG、GIF 格式，单张不超过 5MB</p>
        </div>
        
        <div class="form-group" v-if="isEdit">
          <label class="form-label">物品状态</label>
          <div class="status-options">
            <label class="status-option">
              <input 
                type="radio" 
                v-model="form.status" 
                :value="1"
              />
              <span>在售</span>
            </label>
            <label class="status-option">
              <input 
                type="radio" 
                v-model="form.status" 
                :value="0"
              />
              <span>已售出</span>
            </label>
          </div>
        </div>
        
        <div class="form-actions">
          <router-link to="/my-items" class="btn btn-secondary">
            取消
          </router-link>
          <button 
            type="submit" 
            class="btn btn-primary btn-submit"
            :disabled="loading || !canSubmit"
          >
            <span v-if="loading" class="spinner-inline"></span>
            {{ loading ? '提交中...' : (isEdit ? '保存修改' : '立即发布') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { showToast, getCategoryIcon } from '@/utils/helpers'

const route = useRoute()
const router = useRouter()
const itemStore = useItemStore()

const loading = ref(false)
const categories = ref([])
const editId = ref(null)
const existingImages = ref([])
const newImageFiles = ref([])
const previewImages = ref([])

const isEdit = computed(() => !!route.query.edit)

const form = reactive({
  title: '',
  category: '',
  price: null,
  description: '',
  status: 1
})

const canSubmit = computed(() => {
  if (!form.title || !form.category || form.price === null || form.price === undefined) return true
  if (!isEdit.value && previewImages.value.length === 0) return true
  if (isEdit.value && previewImages.value.length === 0 && existingImages.value.length === 0) return true
  return false
})

const fetchCategories = async () => {
  try {
    const res = await itemStore.getCategories()
    categories.value = res.categories
  } catch (err) {
    showToast('获取分类失败', 'error')
  }
}

const fetchItemForEdit = async () => {
  try {
    const res = await itemStore.getItemDetail(editId.value)
    const item = res.item
    form.title = item.title
    form.category = item.category
    form.price = item.price
    form.description = item.description || ''
    form.status = item.status
    existingImages.value = item.images || []
    previewImages.value = [...existingImages.value]
  } catch (err) {
    showToast('获取物品信息失败', 'error')
  }
}

const handleImageUpload = (e) => {
  const files = Array.from(e.target.files)
  const remainingSlots = 5 - previewImages.value.length
  
  if (files.length > remainingSlots) {
    showToast(`最多还能上传${remainingSlots}张图片`, 'error')
    return
  }
  
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过5MB', 'error')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      showToast('只支持 JPG、PNG、GIF 格式', 'error')
      return
    }
  }
  
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (event) => {
      previewImages.value.push(event.target.result)
    }
    reader.readAsDataURL(file)
    newImageFiles.value.push(file)
  }
  
  e.target.value = ''
}

const removeImage = (index) => {
  if (index < existingImages.value.length) {
    existingImages.value.splice(index, 1)
  } else {
    const newIndex = index - existingImages.value.length
    newImageFiles.value.splice(newIndex, 1)
  }
  previewImages.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.title.trim()) {
    showToast('请输入物品标题', 'error')
    return
  }
  if (!form.category) {
    showToast('请选择物品分类', 'error')
    return
  }
  if (form.price === null || form.price === undefined || form.price < 0) {
    showToast('请输入有效的价格', 'error')
    return
  }
  if (previewImages.value.length === 0) {
    showToast('请至少上传一张图片', 'error')
    return
  }
  
  try {
    loading.value = true
    
    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('category', form.category)
    formData.append('price', form.price)
    formData.append('description', form.description.trim())
    
    if (isEdit.value) {
      formData.append('status', form.status)
      formData.append('existingImages', JSON.stringify(existingImages.value))
    }
    
    newImageFiles.value.forEach(file => {
      formData.append('images', file)
    })
    
    if (isEdit.value) {
      await itemStore.updateItem(editId.value, formData)
      showToast('修改成功')
    } else {
      await itemStore.createItem(formData)
      showToast('发布成功')
    }
    
    router.push('/my-items')
  } catch (err) {
    showToast(err.message || '操作失败', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
  if (route.query.edit) {
    editId.value = route.query.edit
    fetchItemForEdit()
  }
})
</script>

<style scoped>
.publish-page {
  max-width: 800px;
  margin: 0 auto;
}

.publish-card {
  padding: 40px;
}

.publish-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #999;
}

.required {
  color: #ff4757;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.price-input-wrapper {
  position: relative;
}

.price-symbol {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #ff4757;
  font-weight: 600;
  font-size: 16px;
}

.price-input {
  padding-left: 32px !important;
}

.hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.image-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-preview-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.remove-image:hover {
  background: rgba(0, 0, 0, 0.8);
}

.image-upload-btn {
  width: 120px;
  height: 120px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}

.image-upload-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 13px;
  color: #666;
}

.upload-hint {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.status-options {
  display: flex;
  gap: 24px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.status-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-submit {
  padding: 12px 40px;
  font-size: 15px;
}

.spinner-inline {
  display: inline-block;
  width: 16px;
  height: 16px;
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

@media (max-width: 768px) {
  .publish-card {
    padding: 24px 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .image-preview-item,
  .image-upload-btn {
    width: 100px;
    height: 100px;
  }
}
</style>
