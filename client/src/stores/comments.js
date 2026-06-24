import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useCommentStore = defineStore('comment', () => {
  const getComments = async (itemId, params = {}) => {
    return await request.get(`/comments/${itemId}`, { params })
  }

  const addComment = async (data) => {
    return await request.post('/comments', data)
  }

  const deleteComment = async (id) => {
    return await request.delete(`/comments/${id}`)
  }

  const getCommentCount = async (itemId) => {
    return await request.get(`/comments/count/${itemId}`)
  }

  return {
    getComments,
    addComment,
    deleteComment,
    getCommentCount
  }
})
