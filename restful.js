const express = require('express');
const bodyParse = require('body-parser');
const mysql = require('mysql');
const co = require('co-mysql');
const md5 = require('md5-node');

const app = express();

let db = mysql.createPool({
    host:'localhost',
    user:'root',
    password:'root',
    database:'user'
});
let conn = co(db);

app.use(bodyParse.urlencoded({
    extended:true
}));
app.use(bodyParse.json());
app.post('/user',async (req,res)=>{
    let {username,password} = req.body;
    let data = await conn.query(`select user from admin where username = '${username}'`);
    if(data.length >= 1){
        res.send(JSON.stringify({status:200,message:'用户名已经注册'}));
    }else{
        password = md5(password);
        let sql = `insert into admin (username,password) values ('${username}','${password}')`;
        await conn.query(sql);
        res.end(JSON.stringify({status:200,message:'用户注册成功'}));
    }
});
app.get('/user/:id',(res,res)=>{
    res.send(res.params.id);
});

//顶层路由设计，不需要有物理地址对应
app.get('/restful',(req,res)=>{
    res.send('restful test');
});
app.listen(3000);