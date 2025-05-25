const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * 生成JWT令牌
 * @param {Object} payload - 要编码到令牌中的数据
 * @returns {string} JWT令牌
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwt.expiresIn });
};

/**
 * 验证JWT令牌
 * @param {string} token - 要验证的JWT令牌
 * @returns {Object|null} 解码后的payload或null
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 