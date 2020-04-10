const multiparty = require("multiparty");
const fs = require('fs');
const path = require("path");
const UPLOAD_DIR = path.resolve(__dirname, "..", "target"); // 大文件存储目录
function index(req, res) {
    const multipart = new multiparty.Form();
    multipart.parse(req, async(err, fields, files) => {
        if (err) {
            return;
        }

        const [file] = files.file;
        const [context] = fields.context;
        const [index] = fields.index;
        const filename = context + '_' + index;
        const fileDir = path.resolve(UPLOAD_DIR, filename);

        // 切片目录不存在，创建切片目录
        if (!fs.existsSync(fileDir)) {
            await fs.mkdirs(fileDir);
        }

        await fse.move(file.path, `${fileDir}/${context}`);
        res.end("received file chunk");
    });
}
module.exports = index;