const jwt = require('jsonwebtoken');
const SECRET_KEY = 'neighborhood-trade-secret-key-2024';

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: '无效的认证令牌' });
  }
};

module.exports = { auth, SECRET_KEY };
