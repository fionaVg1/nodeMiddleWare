const multiparty = require("multiparty");
const fs = require('fs');
const fse = require("fs-extra");
const path = require("path");
const UPLOAD_DIR = path.resolve(__dirname, "..", "target"); // 大文件存储目录
function upload(req, res) {
    const multipart = new multiparty.Form();
    multipart.parse(req, async(err, fields, files) => {
        if (err) {
            return;
        }
        const [file] = files.file;
        const [index] = fields.index;
        const [hash] = fields.hash;
        const filename = hash + '_' + index;
        const fileDir = path.resolve(UPLOAD_DIR, hash);

        // 切片目录不存在，创建切片目录
        if (!fse.existsSync(fileDir)) {
            await fse.mkdirs(fileDir);
        }

        await fse.move(file.path, `${fileDir}/${filename}`);
        res.end("received file chunk");
    });
}
const pipeStream = (path, writeStream) => {
    return new Promise(resolve => {
        const readStream = fse.createReadStream(path);
        readStream.on('end', () => {
            fse.unlinkSync(path);
            resolve();
        });
        readStream.pipe(writeStream);
    })
}
async function merge(req, res) {
    const hash = req.query.hash;
    const size = req.query.size;
    const fileName = req.query.fileName;
    const fileDir = path.resolve(UPLOAD_DIR, hash);
    const filePaths = await fse.readdir(fileDir);
    //根据切片的index进行排序
    filePaths.sort((value, value2) => {
        return value.split('-')[1] - value2.split('-')[1]
    });
    let promises = [];
    filePaths.map((filePath, index) => {
        promises.push(pipeStream(path.resolve(fileDir, filePath), fse.createWriteStream(`${fileDir}/${fileName}`, { start: index * size, end: (index + 1) * size })));
    })
    Promise.all(
        promises
    ).then(() => {
        //合并完以后删除切片目录   
        fse.rmdir(fileDir);
        res.end(
            JSON.stringify({
                code: 200,
                message: 'file merged success'
            })
        );
    })
}

function verify(req, res) {
    const hash = req.query.hash;
    const fileName = req.query.fileName;
    const fileDir = path.resolve(UPLOAD_DIR, hash);
    const filePath = path.resolve(UPLOAD_DIR, `${hash}/${fileName}`);
    if (fse.existsSync(filePath)) {
        res.end(JSON.stringify({
            isUploaded: true
        }));
    } else {
        let uploadedList = fse.readdir(fileDir) || [];
        res.end(
            JSON.stringify({
                isUploaded: false,
                uploadedList: uploadedList
            })
        );
    }

}
module.exports = { upload: upload, merge: merge, verify: verify };