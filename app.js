//中间层
const express = require('express');
const app = express();
const router = require('./src/router/router.js');
const bodyParser = require('body-parser');
//设置静态资源目录
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.engine('art', require('express-art-template'));
app.set('views', './src/views');
app.use('/', router);
app.listen(3300);