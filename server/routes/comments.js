const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

router.get('/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const { page = 1, pageSize = 20 } = req.query;

  db.get('SELECT id FROM items WHERE id = ?', [itemId], (err, item) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (!item) return res.status(404).json({ message: '物品不存在' });

    const countSql = 'SELECT COUNT(*) as total FROM comments WHERE item_id = ? AND parent_id = 0';
    db.get(countSql, [itemId], (err, result) => {
      if (err) return res.status(500).json({ message: '获取评论总数失败' });

      const total = result.total;
      const offset = (page - 1) * pageSize;

      const parentSql = `
        SELECT comments.*, users.nickname as user_name, users.avatar as user_avatar
        FROM comments
        LEFT JOIN users ON comments.user_id = users.id
        WHERE comments.item_id = ? AND comments.parent_id = 0
        ORDER BY comments.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.all(parentSql, [itemId, parseInt(pageSize), offset], (err, parents) => {
        if (err) return res.status(500).json({ message: '获取评论失败' });

        if (parents.length === 0) {
          return res.json({
            comments: [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total,
              totalPages: Math.ceil(total / pageSize)
            }
          });
        }

        const parentIds = parents.map(p => p.id);
        const placeholders = parentIds.map(() => '?').join(',');

        const replySql = `
          SELECT c.*, 
                 u.nickname as user_name, u.avatar as user_avatar,
                 ru.nickname as reply_to_name
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          LEFT JOIN users ru ON c.reply_to_user_id = ru.id
          WHERE c.parent_id IN (${placeholders})
          ORDER BY c.created_at ASC
        `;

        db.all(replySql, parentIds, (err, replies) => {
          if (err) return res.status(500).json({ message: '获取回复失败' });

          const replyMap = {};
          replies.forEach(reply => {
            if (!replyMap[reply.parent_id]) {
              replyMap[reply.parent_id] = [];
            }
            replyMap[reply.parent_id].push(reply);
          });

          const comments = parents.map(parent => ({
            ...parent,
            replies: replyMap[parent.id] || []
          }));

          res.json({
            comments,
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
  });
});

router.post('/', auth, (req, res) => {
  const { itemId, content, parentId = 0, replyToUserId = null } = req.body;

  if (!itemId || !content || !content.trim()) {
    return res.status(400).json({ message: '物品ID和评论内容不能为空' });
  }

  db.get('SELECT id, user_id FROM items WHERE id = ?', [itemId], (err, item) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (!item) return res.status(404).json({ message: '物品不存在' });

    let sql = 'INSERT INTO comments (item_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)';
    let params = [itemId, req.user.id, parentId, content.trim()];

    if (parentId && parentId > 0) {
      db.get('SELECT id, user_id FROM comments WHERE id = ?', [parentId], (err, parentComment) => {
        if (err) return res.status(500).json({ message: '数据库错误' });
        if (!parentComment) return res.status(404).json({ message: '被回复的评论不存在' });

        const replyTo = replyToUserId || parentComment.user_id;
        sql = 'INSERT INTO comments (item_id, user_id, parent_id, reply_to_user_id, content) VALUES (?, ?, ?, ?, ?)';
        params = [itemId, req.user.id, parentId, replyTo, content.trim()];

        db.run(sql, params, function(err) {
          if (err) return res.status(500).json({ message: '回复失败' });

          const newId = this.lastID;
          const querySql = `
            SELECT c.*, 
                   u.nickname as user_name, u.avatar as user_avatar,
                   ru.nickname as reply_to_name
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN users ru ON c.reply_to_user_id = ru.id
            WHERE c.id = ?
          `;
          db.get(querySql, [newId], (err, comment) => {
            if (err) return res.status(500).json({ message: '获取回复详情失败' });
            res.json({ message: '回复成功', comment });
          });
        });
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ message: '评论失败' });

        const newId = this.lastID;
        const querySql = `
          SELECT c.*, u.nickname as user_name, u.avatar as user_avatar
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.id = ?
        `;
        db.get(querySql, [newId], (err, comment) => {
          if (err) return res.status(500).json({ message: '获取评论详情失败' });
          res.json({ message: '评论成功', comment: { ...comment, replies: [] } });
        });
      });
    }
  });
});

router.delete('/:id', auth, (req, res) => {
  const commentId = req.params.id;

  db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (!comment) return res.status(404).json({ message: '评论不存在' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ message: '无权限删除' });

    db.run('DELETE FROM comments WHERE id = ? OR parent_id = ?', [commentId, commentId], function(err) {
      if (err) return res.status(500).json({ message: '删除评论失败' });
      res.json({ message: '删除成功' });
    });
  });
});

router.get('/count/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  db.get('SELECT COUNT(*) as count FROM comments WHERE item_id = ?', [itemId], (err, result) => {
    if (err) return res.status(500).json({ message: '获取评论数失败' });
    res.json({ count: result.count });
  });
});

module.exports = router;
