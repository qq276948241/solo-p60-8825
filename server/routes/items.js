const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY id', (err, categories) => {
    if (err) return res.status(500).json({ message: '获取分类失败' });
    res.json({ categories });
  });
});

router.get('/', (req, res) => {
  const { keyword, category, minPrice, maxPrice, page = 1, pageSize = 10 } = req.query;
  
  let sql = `
    SELECT items.*, users.nickname as seller_name, users.avatar as seller_avatar,
           (SELECT COUNT(*) FROM favorites WHERE favorites.item_id = items.id) as favorite_count
    FROM items 
    LEFT JOIN users ON items.user_id = users.id 
    WHERE items.status = 1
  `;
  let params = [];

  if (keyword) {
    sql += ' AND (items.title LIKE ? OR items.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (category && category !== 'all') {
    sql += ' AND items.category = ?';
    params.push(category);
  }
  if (minPrice) {
    sql += ' AND items.price >= ?';
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    sql += ' AND items.price <= ?';
    params.push(parseFloat(maxPrice));
  }

  const countSql = sql.replace('SELECT items.*', 'SELECT COUNT(*) as total');
  db.get(countSql, params, (err, result) => {
    if (err) return res.status(500).json({ message: '获取总数失败' });
    
    const total = result.total;
    const offset = (page - 1) * pageSize;
    sql += ' ORDER BY items.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    db.all(sql, params, (err, items) => {
      if (err) return res.status(500).json({ message: '获取物品列表失败' });
      
      items.forEach(item => {
        if (item.images) {
          item.images = JSON.parse(item.images);
        }
      });

      res.json({
        items,
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

router.get('/my', auth, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  
  const countSql = 'SELECT COUNT(*) as total FROM items WHERE user_id = ?';
  db.get(countSql, [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: '获取总数失败' });
    
    const total = result.total;
    const offset = (page - 1) * pageSize;
    
    const sql = `
      SELECT items.*, 
             (SELECT COUNT(*) FROM favorites WHERE favorites.item_id = items.id) as favorite_count
      FROM items 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    db.all(sql, [req.user.id, parseInt(pageSize), offset], (err, items) => {
      if (err) return res.status(500).json({ message: '获取我的物品失败' });
      
      items.forEach(item => {
        if (item.images) {
          item.images = JSON.parse(item.images);
        }
      });

      res.json({
        items,
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

router.get('/favorites', auth, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  
  const countSql = `
    SELECT COUNT(*) as total FROM favorites 
    INNER JOIN items ON favorites.item_id = items.id
    WHERE favorites.user_id = ? AND items.status = 1
  `;
  
  db.get(countSql, [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: '获取总数失败' });
    
    const total = result.total;
    const offset = (page - 1) * pageSize;
    
    const sql = `
      SELECT items.*, users.nickname as seller_name, users.avatar as seller_avatar,
             1 as is_favorited
      FROM favorites 
      INNER JOIN items ON favorites.item_id = items.id
      LEFT JOIN users ON items.user_id = users.id
      WHERE favorites.user_id = ? AND items.status = 1
      ORDER BY favorites.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    db.all(sql, [req.user.id, parseInt(pageSize), offset], (err, items) => {
      if (err) return res.status(500).json({ message: '获取收藏列表失败' });
      
      items.forEach(item => {
        if (item.images) {
          item.images = JSON.parse(item.images);
        }
      });

      res.json({
        items,
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

router.get('/:id', (req, res) => {
  const itemId = req.params.id;
  
  const sql = `
    SELECT items.*, users.nickname as seller_name, users.avatar as seller_avatar,
           (SELECT COUNT(*) FROM favorites WHERE favorites.item_id = items.id) as favorite_count
    FROM items 
    LEFT JOIN users ON items.user_id = users.id 
    WHERE items.id = ?
  `;
  
  db.get(sql, [itemId], (err, item) => {
    if (err) return res.status(500).json({ message: '获取物品详情失败' });
    if (!item) return res.status(404).json({ message: '物品不存在' });
    
    if (item.images) {
      item.images = JSON.parse(item.images);
    }
    
    res.json({ item });
  });
});

router.post('/', auth, upload.array('images', 5), (req, res) => {
  const { title, description, price, category } = req.body;
  
  if (!title || !price || !category) {
    return res.status(400).json({ message: '标题、价格和分类不能为空' });
  }

  const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
  const imagesJson = JSON.stringify(images);

  const sql = 'INSERT INTO items (user_id, title, description, price, category, images) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [req.user.id, title, description || '', parseFloat(price), category, imagesJson], function(err) {
    if (err) return res.status(500).json({ message: '发布物品失败' });
    res.json({
      message: '发布成功',
      itemId: this.lastID
    });
  });
});

router.put('/:id', auth, upload.array('images', 5), (req, res) => {
  const itemId = req.params.id;
  const { title, description, price, category, status, existingImages } = req.body;
  
  db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (!item) return res.status(404).json({ message: '物品不存在' });
    if (item.user_id !== req.user.id) return res.status(403).json({ message: '无权限修改' });

    let images = [];
    if (existingImages) {
      images = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    }
    if (req.files) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      images = [...images, ...newImages];
    }
    const imagesJson = JSON.stringify(images);

    const sql = 'UPDATE items SET title = ?, description = ?, price = ?, category = ?, images = ?, status = ? WHERE id = ?';
    db.run(sql, [
      title || item.title,
      description !== undefined ? description : item.description,
      price !== undefined ? parseFloat(price) : item.price,
      category || item.category,
      imagesJson,
      status !== undefined ? status : item.status,
      itemId
    ], (err) => {
      if (err) return res.status(500).json({ message: '更新物品失败' });
      res.json({ message: '更新成功' });
    });
  });
});

router.delete('/:id', auth, (req, res) => {
  const itemId = req.params.id;
  
  db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (!item) return res.status(404).json({ message: '物品不存在' });
    if (item.user_id !== req.user.id) return res.status(403).json({ message: '无权限删除' });

    db.run('UPDATE items SET status = 0 WHERE id = ?', [itemId], (err) => {
      if (err) return res.status(500).json({ message: '删除物品失败' });
      res.json({ message: '删除成功' });
    });
  });
});

router.post('/:id/favorite', auth, (req, res) => {
  const itemId = req.params.id;
  
  db.get('SELECT id FROM items WHERE id = ?', [itemId], (err, item) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (!item) return res.status(404).json({ message: '物品不存在' });

    db.run('INSERT OR IGNORE INTO favorites (user_id, item_id) VALUES (?, ?)', [req.user.id, itemId], function(err) {
      if (err) return res.status(500).json({ message: '收藏失败' });
      if (this.changes === 0) {
        return res.status(400).json({ message: '已收藏过该物品' });
      }
      res.json({ message: '收藏成功' });
    });
  });
});

router.delete('/:id/favorite', auth, (req, res) => {
  const itemId = req.params.id;
  
  db.run('DELETE FROM favorites WHERE user_id = ? AND item_id = ?', [req.user.id, itemId], function(err) {
    if (err) return res.status(500).json({ message: '取消收藏失败' });
    if (this.changes === 0) {
      return res.status(404).json({ message: '未收藏该物品' });
    }
    res.json({ message: '取消收藏成功' });
  });
});

router.get('/:id/is-favorited', auth, (req, res) => {
  const itemId = req.params.id;
  
  db.get('SELECT id FROM favorites WHERE user_id = ? AND item_id = ?', [req.user.id, itemId], (err, row) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    res.json({ isFavorited: !!row });
  });
});

module.exports = router;
