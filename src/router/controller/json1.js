function index(req, res) {
    res.end(JSON.stringify({
        status: '200',
        mes: 'this a is ' + req.body.a
    }));
}
module.exports = index;