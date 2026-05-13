const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/checkout', checkout);

module.exports = router;