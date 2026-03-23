const express = require('express');
const router = express.Router();

// No-op route to pass requests to main server
router.use((req, res, next) => {
  next(); // Pass through to main server
});

module.exports = router;
