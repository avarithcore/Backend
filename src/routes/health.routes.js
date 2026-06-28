const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Health check endpoint untuk monitoring, KONTOL!
 * Cek status database dan server.
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }[dbState] || 'unknown';

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    version: process.env.npm_package_version || '1.0.0'
  });
});

module.exports = router;