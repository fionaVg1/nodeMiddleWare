//请求后端拿到数据
//和模板结合生成html
//返回
const request = require('request');

function index(req, res) {
    request({
        url: 'http://localhost:3000/',
        method: 'GET'
    }, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            let data = JSON.parse(body);
            res.render('./index.art', data);
        }
    });
}
module.exports = index;