//服务器端
const express = require('express');
const app = express();
app.get('/', (req, res) => {
    res.json({
        status: 200,
        arr: [
            { title: 'this is tittle1', content: 'hello node' },
            { title: 'this is tittle2', content: 'hello node2' }
        ]
    });
});
app.listen(3000);