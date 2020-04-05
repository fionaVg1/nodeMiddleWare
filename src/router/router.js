const express = require('express');
let router = express.Router();
let index = require('./controller/index.js');
let json1 = require('./controller/json1.js');
router.get('/', index);
router.post('/json1', json1);
module.exports = router;