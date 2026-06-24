const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

router.get('/conversations', auth, (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT 
      CASE 
        WHEN m.sender_id = ? THEN m.receiver_id 
        ELSE m.sender_id 
      END as other_user_id,
      u.nickname as other_user_name,
      u.avatar as other_user_avatar,
      m.item_id,
      i.title as item_title,
      m.content as last_message,
      m.created_at as last_message_time,
      SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count
    FROM messages m
    LEFT JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    LEFT JOIN items i ON i.id = m.item_id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY other_user_id, m.item_id
    ORDER BY m.created_at DESC
  `;
  
  db.all(sql, [userId, userId, userId, userId, userId], (err, conversations) => {
    if (err) return res.status(500).json({ message: '获取会话列表失败' });
    res.json({ conversations });
  });
});

router.get('/:otherUserId', auth, (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const { itemId, page = 1, pageSize = 20 } = req.query;
  
  const countSql = `
    SELECT COUNT(*) as total FROM messages 
    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    ${itemId ? 'AND item_id = ?' : ''}
  `;
  
  const countParams = [userId, otherUserId, otherUserId, userId];
  if (itemId) countParams.push(itemId);
  
  db.get(countSql, countParams, (err, result) => {
    if (err) return res.status(500).json({ message: '获取消息总数失败' });
    
    const total = result.total;
    const offset = (page - 1) * pageSize;
    
    const sql = `
      SELECT m.*, 
             sender.nickname as sender_name, 
             sender.avatar as sender_avatar,
             receiver.nickname as receiver_name,
             receiver.avatar as receiver_avatar,
             i.title as item_title
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users receiver ON m.receiver_id = receiver.id
      LEFT JOIN items i ON m.item_id = i.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
      ${itemId ? 'AND m.item_id = ?' : ''}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const params = [userId, otherUserId, otherUserId, userId];
    if (itemId) params.push(itemId);
    params.push(parseInt(pageSize), offset);
    
    db.all(sql, params, (err, messages) => {
      if (err) return res.status(500).json({ message: '获取消息列表失败' });
      
      const updateSql = `
        UPDATE messages SET is_read = 1 
        WHERE sender_id = ? AND receiver_id = ?
        ${itemId ? 'AND item_id = ?' : ''}
      `;
      const updateParams = [otherUserId, userId];
      if (itemId) updateParams.push(itemId);
      
      db.run(updateSql, updateParams);
      
      messages.reverse();
      
      res.json({
        messages,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    });
  });
});

router.post('/', auth, (req, res) => {
  const { receiverId, itemId, content } = req.body;
  const senderId = req.user.id;
  
  if (!receiverId || !content) {
    return res.status(400).json({ message: '接收者和内容不能为空' });
  }
  
  if (parseInt(receiverId) === senderId) {
    return res.status(400).json({ message: '不能给自己发消息' });
  }
  
  const sql = 'INSERT INTO messages (sender_id, receiver_id, item_id, content) VALUES (?, ?, ?, ?)';
  db.run(sql, [senderId, receiverId, itemId || null, content], function(err) {
    if (err) return res.status(500).json({ message: '发送消息失败' });
    
    db.get(`
      SELECT m.*, 
             sender.nickname as sender_name, 
             sender.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      WHERE m.id = ?
    `, [this.lastID], (err, message) => {
      if (err) return res.status(500).json({ message: '获取消息失败' });
      res.json({
        message: '发送成功',
        data: message
      });
    });
  });
});

router.get('/unread/count', auth, (req, res) => {
  const userId = req.user.id;
  
  db.get('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0', [userId], (err, result) => {
    if (err) return res.status(500).json({ message: '获取未读消息数失败' });
    res.json({ count: result.count });
  });
});

module.exports = router;
