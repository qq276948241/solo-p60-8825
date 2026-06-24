import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useItemStore = defineStore('item', () => {
  const getCategories = async () => {
    return await request.get('/items/categories')
  }

  const getItems = async (params = {}) => {
    return await request.get('/items', { params })
  }

  const getMyItems = async (params = {}) => {
    return await request.get('/items/my', { params })
  }

  const getFavorites = async (params = {}) => {
    return await request.get('/items/favorites', { params })
  }

  const getItemDetail = async (id) => {
    return await request.get(`/items/${id}`)
  }

  const createItem = async (data) => {
    return await request.post('/items', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  const updateItem = async (id, data) => {
    return await request.put(`/items/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  const deleteItem = async (id) => {
    return await request.delete(`/items/${id}`)
  }

  const addFavorite = async (id) => {
    return await request.post(`/items/${id}/favorite`)
  }

  const removeFavorite = async (id) => {
    return await request.delete(`/items/${id}/favorite`)
  }

  const checkFavorite = async (id) => {
    return await request.get(`/items/${id}/is-favorited`)
  }

  return {
    getCategories,
    getItems,
    getMyItems,
    getFavorites,
    getItemDetail,
    createItem,
    updateItem,
    deleteItem,
    addFavorite,
    removeFavorite,
    checkFavorite
  }
})
