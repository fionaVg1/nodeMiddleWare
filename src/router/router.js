const express = require('express');
let router = express.Router();
let index = require('./controller/index.js');
let json1 = require('./controller/json1.js');
let bigFileUpload = require('./controller/bigFileUpload.js');
router.get('/', index);
router.post('/json1', json1);
router.post('/upload/bigFile', bigFileUpload);
module.exports = router;