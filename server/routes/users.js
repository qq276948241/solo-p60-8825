const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth, SECRET_KEY } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { username, password, nickname, phone } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (row) return res.status(400).json({ message: '用户名已存在' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = 'INSERT INTO users (username, password, nickname, phone) VALUES (?, ?, ?, ?)';
    db.run(sql, [username, hashedPassword, nickname || username, phone || ''], function(err) {
      if (err) return res.status(500).json({ message: '注册失败' });
      
      const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY, { expiresIn: '7d' });
      res.json({
        message: '注册成功',
        token,
        user: { id: this.lastID, username, nickname: nickname || username }
      });
    });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.get(sql, [username], (err, user) => {
    if (err) return res.status(500).json({ message: '数据库错误' });
    if (!user) return res.status(400).json({ message: '用户名或密码错误' });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  });
});

router.get('/profile', auth, (req, res) => {
  const sql = 'SELECT id, username, nickname, phone, avatar, created_at FROM users WHERE id = ?';
  db.get(sql, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ message: '获取用户信息失败' });
    if (!user) return res.status(404).json({ message: '用户不存在' });
    res.json({ user });
  });
});

router.get('/:id', auth, (req, res) => {
  const sql = 'SELECT id, username, nickname, phone, avatar FROM users WHERE id = ?';
  db.get(sql, [req.params.id], (err, user) => {
    if (err) return res.status(500).json({ message: '获取用户信息失败' });
    if (!user) return res.status(404).json({ message: '用户不存在' });
    res.json({ user });
  });
});

module.exports = router;
