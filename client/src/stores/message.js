import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useMessageStore = defineStore('message', () => {
  const getConversations = async () => {
    return await request.get('/messages/conversations')
  }

  const getMessages = async (otherUserId, params = {}) => {
    return await request.get(`/messages/${otherUserId}`, { params })
  }

  const sendMessage = async (data) => {
    return await request.post('/messages', data)
  }

  const getUnreadCount = async () => {
    return await request.get('/messages/unread/count')
  }

  return {
    getConversations,
    getMessages,
    sendMessage,
    getUnreadCount
  }
})
