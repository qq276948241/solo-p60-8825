import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCommentStore } from '@/stores/comments'
import { useUserStore } from '@/stores/user'
import { showToast } from '@/utils/helpers'

export function useItemComments(itemId) {
  const router = useRouter()
  const commentStore = useCommentStore()
  const userStore = useUserStore()

  const comments = ref([])
  const commentsLoading = ref(false)
  const newComment = ref('')
  const submittingComment = ref(false)
  const submittingReply = ref(false)
  const replyingTo = ref(null)
  const replyContent = ref('')
  const replyToUser = ref(null)

  const fetchComments = async () => {
    try {
      commentsLoading.value = true
      const res = await commentStore.getComments(itemId.value)
      comments.value = res.comments
    } catch (err) {
      showToast('加载评论失败', 'error')
    } finally {
      commentsLoading.value = false
    }
  }

  const submitComment = async () => {
    if (!newComment.value.trim()) return

    try {
      submittingComment.value = true
      const res = await commentStore.addComment({
        itemId: itemId.value,
        content: newComment.value.trim()
      })
      comments.value.unshift(res.comment)
      newComment.value = ''
      showToast('发布成功')
    } catch (err) {
      showToast(err.message || '发布失败', 'error')
    } finally {
      submittingComment.value = false
    }
  }

  const showReplyInput = (comment) => {
    if (!userStore.isLoggedIn) {
      router.push('/login')
      return
    }
    replyingTo.value = comment.id
    replyToUser.value = { id: comment.user_id, name: comment.user_name }
    replyContent.value = ''
  }

  const showReplyToReply = (parentComment, reply) => {
    if (!userStore.isLoggedIn) {
      router.push('/login')
      return
    }
    replyingTo.value = parentComment.id
    replyToUser.value = { id: reply.user_id, name: reply.user_name }
    replyContent.value = ''
  }

  const cancelReply = () => {
    replyingTo.value = null
    replyToUser.value = null
    replyContent.value = ''
  }

  const submitReply = async (parentComment) => {
    if (!replyContent.value.trim()) return

    try {
      submittingReply.value = true
      const res = await commentStore.addComment({
        itemId: itemId.value,
        content: replyContent.value.trim(),
        parentId: parentComment.id,
        replyToUserId: replyToUser.value?.id || parentComment.user_id
      })
      if (!parentComment.replies) {
        parentComment.replies = []
      }
      parentComment.replies.push(res.comment)
      cancelReply()
      showToast('回复成功')
    } catch (err) {
      showToast(err.message || '回复失败', 'error')
    } finally {
      submittingReply.value = false
    }
  }

  const deleteComment = async (comment) => {
    if (!confirm('确定要删除这条评论吗？')) return

    try {
      await commentStore.deleteComment(comment.id)
      if (comment.parent_id && comment.parent_id > 0) {
        const parent = comments.value.find(c => c.id === comment.parent_id)
        if (parent && parent.replies) {
          parent.replies = parent.replies.filter(r => r.id !== comment.id)
        }
      } else {
        comments.value = comments.value.filter(c => c.id !== comment.id)
      }
      showToast('删除成功')
    } catch (err) {
      showToast(err.message || '删除失败', 'error')
    }
  }

  return {
    comments,
    commentsLoading,
    newComment,
    submittingComment,
    submittingReply,
    replyingTo,
    replyContent,
    replyToUser,
    fetchComments,
    submitComment,
    showReplyInput,
    showReplyToReply,
    cancelReply,
    submitReply,
    deleteComment
  }
}
